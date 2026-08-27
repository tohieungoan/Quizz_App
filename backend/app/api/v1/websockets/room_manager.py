import json
import logging
import uuid
import asyncio
from typing import Dict, List, Optional
from fastapi import WebSocket
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

REDIS_CHANNEL_PREFIX = "quizz:room:"
REDIS_CHANNEL = "quizz_room_events"

class RoomConnectionManager:
    def __init__(self):
        # Maps room_code -> { nickname: websocket }
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # Maps room_code -> { nickname: asyncio.Task }
        self.pending_disconnect_tasks: Dict[str, Dict[str, asyncio.Task]] = {}
        self.worker_id = str(uuid.uuid4())
        self._listener_task: Optional[asyncio.Task] = None
        self._pubsub_client: Optional[aioredis.Redis] = None
        self._pub_client: Optional[aioredis.Redis] = None

    def _get_pub_client(self) -> aioredis.Redis:
        if not self._pub_client:
            self._pub_client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5.0,
                socket_timeout=5.0,
            )
        return self._pub_client

    async def connect(self, websocket: WebSocket, room_code: str, nickname: str):
        await websocket.accept()

        # Cancel any pending graceful disconnect task if user reconnected
        if room_code in self.pending_disconnect_tasks and nickname in self.pending_disconnect_tasks[room_code]:
            task = self.pending_disconnect_tasks[room_code].pop(nickname)
            if not task.done():
                task.cancel()
                logger.info(f"Cancelled pending disconnect task for '{nickname}' in room '{room_code}' upon re-connection")

        if room_code not in self.active_connections:
            self.active_connections[room_code] = {}
        self.active_connections[room_code][nickname] = websocket

    def schedule_graceful_disconnect(self, room_code: str, nickname: str, grace_seconds: int = 6):
        """Schedules a background task to clean up a participant if they do not reconnect within grace_seconds."""
        if room_code not in self.pending_disconnect_tasks:
            self.pending_disconnect_tasks[room_code] = {}

        existing_task = self.pending_disconnect_tasks[room_code].get(nickname)
        if existing_task and not existing_task.done():
            existing_task.cancel()

        async def _do_graceful_disconnect():
            try:
                await asyncio.sleep(grace_seconds)
                logger.info(f"Grace period ({grace_seconds}s) expired for client '{nickname}' in room '{room_code}'. Cleaning up...")

                from starlette.concurrency import run_in_threadpool
                from app.db.session import SessionLocal
                from app.crud.crud_room import crud_room
                from app.models.room import Participant
                from app.api.v1.websockets.admin_room_manager import admin_room_manager

                def _do_db_cleanup():
                    with SessionLocal() as db_session:
                        db_room = crud_room.get_by_code(db=db_session, room_code=room_code)
                        if not db_room:
                            return None, None
                        p = db_session.query(Participant).filter(
                            Participant.room_id == db_room.id,
                            Participant.nickname == nickname
                        ).first()
                        if p:
                            if db_room.status == "WAITING":
                                db_session.delete(p)
                            else:
                                p.status = "LEFT"
                            db_session.commit()

                        remaining_list = db_session.query(Participant.nickname).filter(
                            Participant.room_id == db_room.id,
                            Participant.status != "LEFT"
                        ).all()
                        remaining_nicknames = [r[0] for r in remaining_list]
                        return db_room.id, remaining_nicknames

                room_id, remaining_members = await run_in_threadpool(_do_db_cleanup)
                if remaining_members is not None:
                    await self.broadcast_to_room(
                        room_code,
                        {
                            "type": "PLAYER_LEFT",
                            "t": "PL",
                            "player": nickname,
                            "u": nickname,
                            "players": remaining_members,
                            "p": remaining_members,
                        }
                    )
                    if room_id:
                        await admin_room_manager.publish(
                            room_id=room_id,
                            room_code=room_code,
                            reason="PARTICIPANT_LEFT",
                        )
            except asyncio.CancelledError:
                logger.info(f"Graceful disconnect timer cancelled for '{nickname}' in room '{room_code}'")
            finally:
                if room_code in self.pending_disconnect_tasks and nickname in self.pending_disconnect_tasks[room_code]:
                    self.pending_disconnect_tasks[room_code].pop(nickname, None)

        task = asyncio.create_task(_do_graceful_disconnect())
        self.pending_disconnect_tasks[room_code][nickname] = task

    def disconnect(self, websocket: WebSocket, room_code: str, nickname: str):
        if room_code in self.active_connections:
            if nickname in self.active_connections[room_code]:
                del self.active_connections[room_code][nickname]
            if not self.active_connections[room_code]:
                del self.active_connections[room_code]

    async def broadcast_local(self, room_code: str, message: dict):
        """Sends WebSocket message only to clients connected directly to THIS worker instance."""
        if room_code in self.active_connections:
            for nickname in list(self.active_connections[room_code].keys()):
                ws = self.active_connections[room_code].get(nickname)
                if ws:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        self.disconnect(ws, room_code, nickname)

    async def _publish_async(self, channel: str, payload: str):
        try:
            redis_client = self._get_pub_client()
            await redis_client.publish(channel, payload)
        except Exception as e:
            logger.warning(f"Failed to publish room event to Redis Pub/Sub channel: {e}")

    async def broadcast_to_room(self, room_code: str, message: dict, publish: bool = True):
        """
        Broadcasts message to local clients on this worker immediately (<1ms),
        and asynchronously publishes to Redis Pub/Sub for other workers without blocking.
        """
        # 1. Send locally first (instant <1ms latency)
        await self.broadcast_local(room_code, message)

        # 2. Asynchronously publish to Redis Pub/Sub in background task
        if publish:
            payload = json.dumps({
                "sender_id": self.worker_id,
                "room_code": room_code,
                "message": message
            })
            channel = f"{REDIS_CHANNEL_PREFIX}{room_code}"
            asyncio.create_task(self._publish_async(channel, payload))

    def get_room_members(self, room_code: str) -> List[str]:
        if room_code in self.active_connections:
            return list(self.active_connections[room_code].keys())
        return []

    async def start_pubsub_listener(self):
        """Background listener task with auto-reconnect loop receiving room events via Redis Pub/Sub."""
        logger.info(f"Worker [{self.worker_id[:8]}] starting Redis Pub/Sub listener loop...")
        while True:
            try:
                self._pubsub_client = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5.0,
                    socket_timeout=None,  # Keep socket open indefinitely for listening
                )
                pubsub = self._pubsub_client.pubsub()
                pattern = f"{REDIS_CHANNEL_PREFIX}*"
                await pubsub.psubscribe(pattern, REDIS_CHANNEL)
                logger.info(f"Worker [{self.worker_id[:8]}] successfully subscribed to Redis Pub/Sub channels")

                async for msg in pubsub.listen():
                    if msg and msg.get("type") in ["pmessage", "message"]:
                        try:
                            channel = msg.get("channel", "")
                            room_code = channel.split(":")[-1] if ":" in channel else None
                            
                            data_raw = msg.get("data")
                            if not data_raw or not isinstance(data_raw, str):
                                continue
                                
                            data = json.loads(data_raw)
                            sender_id = data.get("sender_id")
                            target_room = data.get("room_code") or room_code
                            message = data.get("message")

                            # Dispatch to local WebSocket clients if connected on this worker instance
                            if target_room and message and target_room in self.active_connections:
                                if sender_id != self.worker_id:
                                    await self.broadcast_local(target_room, message)
                        except Exception as parse_err:
                            logger.error(f"Error parsing Pub/Sub message: {parse_err}")
            except asyncio.CancelledError:
                logger.info(f"Worker [{self.worker_id[:8]}] Pub/Sub listener task cancelled.")
                break
            except Exception as e:
                logger.warning(f"Worker [{self.worker_id[:8]}] Redis Pub/Sub connection lost ({e}). Reconnecting in 2s...")
                await asyncio.sleep(2.0)
            finally:
                if self._pubsub_client:
                    try:
                        await self._pubsub_client.close()
                    except Exception:
                        pass

    def start_listener_task(self):
        if not self._listener_task or self._listener_task.done():
            self._listener_task = asyncio.create_task(self.start_pubsub_listener())

    def stop_listener_task(self):
        if self._listener_task and not self._listener_task.done():
            self._listener_task.cancel()

room_websocket_manager = RoomConnectionManager()


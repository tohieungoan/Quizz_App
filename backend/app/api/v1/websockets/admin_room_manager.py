import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Coroutine, Dict, List, Optional

import redis.asyncio as aioredis
from fastapi import WebSocket

from app.core.config import settings


logger = logging.getLogger(__name__)

ADMIN_ROOM_CHANNEL = "quizz:admin:room-events"
SEND_TIMEOUT_SECONDS = 5.0


class AdminRoomConnectionManager:
    """Fan out room invalidation events to authenticated admin dashboards."""

    def __init__(self) -> None:
        self.worker_id = str(uuid.uuid4())
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self._connection_locks: Dict[WebSocket, asyncio.Lock] = {}
        self._listener_task: Optional[asyncio.Task] = None
        self._pending_invalidations: Dict[int, asyncio.Task] = {}
        self._pending_reasons: Dict[int, set[str]] = {}
        self._delivery_tasks: set[asyncio.Task] = set()
        self._pub_client: Optional[aioredis.Redis] = None
        self._pubsub_client: Optional[aioredis.Redis] = None

    async def connect(self, websocket: WebSocket, admin_id: int) -> None:
        await websocket.accept(subprotocol="bearer")
        self.active_connections.setdefault(admin_id, []).append(websocket)
        self._connection_locks[websocket] = asyncio.Lock()

    def disconnect(self, websocket: WebSocket, admin_id: int) -> None:
        connections = self.active_connections.get(admin_id)
        if connections and websocket in connections:
            connections.remove(websocket)
            if not connections:
                self.active_connections.pop(admin_id, None)
        self._connection_locks.pop(websocket, None)

    async def _send_safe(self, admin_id: int, websocket: WebSocket, event: dict) -> None:
        lock = self._connection_locks.setdefault(websocket, asyncio.Lock())
        try:
            async with lock:
                if websocket not in self.active_connections.get(admin_id, []):
                    return
                await asyncio.wait_for(
                    websocket.send_json(event),
                    timeout=SEND_TIMEOUT_SECONDS,
                )
        except asyncio.CancelledError:
            raise
        except Exception as error:
            logger.debug("Dropping stale admin room socket: %s", error)
            self.disconnect(websocket, admin_id)

    async def broadcast_local(self, event: dict) -> None:
        targets = [
            (admin_id, websocket)
            for admin_id, connections in list(self.active_connections.items())
            for websocket in list(connections)
        ]
        if targets:
            await asyncio.gather(
                *(self._send_safe(admin_id, websocket, event) for admin_id, websocket in targets)
            )

    async def send_to(self, admin_id: int, websocket: WebSocket, event: dict) -> None:
        await self._send_safe(admin_id, websocket, event)

    def _get_pub_client(self) -> aioredis.Redis:
        if self._pub_client is None:
            self._pub_client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5.0,
                socket_timeout=5.0,
            )
        return self._pub_client

    def _track_task(self, coroutine: Coroutine[Any, Any, None]) -> None:
        task = asyncio.create_task(coroutine)
        self._delivery_tasks.add(task)
        task.add_done_callback(self._delivery_tasks.discard)

    async def _dispatch(self, event: dict, envelope: str) -> None:
        await self.broadcast_local(event)
        try:
            await self._get_pub_client().publish(ADMIN_ROOM_CHANNEL, envelope)
        except Exception as error:
            # Local delivery still works when Redis is temporarily unavailable.
            logger.warning("Failed to publish admin room event to Redis: %s", error)

    async def publish(
        self,
        *,
        room_id: int,
        room_code: str | None,
        reason: str,
        reasons: list[str] | None = None,
    ) -> None:
        event = {
            "type": "ROOMS_INVALIDATED",
            "room_id": room_id,
            "room_code": room_code,
            "reason": reason,
            "reasons": reasons or [reason],
            "emitted_at": datetime.now(timezone.utc).isoformat(),
        }
        envelope = json.dumps({"sender_id": self.worker_id, "event": event})
        # Admin monitoring must never add socket/Redis latency to gameplay requests.
        self._track_task(self._dispatch(event, envelope))

    def schedule_invalidation(
        self,
        *,
        room_id: int,
        room_code: str | None,
        reason: str,
        delay_seconds: float = 0.5,
    ) -> None:
        """Coalesce high-frequency answer events into one room invalidation."""
        self._pending_reasons.setdefault(room_id, set()).add(reason)
        pending = self._pending_invalidations.get(room_id)
        if pending and not pending.done():
            return

        async def publish_later() -> None:
            try:
                await asyncio.sleep(delay_seconds)
                reasons = sorted(self._pending_reasons.pop(room_id, {reason}))
                await self.publish(
                    room_id=room_id,
                    room_code=room_code,
                    reason=reasons[0],
                    reasons=reasons,
                )
            finally:
                self._pending_invalidations.pop(room_id, None)

        self._pending_invalidations[room_id] = asyncio.create_task(publish_later())

    async def listen(self) -> None:
        while True:
            try:
                self._pubsub_client = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5.0,
                    socket_timeout=None,
                )
                pubsub = self._pubsub_client.pubsub()
                await pubsub.subscribe(ADMIN_ROOM_CHANNEL)
                async for message in pubsub.listen():
                    if message.get("type") != "message":
                        continue
                    try:
                        envelope = json.loads(message.get("data") or "{}")
                        if envelope.get("sender_id") == self.worker_id:
                            continue
                        event = envelope.get("event")
                        if isinstance(event, dict):
                            await self.broadcast_local(event)
                    except (TypeError, ValueError) as error:
                        logger.warning("Invalid admin room event payload: %s", error)
            except asyncio.CancelledError:
                break
            except Exception as error:
                logger.warning("Admin room Redis listener reconnecting after error: %s", error)
                await asyncio.sleep(2)
            finally:
                if self._pubsub_client is not None:
                    try:
                        await self._pubsub_client.aclose()
                    except Exception:
                        pass
                    self._pubsub_client = None

    def start_listener_task(self) -> None:
        if self._listener_task is None or self._listener_task.done():
            self._listener_task = asyncio.create_task(self.listen())

    def stop_listener_task(self) -> None:
        if self._listener_task and not self._listener_task.done():
            self._listener_task.cancel()
        for task in self._pending_invalidations.values():
            task.cancel()
        for task in self._delivery_tasks:
            task.cancel()
        self._pending_invalidations.clear()
        self._pending_reasons.clear()
        self._delivery_tasks.clear()


admin_room_manager = AdminRoomConnectionManager()

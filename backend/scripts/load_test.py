"""
Load & Stress Testing Tool for QuizzApp Backend
Simulates launching multiple live rooms and joining 10-20 concurrent members per room via WebSocket & REST API.

Usage:
    python scripts/load_test.py --rooms 5 --members 15 --duration 30
"""

import argparse
import asyncio
import json
import logging
import os
import sys
import time
from typing import Dict, List, Any

# Ensure backend root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("load_test")


class LoadTesterStats:
    def __init__(self):
        self.rooms_created = 0
        self.rooms_failed = 0
        self.members_joined = 0
        self.members_failed = 0
        self.ws_connected = 0
        self.ws_disconnected = 0
        self.ws_errors = 0
        self.messages_received = 0
        self.ping_latencies: List[float] = []

    def report(self, duration: float):
        print("\n" + "=" * 60)
        print("           QUIZZAPP LOAD TEST RESULTS REPORT           ")
        print("=" * 60)
        print(f"Test Duration         : {duration:.2f} seconds")
        print(f"Rooms Created         : {self.rooms_created} (Failed: {self.rooms_failed})")
        print(f"Members Joined (REST) : {self.members_joined} (Failed: {self.members_failed})")
        print(f"WebSocket Connections : {self.ws_connected} active (Disconnected: {self.ws_disconnected}, Errors: {self.ws_errors})")
        print(f"Messages Received     : {self.messages_received}")
        
        if self.ping_latencies:
            avg_lat = (sum(self.ping_latencies) / len(self.ping_latencies)) * 1000
            min_lat = min(self.ping_latencies) * 1000
            max_lat = max(self.ping_latencies) * 1000
            print(f"Ping-Pong Latency     : Avg {avg_lat:.2f}ms | Min {min_lat:.2f}ms | Max {max_lat:.2f}ms")
        else:
            print("Ping-Pong Latency     : N/A")
            
        success_rate = (self.ws_connected / (self.members_joined or 1)) * 100
        print(f"WS Success Rate       : {success_rate:.1f}%")
        print("=" * 60 + "\n")


async def get_or_create_host_token(base_url: str, client: httpx.AsyncClient) -> str:
    """Obtain a valid host JWT access token by logging in or generating one directly."""
    try:
        # Try direct token generation via backend core modules if available
        from app.core.security import create_access_token
        from app.db.session import SessionLocal
        from app.models.user import User

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.status == "ACTIVE").first()
            if user:
                token = create_access_token(subject=user.id)
                logger.info(f"Generated host access token for user ID {user.id} ({user.email})")
                return token
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Direct token generation skipped: {e}")

    # Fallback to API login
    login_url = f"{base_url}/api/v1/auth/login"
    login_data = {"username": "admin@example.com", "password": "adminpassword"}
    resp = await client.post(login_url, data=login_data)
    if resp.status_code == 200:
        return resp.json().get("access_token")
    
    raise RuntimeError("Could not obtain a host authentication token for room creation.")


async def get_valid_quiz_id(base_url: str, token: str, client: httpx.AsyncClient) -> int:
    """Fetch an existing quiz ID from the database or API."""
    try:
        from app.db.session import SessionLocal
        from app.models.quiz import Quiz

        db = SessionLocal()
        try:
            quiz = db.query(Quiz).first()
            if quiz:
                return quiz.id
        finally:
            db.close()
    except Exception:
        pass

    # Try API
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get(f"{base_url}/api/v1/quizzes/my-quizzes", headers=headers)
    if resp.status_code == 200 and resp.json():
        return resp.json()[0]["id"]

    raise RuntimeError("No quiz found in database. Please create at least one quiz before load testing.")


async def bot_participant_task(
    base_url: str,
    ws_base_url: str,
    room_code: str,
    nickname: str,
    duration: float,
    stats: LoadTesterStats,
    stop_event: asyncio.Event,
    submit_answers: bool = False,
):
    """Simulates a single bot participant joining via REST API and connecting to WebSocket."""
    join_url = f"{base_url}/api/v1/rooms/{room_code}/join"
    participant_id = None
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(join_url, json={"nickname": nickname})
            if resp.status_code in [200, 201]:
                stats.members_joined += 1
                participant_id = resp.json().get("id")
            else:
                stats.members_failed += 1
                logger.error(f"[{nickname}] Failed to join room {room_code}: HTTP {resp.status_code} {resp.text}")
                return
        except Exception as err:
            stats.members_failed += 1
            logger.error(f"[{nickname}] HTTP error joining room {room_code}: {err}")
            return

    # Import websockets dynamically
    try:
        import websockets
    except ImportError:
        logger.error("The 'websockets' package is required. Install it using 'pip install websockets'.")
        return

    import urllib.parse
    encoded_nickname = urllib.parse.quote(nickname)
    ws_url = f"{ws_base_url}/api/v1/ws/rooms/{room_code}?nickname={encoded_nickname}&isHost=false"

    # Connect bot WebSocket with auto-reconnect resilience
    while not stop_event.is_set():
        try:
            async with websockets.connect(ws_url, ping_interval=20, ping_timeout=20) as ws:
                stats.ws_connected += 1
                last_ping_time = 0.0

                async def send_pings():
                    nonlocal last_ping_time
                    while not stop_event.is_set():
                        try:
                            last_ping_time = time.perf_counter()
                            await ws.send(json.dumps({"t": "P", "type": "PING"}))
                        except Exception:
                            break
                        await asyncio.sleep(5.0)

                async def submit_bot_answer(qid: int):
                    if not participant_id:
                        return
                    # Simulate human thinking/reading time before answering (0.2 to 1.5 seconds)
                    await asyncio.sleep(random.uniform(0.2, 1.5))
                    try:
                        ans_msg = json.dumps({
                            "type": "SUBMIT_ANSWER",
                            "t": "SA",
                            "participant_id": participant_id,
                            "pid": participant_id,
                            "question_id": qid,
                            "qid": qid,
                            "selected_option_id": random.choice([1, 2, 3, 4]),
                            "opt": random.choice([1, 2, 3, 4]),
                            "streak": random.randint(1, 3),
                        })
                        await ws.send(ans_msg)
                    except Exception:
                        pass

                async def listen_messages():
                    nonlocal last_ping_time
                    while not stop_event.is_set():
                        try:
                            raw_msg = await ws.recv()
                            stats.messages_received += 1
                            try:
                                data = json.loads(raw_msg) if isinstance(raw_msg, str) else raw_msg
                                if isinstance(data, dict):
                                    mtype = data.get("t") or data.get("type")
                                    if mtype in ["PONG", "PO"] and last_ping_time > 0:
                                        lat = time.perf_counter() - last_ping_time
                                        stats.ping_latencies.append(lat)
                                    elif submit_answers and mtype in ["GAME_STARTED", "GS", "NEXT_QUESTION", "NQ"]:
                                        target_qid = data.get("question_id") or data.get("qid") or data.get("current_question_index") or 1
                                        asyncio.create_task(submit_bot_answer(qid=target_qid))
                            except Exception:
                                pass
                        except Exception:
                            break

                ping_task = asyncio.create_task(send_pings())
                listen_task = asyncio.create_task(listen_messages())

                try:
                    await stop_event.wait()
                finally:
                    ping_task.cancel()
                    listen_task.cancel()
                    await asyncio.gather(ping_task, listen_task, return_exceptions=True)

        except asyncio.CancelledError:
            break
        except Exception as e:
            if not stop_event.is_set():
                stats.ws_errors += 1
                logger.debug(f"[{nickname}] WS connection ended: {e}")
                await asyncio.sleep(0.3)
            else:
                break
        finally:
            stats.ws_disconnected += 1


async def host_room_task(
    base_url: str,
    ws_base_url: str,
    token: str,
    quiz_id: int,
    room_index: int,
    members_per_room: int,
    duration: float,
    stats: LoadTesterStats,
    stop_event: asyncio.Event,
    auto_start: bool = False,
    submit_answers: bool = False,
):
    """Launches a live room as host and spawns member bot tasks."""
    headers = {"Authorization": f"Bearer {token}"}
    launch_url = f"{base_url}/api/v1/rooms/launch"
    room_id = None
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(launch_url, json={"quiz_id": quiz_id}, headers=headers)
            if resp.status_code in [200, 201]:
                room_data = resp.json()
                room_code = room_data["room_code"]
                room_id = room_data["id"]
                stats.rooms_created += 1
                logger.info(f"[Room #{room_index + 1}] Successfully launched room PIN: {room_code}")
            else:
                stats.rooms_failed += 1
                logger.error(f"[Room #{room_index + 1}] Failed to launch room: HTTP {resp.status_code} {resp.text}")
                return
        except Exception as err:
            stats.rooms_failed += 1
            logger.error(f"[Room #{room_index + 1}] Exception launching room: {err}")
            return

    # Spawn bot member tasks for this room
    bot_tasks = []
    for m_idx in range(members_per_room):
        nickname = f"Bot_R{room_index + 1}_{m_idx + 1}"
        task = asyncio.create_task(
            bot_participant_task(
                base_url=base_url,
                ws_base_url=ws_base_url,
                room_code=room_code,
                nickname=nickname,
                duration=duration,
                stats=stats,
                stop_event=stop_event,
                submit_answers=submit_answers,
            )
        )
        bot_tasks.append(task)
        # Stagger bot joins to prevent sudden DB lock & event loop spikes
        await asyncio.sleep(0.1)

    if auto_start and room_id:
        # Wait for all bots in this room to complete REST join & WebSocket connection
        wait_delay = max(5.0, members_per_room * 0.15 + 2.0)
        await asyncio.sleep(wait_delay)
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                start_url = f"{base_url}/api/v1/rooms/{room_id}/start"
                start_resp = await client.post(start_url, headers=headers)
                if start_resp.status_code == 200:
                    logger.info(f"[Room #{room_index + 1}] Automatically STARTED quiz (Status: PLAYING)")
                else:
                    logger.warning(f"[Room #{room_index + 1}] Auto-start room failed: HTTP {start_resp.status_code} {start_resp.text}")
            except Exception as err:
                logger.warning(f"[Room #{room_index + 1}] Exception auto-starting room: {err}")

    await asyncio.gather(*bot_tasks, return_exceptions=True)


async def main():
    parser = argparse.ArgumentParser(description="QuizzApp Load & Stress Testing Script")
    parser.add_argument("--rooms", type=int, default=5, help="Number of rooms to create concurrently (default: 5)")
    parser.add_argument("--members", type=int, default=15, help="Number of members per room (default: 15)")
    parser.add_argument("--duration", type=float, default=30.0, help="Test duration in seconds (default: 30)")
    parser.add_argument("--host", type=str, default="http://localhost:8000", help="Backend HTTP Base URL")
    parser.add_argument("--ws-host", type=str, default="ws://localhost:8000", help="Backend WebSocket Base URL")
    parser.add_argument("--auto-start", action="store_true", help="Automatically start quiz room after bots join")
    parser.add_argument("--submit-answers", action="store_true", help="Simulate bots submitting answers upon game start")
    
    args = parser.parse_args()

    total_bots = args.rooms * args.members
    logger.info("=" * 60)
    logger.info(f"STARTING QUIZZAPP LOAD TEST")
    logger.info(f"Target Rooms          : {args.rooms}")
    logger.info(f"Members per Room      : {args.members}")
    logger.info(f"Total Bot Clients     : {total_bots}")
    logger.info(f"Test Duration         : {args.duration}s")
    logger.info(f"Target Server         : {args.host}")
    logger.info("=" * 60)

    stats = LoadTesterStats()
    stop_event = asyncio.Event()

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Authenticate Host
        try:
            token = await get_or_create_host_token(args.host, client)
        except Exception as err:
            logger.error(f"Authentication failed: {err}")
            sys.exit(1)

        # Step 2: Get Quiz ID
        try:
            quiz_id = await get_valid_quiz_id(args.host, token, client)
            logger.info(f"Using Quiz ID: {quiz_id} for live rooms")
        except Exception as err:
            logger.error(f"Failed to find valid quiz: {err}")
            sys.exit(1)

    # Step 3: Launch Host Room Tasks concurrently
    start_time = time.perf_counter()

    room_tasks = []
    for r_idx in range(args.rooms):
        task = asyncio.create_task(
            host_room_task(
                base_url=args.host,
                ws_base_url=args.ws_host,
                token=token,
                quiz_id=quiz_id,
                room_index=r_idx,
                members_per_room=args.members,
                duration=args.duration,
                stats=stats,
                stop_event=stop_event,
                auto_start=args.auto_start,
                submit_answers=args.submit_answers,
            )
        )
        room_tasks.append(task)
        await asyncio.sleep(0.1)

    # Wait for duration
    logger.info(f"All room tasks spawned. Running load test for {args.duration} seconds...")
    await asyncio.sleep(args.duration)

    logger.info("Test duration reached. Triggering shutdown signal...")
    stop_event.set()

    await asyncio.gather(*room_tasks, return_exceptions=True)

    elapsed = time.perf_counter() - start_time
    stats.report(elapsed)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Load test interrupted by user.")

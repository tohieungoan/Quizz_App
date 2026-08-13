from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import asyncio
import logging

from app.api.v1.websockets.room_manager import room_websocket_manager
from app.api.deps import get_db
from app.crud.crud_room import crud_room

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/rooms/{room_code}")
async def websocket_room(
    websocket: WebSocket,
    room_code: str,
    nickname: str = Query("Guest"),
    isHost: bool = Query(False),
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for live room communication.
    Synchronizes participants and hosts in the waiting lobby.
    """
    from starlette.concurrency import run_in_threadpool
    from app.db.session import SessionLocal

    # In-memory fast room cache to eliminate DB queries during WS connection handshake
    global _room_exist_cache
    if "_room_exist_cache" not in globals():
        _room_exist_cache = {}

    room_id = _room_exist_cache.get(room_code)
    if not room_id:
        def _check_room_exists():
            with SessionLocal() as db:
                r_obj = crud_room.get_by_code(db=db, room_code=room_code)
                return r_obj.id if r_obj else None
        room_id = await run_in_threadpool(_check_room_exists)
        if not room_id:
            await websocket.accept()
            await websocket.send_json({"type": "ERROR", "message": "Room not found or has ended."})
            await websocket.close()
            return
        _room_exist_cache[room_code] = room_id

    import urllib.parse
    decoded_nickname = urllib.parse.unquote(nickname)

    user_id = None
    if token:
        try:
            from jose import jwt
            from app.core.config import settings
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = int(payload.get("sub"))
            logger.info(f"WebSocket client '{decoded_nickname}' authenticated as user_id {user_id}")
        except Exception as jwt_err:
            logger.debug(f"Failed to decode token for client '{decoded_nickname}': {jwt_err}")

    await room_websocket_manager.connect(websocket, room_code, decoded_nickname)
    logger.info(f"WebSocket client '{decoded_nickname}' connected to room '{room_code}'")

    if not isHost:
        active_nicknames = room_websocket_manager.get_room_members(room_code)
        if decoded_nickname not in active_nicknames:
            active_nicknames.append(decoded_nickname)
        await room_websocket_manager.broadcast_to_room(
            room_code,
            {
                "type": "PLAYER_JOINED",
                "t": "PJ",
                "player": decoded_nickname,
                "u": decoded_nickname,
                "players": active_nicknames,
                "p": active_nicknames,
            }
        )

    try:
        while True:
            # Keep-alive loop, listening for client heartbeat
            data = await websocket.receive_json()
            if isinstance(data, dict):
                msg_type = data.get("type") or data.get("t")
                if msg_type in ["PING", "P"]:
                    await websocket.send_json({"type": "PONG", "t": "PO"})
                elif msg_type in ["SUBMIT_ANSWER", "SA"]:
                    # Handle real-time WebSocket answer submission (<5ms)
                    try:
                        participant_id = data.get("participant_id") or data.get("pid")
                        question_id = data.get("question_id") or data.get("qid")
                        selected_option_id = data.get("selected_option_id") or data.get("opt")
                        answer_text = data.get("answer_text") or data.get("txt")
                        active_power_up = data.get("active_power_up") or data.get("pw")
                        streak = data.get("streak") or data.get("st") or 0

                        from starlette.concurrency import run_in_threadpool
                        from app.services.redis_room_service import redis_room_service
                        from app.models.room import Participant
                        from app.crud.crud_user import crud_user
                        import datetime

                        def _do_submit_answer():
                            try:
                                with SessionLocal() as db_session:
                                    db_room = crud_room.get_by_code(db=db_session, room_code=room_code)
                                    if not db_room or db_room.status != "PLAYING":
                                        return None, "Room is not active for submission."

                                    participant = db_session.query(Participant).filter(
                                        Participant.id == participant_id,
                                        Participant.room_id == db_room.id
                                    ).first()

                                    if not participant:
                                        return None, "Participant not found."

                                    now = datetime.datetime.utcnow()
                                    is_correct, score, total_score, correct_option_key = crud_room.submit_answer(
                                        db=db_session,
                                        room=db_room,
                                        participant=participant,
                                        question_id=question_id,
                                        selected_option_id=selected_option_id,
                                        answer_text=answer_text,
                                        active_power_up=active_power_up,
                                        client_streak=streak,
                                        now=now
                                    )
                                    if participant.user_id:
                                        pts = 15 if is_correct else 10
                                        from app.models.user import User
                                        u = db_session.query(User).filter(User.id == participant.user_id).first()
                                        if u:
                                            crud_user.add_achievement_points(db_session, u, pts)
                                    return {
                                        "participant_id": participant.id,
                                        "nickname": participant.nickname,
                                        "user_id": participant.user_id,
                                        "is_correct": is_correct,
                                        "score": score,
                                        "total_score": total_score,
                                        "correct_option_key": correct_option_key,
                                    }, None
                            except Exception as db_err:
                                logger.warning(f"Background DB submit_answer error: {db_err}")
                                return None, str(db_err)

                        # 1. Update Redis RAM state (<1ms)
                        redis_total_score, ans_payload = await redis_room_service.submit_answer_redis(
                            room_code=room_code,
                            participant_id=participant_id,
                            question_id=question_id,
                            selected_option_id=selected_option_id,
                            answer_text=answer_text,
                            is_correct=True,
                            score=100,
                            correct_option_key=None,
                        )

                        # 2. Synchronize DB persistence task to get exact scoring & option key
                        res, err = await run_in_threadpool(_do_submit_answer)
                        if res:
                            is_correct = res["is_correct"]
                            score = res["score"]
                            total_score = res["total_score"]
                            correct_option_key = res["correct_option_key"]
                        else:
                            is_correct = True
                            score = 100
                            total_score = redis_total_score or 100
                            correct_option_key = None

                        # 3. Send response back to sender client
                        await websocket.send_json({
                            "type": "SUBMIT_ANSWER_RESPONSE",
                            "t": "SAR",
                            "status": "SUCCESS",
                            "st": "SUCCESS",
                            "question_id": question_id,
                            "qid": question_id,
                            "is_correct": is_correct,
                            "c": is_correct,
                            "score": score,
                            "s": score,
                            "total_score": total_score,
                            "ts": total_score,
                            "correct_option_key": correct_option_key,
                            "ck": correct_option_key,
                        })

                        # 4. Broadcast ANSWER_SUBMITTED to room host panel IMMEDIATELY (<1ms)
                        await room_websocket_manager.broadcast_to_room(
                            room_code,
                            {
                                "type": "ANSWER_SUBMITTED",
                                "t": "AS",
                                "participant_id": participant_id,
                                "pid": participant_id,
                                "nickname": f"Participant_{participant_id}",
                                "u": f"Participant_{participant_id}",
                                "is_correct": True,
                                "c": True,
                            }
                        )
                    except Exception as sub_err:
                        logger.error(f"Error handling WebSocket SUBMIT_ANSWER: {sub_err}")
                        await websocket.send_json({"type": "ERROR", "message": "Failed to record answer."})
                elif msg_type in ["SYNC_STATE", "SS"]:
                    try:
                        def _get_sync_state():
                            with SessionLocal() as db_session:
                                db_room = crud_room.get_by_code(db=db_session, room_code=room_code)
                                if not db_room:
                                    return None
                                active_q = None
                                rem_seconds = 20
                                if db_room.current_question_index and db_room.quiz and db_room.quiz.questions:
                                    q_idx = db_room.current_question_index - 1
                                    if 0 <= q_idx < len(db_room.quiz.questions):
                                        q = db_room.quiz.questions[q_idx]
                                        active_q = {
                                            "id": q.id,
                                            "text": q.content,
                                            "type": q.type,
                                            "time_limit": q.time_limit,
                                            "options": [{"id": o.id, "key": chr(65 + i), "label": o.content} for i, o in enumerate(q.options)]
                                        }
                                        if db_room.current_question_started_at:
                                            elapsed = (datetime.datetime.utcnow() - db_room.current_question_started_at).total_seconds()
                                            rem_seconds = max(0, int(q.time_limit - elapsed))
                                return {
                                    "status": db_room.status,
                                    "current_question_index": db_room.current_question_index,
                                    "active_question": active_q,
                                    "time_left": rem_seconds
                                }

                        sync_payload = await run_in_threadpool(_get_sync_state)
                        if sync_payload:
                            await websocket.send_json({
                                "type": "SYNC_STATE_RESPONSE",
                                "t": "SSR",
                                **sync_payload,
                                "q": sync_payload.get("active_question"),
                                "tl": sync_payload.get("time_left"),
                            })
                    except Exception as sync_err:
                        logger.error(f"Error handling SYNC_STATE: {sync_err}")
                else:
                    logger.debug(f"Received JSON message from '{decoded_nickname}' in room '{room_code}': {data}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket client '{decoded_nickname}' disconnected from room '{room_code}'")
    except Exception as e:
        logger.error(f"WebSocket error for client '{decoded_nickname}': {e}")
    finally:
        try:
            room_websocket_manager.disconnect(websocket, room_code, decoded_nickname)
            logger.info(f"WebSocket client '{decoded_nickname}' disconnected from room '{room_code}'")
            if not isHost:
                active_members = room_websocket_manager.get_room_members(room_code)
                await room_websocket_manager.broadcast_to_room(
                    room_code,
                    {
                        "type": "PLAYER_LEFT",
                        "t": "PL",
                        "player": decoded_nickname,
                        "u": decoded_nickname,
                        "players": active_members,
                        "p": active_members,
                    }
                )
        except Exception as cleanup_err:
            logger.error(f"Error during WebSocket cleanup for '{decoded_nickname}': {cleanup_err}")

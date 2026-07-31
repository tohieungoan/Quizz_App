from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.v1.websockets.room_manager import room_websocket_manager
from app.api.deps import get_db
from app.crud.crud_room import crud_room
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/rooms/{room_code}")
async def websocket_room(
    websocket: WebSocket,
    room_code: str,
    nickname: str = Query("Guest"),
    isHost: bool = Query(False),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for live room communication.
    Synchronizes participants and hosts in the waiting lobby.
    """
    room = crud_room.get_by_code(db=db, room_code=room_code)
    if not room:
        await websocket.accept()
        await websocket.send_json({"type": "ERROR", "message": "Room not found or has ended."})
        await websocket.close()
        return

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

    try:
        while True:
            # Keep-alive loop, listening for client heartbeat
            data = await websocket.receive_json()
            if isinstance(data, dict) and data.get("type") == "PING":
                await websocket.send_json({"type": "PONG"})
            else:
                logger.debug(f"Received JSON message from '{decoded_nickname}' in room '{room_code}': {data}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket client '{decoded_nickname}' disconnected from room '{room_code}'")
    except Exception as e:
        logger.error(f"WebSocket error for client '{decoded_nickname}': {e}")
    finally:
        try:
            room_websocket_manager.disconnect(websocket, room_code, decoded_nickname)
            if not isHost:
                import asyncio
                await asyncio.sleep(3)
                
                # Check if they reconnected (their nickname is back in active connections)
                if decoded_nickname in room_websocket_manager.get_room_members(room_code):
                    logger.info(f"Participant '{decoded_nickname}' reconnected. Grace period cleanup skipped.")
                else:
                    from app.models.room import Participant
                    from sqlalchemy import func
                    from app.db.session import SessionLocal
                    
                    with SessionLocal() as db_session:
                        db_room = crud_room.get_by_code(db=db_session, room_code=room_code)
                        if db_room:
                            # CRITICAL: Only delete participant if the room status is WAITING (Lobby waiting state)
                            # Once status is PLAYING or ENDED, preserve participant records to keep scores and leaderboard history.
                            if db_room.status == "WAITING":
                                if user_id:
                                    participant = db_session.query(Participant).filter(
                                        Participant.room_id == db_room.id,
                                        Participant.user_id == user_id
                                    ).first()
                                else:
                                    participant = db_session.query(Participant).filter(
                                        Participant.room_id == db_room.id,
                                        func.lower(func.trim(Participant.nickname)) == func.lower(func.trim(decoded_nickname))
                                    ).first()
                                    
                                if participant:
                                    logger.info(f"Removing participant '{decoded_nickname}' (user_id={user_id}) from database (Lobby disconnect)...")
                                    db_session.delete(participant)
                                    db_session.commit()
                                    db_session.refresh(db_room)
                                    logger.info(f"Participant '{decoded_nickname}' successfully deleted.")
                                    
                                    active_nicknames = [p.nickname for p in db_room.participants]
                                    await room_websocket_manager.broadcast_to_room(
                                        room_code,
                                        {
                                            "type": "PLAYER_LEFT",
                                            "player": decoded_nickname,
                                            "players": active_nicknames
                                        }
                                    )
                                else:
                                    logger.warning(f"Participant '{decoded_nickname}' not found in room {room_code} for deletion.")
                            else:
                                logger.info(f"Preserving participant '{decoded_nickname}' in room '{room_code}' because status is '{db_room.status}'")
        except Exception as db_err:
            logger.error(f"Error during WebSocket cleanup for '{decoded_nickname}': {db_err}")

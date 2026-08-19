from typing import Any, Optional, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_active_admin,
    get_current_active_user,
    get_db,
    get_optional_current_user,
)
from app.crud.crud_quiz import crud_quiz
from app.crud.crud_room import crud_room
from app.crud.crud_user import crud_user
from app.api.v1.websockets.room_manager import room_websocket_manager
from app.services.redis_room_service import redis_room_service
from app.schemas.room import (
    ParticipantJoin,
    ParticipantResponse,
    RoomAdminPageResponse,
    RoomCreate,
    RoomLiveStatus,
    RoomResponse,
    RoomSettingsUpdate,
    SubmitAnswerIn,
    SubmitAnswerResponse,
)
from app.services.user_notification_service import user_notification_service

import asyncio
import logging
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

_auto_advance_tasks = {}

async def _auto_advance_room_task(room_id: int, expected_question_index: int, delay_seconds: int):
    """
    Server-side background task that waits for question time limit + delay,
    then automatically advances the room to the next question if progression_mode is 'auto'.
    """
    await asyncio.sleep(delay_seconds)
    
    db = SessionLocal()
    try:
        room = crud_room.get(db=db, room_id=room_id)
        if not room:
            return
            
        if room.status == "PLAYING" and (room.progression_mode or "manual").lower() == "auto":
            if room.current_question_index == expected_question_index:
                updated_room = crud_room.next_question(db=db, room=room)
                if updated_room.status == "ENDED":
                    await room_websocket_manager.broadcast_to_room(
                        room.room_code,
                        {"type": "GAME_ENDED", "status": "ENDED"}
                    )
                else:
                    await room_websocket_manager.broadcast_to_room(
                        room.room_code,
                        {
                            "type": "NEXT_QUESTION",
                            "current_question_index": updated_room.current_question_index,
                            "status": updated_room.status
                        }
                    )
                    # Schedule next question auto-advance recursively
                    _trigger_auto_advance_if_enabled(db, updated_room)
    except Exception as e:
        logger.error(f"Error in _auto_advance_room_task for room {room_id}: {e}")
    finally:
        db.close()


def _trigger_auto_advance_if_enabled(db: Session, room):
    """
    Schedules an asyncio background task if room.progression_mode == 'auto' and room.status == 'PLAYING'.
    """
    if not room or room.status != "PLAYING":
        return
    if (room.progression_mode or "manual").lower() != "auto":
        return

    time_limit = 20
    if room.quiz and room.quiz.questions:
        sorted_q = sorted(room.quiz.questions, key=lambda q: (q.position, q.id))
        if 1 <= room.current_question_index <= len(sorted_q):
            time_limit = sorted_q[room.current_question_index - 1].time_limit or 20

    delay_seconds = time_limit + 4

    try:
        loop = asyncio.get_running_loop()
        task = loop.create_task(_auto_advance_room_task(room.id, room.current_question_index, delay_seconds))
        _auto_advance_tasks[room.id] = task
    except Exception as e:
        logger.warning(f"Could not schedule auto advance task: {e}")

def _send_sync_ws_notification(user_id: int, title: str, content: str, action_url: str | None = None) -> None:
    """
    Safely dispatch a WebSocket notification from a synchronous thread worker in FastAPI.
    """
    try:
        import asyncio
        from app.api.v1.websockets.manager import manager
        payload = {
            "type": "NOTIFICATION",
            "title": title,
            "content": content,
            "action_url": action_url,
        }
        loop = None
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            try:
                loop = asyncio.get_event_loop_policy().get_event_loop()
            except Exception:
                loop = None

        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(manager.send_personal_message(payload, user_id), loop)
        else:
            try:
                asyncio.run(manager.send_personal_message(payload, user_id))
            except Exception as inner_e:
                logger.warning(f"Could not run async WS dispatch: {inner_e}")
    except Exception as e:
        logger.warning(f"Failed to push WS notification to user {user_id}: {e}")

router = APIRouter()


# ----------------------------------------------------------------------
# Admin Endpoints
# ----------------------------------------------------------------------
@router.get("/", response_model=RoomAdminPageResponse, summary="Get list of all rooms (Admin)")
def get_all_rooms(
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(10, description="Number of records to return"),
    search: Optional[str] = Query(None, description="Search by room code, host name, or quiz title"),
    status: Optional[str] = Query("ALL", description="Filter by status (ALL, RUNNING, WAITING, FINISHED)"),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_active_admin),
):
    """
    Retrieve all rooms in the system with pagination, search, and status filtering.
    Requires Super Admin privileges.
    """
    return crud_room.get_admin_rooms(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status=status
    )


# ----------------------------------------------------------------------
# Live Room Management Endpoints
# ----------------------------------------------------------------------
@router.post("/launch", response_model=RoomResponse, status_code=status.HTTP_201_CREATED, summary="Launch a new live quiz room")
def launch_room(
    *,
    db: Session = Depends(get_db),
    room_in: RoomCreate,
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Launch a new live room for hosting a quiz.
    Generates a unique 6-digit room code and registers the room in WAITING status.
    Requires authentication (active user).
    """
    # Verify if quiz exists
    # Serialize room creation with authoring saves. Once this lock is held,
    # either the save completes before launch or subsequent saves see WAITING.
    quiz = crud_quiz.get_for_update(db=db, quiz_id=room_in.quiz_id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with id {room_in.quiz_id} not found."
        )

    # (Optional) Verify if group exists if group_id is provided
    if room_in.group_id is not None:
        from app.models.group import Group
        group = db.query(Group).filter(Group.id == room_in.group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Group with id {room_in.group_id} not found."
            )

    try:
        room = crud_room.create_room(db=db, obj_in=room_in, host_id=current_user.id)
        crud_user.add_achievement_points(db, current_user, 40)
        
        # Dispatch notifications if a specific group is targeted
        if room.group_id is not None:
            try:
                from app.models.group import GroupMember
                from app.models.notification import Notification
                
                # Fetch all approved members of this target group
                members = db.query(GroupMember).filter(
                    GroupMember.group_id == room.group_id,
                    GroupMember.status == "APPROVED"
                ).all()
                
                from app.services.user_notification_service import user_notification_service

                for member in members:
                    # Skip the host
                    if member.user_id == current_user.id:
                        continue
                    
                    user_notification_service.send_notification(
                        db=db,
                        user_id=member.user_id,
                        sender_id=current_user.id,
                        target_group_id=room.group_id,
                        title="New Live Quiz Started",
                        content=f"{current_user.fullname or current_user.email} has started a live quiz '{quiz.title}'. Join now with code: {room.room_code}",
                        type="LIVE_ROOM_INVITE",
                        action_url=f"/lobby?roomCode={room.room_code}"
                    )
                db.commit()
            except Exception as e:
                logger.warning(f"Failed to dispatch target group notifications: {e}")
                
        return room
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/my-hosted-rooms", response_model=list[RoomResponse], summary="Get all live rooms hosted by current user (active and ended)")
def get_my_hosted_rooms(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Retrieve all rooms hosted by the currently authenticated user (including ended rooms).
    """
    from sqlalchemy import desc
    from app.models.room import Room

    rooms = db.query(Room).filter(
        Room.host_id == current_user.id
    ).order_by(desc(Room.created_at)).all()
    return rooms


@router.get("/my-participated-rooms", response_model=list[RoomResponse], summary="Get all live rooms joined by current user")
def get_my_participated_rooms(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Retrieve all live rooms joined by current user as a participant.
    """
    from sqlalchemy import desc
    from app.models.room import Participant, Room

    participated = db.query(Participant.room_id).filter(
        Participant.user_id == current_user.id
    ).distinct().all()

    room_ids = [p[0] for p in participated if p[0] is not None]
    if not room_ids:
        return []

    rooms = db.query(Room).filter(
        Room.id.in_(room_ids)
    ).order_by(desc(Room.created_at)).all()
    return rooms


@router.get("/my-active-rooms", response_model=list[RoomResponse], summary="Get all active live rooms hosted by current user")
def get_my_active_rooms(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Retrieve all active rooms (WAITING or PLAYING) hosted by the currently authenticated user.
    Enables host to manage multiple live rooms simultaneously.
    """
    import datetime
    from sqlalchemy import desc, or_
    from app.models.room import Room
    from app.crud.crud_room import crud_room

    crud_room.auto_end_stale_rooms(db)

    now = datetime.datetime.utcnow()
    active_rooms = db.query(Room).filter(
        Room.host_id == current_user.id,
        Room.status.in_(["WAITING", "PLAYING"]),
        or_(Room.expire_at.is_(None), Room.expire_at > now)
    ).order_by(desc(Room.created_at)).all()
    
    for room in active_rooms:
        active_q = None
        if room.status == "PLAYING" and room.quiz and room.quiz.questions:
            sorted_questions = sorted(room.quiz.questions, key=lambda q: (q.position, q.id))
            if 1 <= room.current_question_index <= len(sorted_questions):
                q = sorted_questions[room.current_question_index - 1]
                KEYS = ["A", "B", "C", "D"]
                sorted_opts = sorted(q.options, key=lambda o: o.id)
                options_live = []
                for idx, opt in enumerate(sorted_opts):
                    options_live.append({
                        "id": opt.id,
                        "key": KEYS[idx] if idx < len(KEYS) else "A",
                        "label": opt.content or ""
                    })
                raw_type = (q.type or "multiple_choice").lower().strip()
                is_short = raw_type in ["short_answer", "short answer", "short", "fill in the blank", "fill_in_the_blank", "fill_in"]
                active_q = {
                    "id": q.id,
                    "text": q.content or "",
                    "type": "SHORT_ANSWER" if is_short else "MULTIPLE_CHOICE",
                    "time_limit": q.time_limit,
                    "options": options_live if not is_short else [],
                    "correct_option_key": None,
                    "audio_url": q.audio_url,
                    "media_url": q.media_url,
                    "audio_play_limit": q.audio_play_limit,
                }
        room.active_question = active_q
    
    return active_rooms


@router.get("/{room_code}", response_model=RoomResponse, summary="Get active room by code")
async def get_room_by_code(
    room_code: str,
    db: Session = Depends(get_db),
) -> Any:
    """
    Retrieve an active room (not ENDED) by its 6-digit code.
    Publicly accessible (useful for members joining).
    """
    room = crud_room.get_by_code(db=db, room_code=room_code)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active room not found or has already ended."
        )
    
    # Construct active_question safely without exposing correct_option_key
    active_q = None
    if room.status == "PLAYING" and room.quiz and room.quiz.questions:
        sorted_questions = sorted(room.quiz.questions, key=lambda q: (q.position, q.id))
        if 1 <= room.current_question_index <= len(sorted_questions):
            q = sorted_questions[room.current_question_index - 1]
            
            KEYS = ["A", "B", "C", "D"]
            sorted_opts = sorted(q.options, key=lambda o: o.id)
            options_live = []
            correct_option_key = None
            for idx, opt in enumerate(sorted_opts):
                key = KEYS[idx] if idx < len(KEYS) else "A"
                options_live.append({
                    "id": opt.id,
                    "key": key,
                    "label": opt.content or ""
                })
                if opt.is_correct:
                    correct_option_key = key

            raw_type = (q.type or "multiple_choice").lower().strip()
            is_short_answer = raw_type in ["short_answer", "short answer", "short", "fill in the blank", "fill_in_the_blank", "fill_in"]
            standardized_type = "SHORT_ANSWER" if is_short_answer else "MULTIPLE_CHOICE"

            active_q = {
                "id": q.id,
                "text": q.content or "",
                "type": standardized_type,
                "time_limit": q.time_limit,
                "options": options_live if not is_short_answer else [],
                "correct_option_key": correct_option_key,
                "audio_url": q.audio_url,
                "media_url": q.media_url,
                "audio_play_limit": q.audio_play_limit,
            }

    # Populate room fields dynamically
    room.active_question = active_q

    # Attach live Q&A state, top voted questions & chat messages
    try:
        from app.services.redis_room_service import redis_room_service
        setattr(room, "top_voted_questions", await redis_room_service.get_top_voted_questions(room.room_code))
        setattr(room, "qa_state", await redis_room_service.get_qa_session_state(room.room_code))
        setattr(room, "chat_messages", await redis_room_service.get_chat_messages(room.room_code))
    except Exception as e_qa:
        logger.warning(f"Failed to load live qa_state for room {room.room_code}: {e_qa}")

    return room


@router.post("/{room_id}/end", response_model=RoomResponse, summary="End a live room")
async def end_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    End a live room session. Sets status to ENDED and registers ended_at timestamp.
    Only the host of the room can end it.
    """
    room = crud_room.get(db=db, room_id=room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found."
        )
    
    if room.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to end this room."
        )

    from app.services.redis_room_service import redis_room_service
    updated_room = crud_room.update_status(db=db, room=room, status="ENDED")
    # Broadcast game ended to all websocket clients
    await room_websocket_manager.broadcast_to_room(room.room_code, {"type": "GAME_ENDED"})
    # Batch flush cached Redis answers to PostgreSQL database
    await redis_room_service.flush_room_answers_to_db(room.room_code, room.id)
    return updated_room


@router.post("/{room_code}/join", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED, summary="Join a live room by code")
async def join_room_by_code(
    room_code: str,
    *,
    db: Session = Depends(get_db),
    participant_in: ParticipantJoin,
    current_user=Depends(get_optional_current_user),
) -> Any:
    """
    Join an active live room by its 6-digit code.
    If the authorization header is present and valid, the user will be registered.
    Otherwise, they will join as a guest with the provided nickname.
    """
    from starlette.concurrency import run_in_threadpool

    # 1. Verify if the room exists and is active
    room = await run_in_threadpool(crud_room.get_by_code, db=db, room_code=room_code)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active room not found or has already ended."
        )

    # 2. Join room (crud_room.join_room enforces status==WAITING for new participants)

    try:
        user_id = current_user.id if current_user else None
        participant = await run_in_threadpool(
            crud_room.join_room,
            db=db,
            room=room,
            nickname=participant_in.nickname,
            user_id=user_id
        )
        
        # Broadcast player joined event to all websocket clients in room
        from app.models.room import Participant
        active_nicknames = await run_in_threadpool(
            lambda: [row[0] for row in db.query(Participant.nickname).filter(Participant.room_id == room.id).all()]
        )
        await room_websocket_manager.broadcast_to_room(
            room_code,
            {
                "type": "PLAYER_JOINED",
                "player": participant.nickname,
                "players": active_nicknames
            }
        )
        if current_user:
            await run_in_threadpool(crud_user.add_achievement_points, db, current_user, 20)
        return participant
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{room_id}/participants", response_model=list[ParticipantResponse], summary="Get list of participants in a room")
def get_room_participants(
    room_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get the list of all participants who have joined the specified room.
    Useful for host dashboard / lobby displays.
    """
    room = crud_room.get(db=db, room_id=room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found."
        )
    
    from app.models.badge import UserBadge, Badge

    result = []
    for p in room.participants:
        avatar_url = p.user.avatar if p.user and p.user.avatar else None
        # Resolve equipped title from the database for this participant
        equipped_title = None
        if p.user_id:
            title_badge = (
                db.query(Badge.name)
                .join(UserBadge, UserBadge.badge_id == Badge.id)
                .filter(
                    UserBadge.user_id == p.user_id,
                    UserBadge.is_equipped == True,
                    Badge.category == "TITLE"
                )
                .first()
            )
            if title_badge:
                equipped_title = title_badge[0]
        result.append({
            "id": p.id,
            "room_id": p.room_id,
            "user_id": p.user_id,
            "team_id": p.team_id,
            "nickname": p.nickname,
            "avatar": avatar_url,
            "status": p.status,
            "joined_at": p.joined_at,
            "score": p.score,
            "equipped_title": equipped_title,
        })
    return result


@router.post("/{room_id}/start", response_model=RoomResponse, summary="Start a live room (change status to PLAYING)")
async def start_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Start the live room quiz session. Updates status from WAITING to PLAYING.
    Only the host of the room can trigger this action.
    """
    room = crud_room.get(db=db, room_id=room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found."
        )

    if room.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to start this room."
        )

    if room.status != "WAITING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start room because its current status is {room.status}. Must be WAITING."
        )

    if not room.participants or len(room.participants) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start the room because no participants have joined yet."
        )

    updated_room = crud_room.next_question(db=db, room=room)
    # Broadcast game started to all websocket clients in room
    await room_websocket_manager.broadcast_to_room(room.room_code, {"type": "GAME_STARTED"})
    _trigger_auto_advance_if_enabled(db, updated_room)
    return updated_room


@router.get("/{room_id}/live-session", response_model=RoomLiveStatus, summary="Get real-time live session data (Host Panel)")
async def get_live_session(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Get live session statistics for the host panel.
    Returns current question details, roster with answer status, and response distribution.
    """
    room = crud_room.get(db=db, room_id=room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    
    if room.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can access live session data.")

    # 1. Active Question
    active_question = None
    sorted_questions = []
    if room.quiz and room.quiz.questions:
        sorted_questions = sorted(room.quiz.questions, key=lambda q: (q.position, q.id))
        
    if 1 <= room.current_question_index <= len(sorted_questions):
        q = sorted_questions[room.current_question_index - 1]
        
        # Format Options with keys A, B, C, D
        KEYS = ["A", "B", "C", "D"]
        sorted_opts = sorted(q.options, key=lambda o: o.id)
        options_live = []
        correct_option_key = None
        for idx, opt in enumerate(sorted_opts):
            options_live.append({
                "id": opt.id,
                "key": KEYS[idx] if idx < len(KEYS) else "A",
                "label": opt.content or ""
            })
            if opt.is_correct:
                correct_option_key = KEYS[idx] if idx < len(KEYS) else "A"
            
        raw_type = (q.type or "multiple_choice").lower().strip()
        is_short_answer = raw_type in ["short_answer", "short answer", "short", "fill in the blank", "fill_in_the_blank", "fill_in"]
        standardized_type = "SHORT_ANSWER" if is_short_answer else "MULTIPLE_CHOICE"

        active_question = {
            "id": q.id,
            "text": q.content or "",
            "type": standardized_type,
            "time_limit": q.time_limit,
            "options": options_live,
            "correct_option_key": correct_option_key,
            "audio_url": q.audio_url,
            "media_url": q.media_url,
            "audio_play_limit": q.audio_play_limit,
        }

    # 2. Participants and Answer Distribution
    participants_live = []
    distribution = {}

    from app.models.room import ParticipantAnswer
    from app.models.badge import UserBadge, Badge

    def _get_equipped_title(user_id):
        """Resolve the currently equipped TITLE badge name for a given user."""
        if not user_id:
            return None
        title_row = (
            db.query(Badge.name)
            .join(UserBadge, UserBadge.badge_id == Badge.id)
            .filter(
                UserBadge.user_id == user_id,
                UserBadge.is_equipped == True,
                Badge.category == "TITLE"
            )
            .first()
        )
        return title_row[0] if title_row else None

    is_short_ans = False
    if active_question:
        raw_type = (q.type or "multiple_choice").lower().strip()
        is_short_ans = raw_type in ["short_answer", "short answer", "short", "fill in the blank", "fill_in_the_blank", "fill_in"]

    if is_short_ans and active_question:
        for p in room.participants:
            answered = False
            ans = db.query(ParticipantAnswer).filter(
                ParticipantAnswer.participant_id == p.id,
                ParticipantAnswer.question_id == active_question["id"]
            ).first()
            if ans:
                answered = True
                ans_text = (ans.answer_text or "").strip()
                if not ans_text:
                    ans_text = "[No Answer]"
                distribution[ans_text] = distribution.get(ans_text, 0) + 1
            participants_live.append({
                "id": p.id,
                "nickname": p.nickname or "",
                "score": p.score,
                "answered": answered,
                "equipped_title": _get_equipped_title(p.user_id),
            })
    else:
        distribution = {"A": 0, "B": 0, "C": 0, "D": 0}
        for p in room.participants:
            answered = False
            if active_question:
                ans = db.query(ParticipantAnswer).filter(
                    ParticipantAnswer.participant_id == p.id,
                    ParticipantAnswer.question_id == active_question["id"]
                ).first()
                if ans:
                    answered = True
                    selected_key = next((o["key"] for o in active_question["options"] if o["id"] == ans.selected_option_id), None)
                    if selected_key in distribution:
                        distribution[selected_key] += 1
            participants_live.append({
                "id": p.id,
                "nickname": p.nickname or "",
                "score": p.score,
                "answered": answered,
                "equipped_title": _get_equipped_title(p.user_id),
            })

    from app.services.redis_room_service import redis_room_service
    top_votes = []
    qa_state = {"is_active": False, "current_question_id": None}
    chat_messages = []
    if room.room_code:
        try:
            top_votes = await redis_room_service.get_top_voted_questions(room.room_code)
            qa_state = await redis_room_service.get_qa_session_state(room.room_code)
            chat_messages = await redis_room_service.get_chat_messages(room.room_code)
        except Exception as e_live:
            logger.warning(f"Failed to fetch live votes/qa state for room {room.room_code}: {e_live}")

    return {
        "room_id": room.id,
        "room_code": room.room_code or "",
        "status": room.status or "",
        "mode": room.mode or "CLASSIC",
        "progression_mode": room.progression_mode or "manual",
        "allow_show_rank": room.allow_show_rank,
        "current_question_index": room.current_question_index,
        "current_question_started_at": room.current_question_started_at,
        "quiz_title": room.quiz.title if room.quiz else "Quiz",
        "total_questions": len(room.quiz.questions) if room.quiz and room.quiz.questions else 0,
        "active_question": active_question,
        "participants": participants_live,
        "answer_distribution": distribution,
        "top_voted_questions": top_votes,
        "qa_state": qa_state,
        "chat_messages": chat_messages
    }


@router.post("/{room_id}/next-question", response_model=RoomResponse, summary="Host advances room to the next question")
async def next_question(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Advance the live quiz session to the next question.
    Only the host of the room can trigger this action.
    """
    room = crud_room.get(db=db, room_id=room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    if room.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to advance this room.")

    from app.services.redis_room_service import redis_room_service
    updated_room = crud_room.next_question(db=db, room=room)
    # Broadcast NEXT_QUESTION to all client WebSockets in room
    await room_websocket_manager.broadcast_to_room(
        room.room_code,
        {
            "type": "NEXT_QUESTION",
            "current_question_index": updated_room.current_question_index,
            "status": updated_room.status
        }
    )
    # Batch flush cached Redis answers to PostgreSQL database
    await redis_room_service.flush_room_answers_to_db(room.room_code, room.id)
    _trigger_auto_advance_if_enabled(db, updated_room)
    return updated_room


@router.post("/{room_code}/submit-answer", response_model=SubmitAnswerResponse, summary="Submit participant's answer to the active question")
async def submit_answer(
    room_code: str,
    *,
    db: Session = Depends(get_db),
    answer_in: SubmitAnswerIn,
) -> Any:
    """
    Submit participant's answer for the active question.
    Calculates dynamic scoring based on server time and enforces timeouts (0 score if time is up).
    """
    from starlette.concurrency import run_in_threadpool
    from app.services.redis_room_service import redis_room_service

    # 1. Get Room
    room = await run_in_threadpool(crud_room.get_by_code, db=db, room_code=room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Active room not found or has already ended.")

    if room.status != "PLAYING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit answers because room status is {room.status}. Must be PLAYING."
        )

    # 2. Get Participant
    from app.models.room import Participant
    participant = await run_in_threadpool(
        lambda: db.query(Participant).filter(
            Participant.id == answer_in.participant_id,
            Participant.room_id == room.id
        ).first()
    )
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found in this room.")

    # 3. Submit Answer
    import datetime
    now = datetime.datetime.utcnow()
    try:
        is_correct, score, total_score, correct_option_key = await run_in_threadpool(
            crud_room.submit_answer,
            db=db,
            room=room,
            participant=participant,
            question_id=answer_in.question_id,
            selected_option_id=answer_in.selected_option_id,
            answer_text=answer_in.answer_text,
            active_power_up=answer_in.active_power_up,
            client_streak=answer_in.streak,
            now=now
        )

        # High-concurrency Redis Store update
        redis_total_score, _ = await redis_room_service.submit_answer_redis(
            room_code=room.room_code,
            participant_id=participant.id,
            question_id=answer_in.question_id,
            selected_option_id=answer_in.selected_option_id,
            answer_text=answer_in.answer_text,
            is_correct=is_correct,
            score=score,
            correct_option_key=correct_option_key,
        )

        # Real-time WebSocket notification to host panel
        await room_websocket_manager.broadcast_to_room(
            room.room_code,
            {
                "type": "ANSWER_SUBMITTED",
                "participant_id": participant.id,
                "question_id": answer_in.question_id
            }
        )

        if participant.user:
            pts = 15 if is_correct else 10
            await run_in_threadpool(crud_user.add_achievement_points, db, participant.user, pts)

        return {
            "is_correct": is_correct,
            "score": score,
            "total_score": redis_total_score or total_score,
            "correct_option_key": correct_option_key
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: {str(e)}\nTraceback:\n{tb}"
        )


@router.patch("/{room_id}/settings", response_model=RoomResponse, summary="Update live room settings (e.g. progression_mode)")
def update_room_settings(
    room_id: int,
    *,
    db: Session = Depends(get_db),
    settings_in: RoomSettingsUpdate,
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Update configuration options of a live room (such as progression_mode).
    Only the room host can update these settings.
    """
    room = crud_room.get(db=db, room_id=room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    if room.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to update settings for this room.")

    updated_room = crud_room.update_settings(db=db, room=room, obj_in=settings_in)
    if (updated_room.progression_mode or "").lower() == "auto" and updated_room.status == "PLAYING":
        _trigger_auto_advance_if_enabled(db, updated_room)
    return updated_room


@router.post("/participants/{participant_id}/leave", summary="Leave a live room")
async def leave_room_endpoint(
    participant_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Remove a participant from the room when they choose to leave.
    """
    from app.models.room import Participant
    participant = db.query(Participant).filter(Participant.id == participant_id).first()
    room_code = None
    nickname = None
    if participant and participant.room:
        room_code = participant.room.room_code
        nickname = participant.nickname

    success = crud_room.leave_room(db=db, participant_id=participant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found."
        )

    if room_code and nickname:
        db_room = crud_room.get_by_code(db=db, room_code=room_code)
        active_nicknames = [p.nickname for p in db_room.participants] if db_room else []
        await room_websocket_manager.broadcast_to_room(
            room_code,
            {
                "type": "PLAYER_LEFT",
                "player": nickname,
                "players": active_nicknames
            }
        )
        
    return {"message": "Successfully left the room."}
@router.post("/{room_code}/vote-question", summary="Vote for a question in a room (HTTP Fallback)")
async def vote_question_endpoint(
    room_code: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
) -> Any:
    question_id = payload.get("question_id")
    participant_id = payload.get("participant_id") or 0
    voter_nickname = payload.get("nickname") or "guest"
    if not question_id:
        raise HTTPException(status_code=400, detail="question_id is required")

    voter_key = str(participant_id) if participant_id and int(participant_id) > 0 else voter_nickname
    new_votes = await redis_room_service.vote_question_redis(
        room_code=room_code,
        question_id=int(question_id),
        voter_id=voter_key,
    )

    top_questions = await redis_room_service.get_top_voted_questions(room_code)

    await room_websocket_manager.broadcast_to_room(
        room_code,
        {
            "type": "QUESTION_VOTED",
            "t": "QV",
            "question_id": question_id,
            "vote_count": new_votes,
            "top_questions": top_questions,
        }
    )

    return {
        "status": "ok",
        "question_id": question_id,
        "vote_count": new_votes,
        "top_voted_questions": top_questions
    }


@router.post("/{room_code}/start-qa", summary="Start Q&A Mode in room (WS + HTTP Fallback)")
async def start_qa_endpoint(
    room_code: str,
    db: Session = Depends(get_db),
) -> Any:
    first_top_q = None
    all_top_qs = await redis_room_service.get_top_voted_questions(room_code)
    if all_top_qs:
        first_top_q = all_top_qs[0].get("question_id")

    await redis_room_service.set_qa_session_state(
        room_code,
        is_active=True,
        current_question_id=first_top_q
    )

    await room_websocket_manager.broadcast_to_room(
        room_code,
        {
            "type": "QA_SESSION_STARTED",
            "t": "QAS",
            "current_question_id": first_top_q,
            "top_questions": all_top_qs,
        }
    )

    return {
        "status": "ok",
        "qa_state": {
            "is_active": True,
            "current_question_id": first_top_q
        },
        "top_voted_questions": all_top_qs
    }


@router.post("/{room_code}/chat-message", summary="Send live Q&A chat message (WS + HTTP Fallback)")
async def send_chat_message_endpoint(
    room_code: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
) -> Any:
    sender = payload.get("sender") or "User"
    text = (payload.get("message") or payload.get("text") or "").strip()
    avatar = payload.get("avatar")

    if not text:
        raise HTTPException(
            status_code=400,
            detail="message content is required"
        )

    msg_item = await redis_room_service.add_chat_message(
        room_code,
        sender=sender,
        text=text,
        avatar=avatar,
        timestamp=payload.get("timestamp")
    )

    await room_websocket_manager.broadcast_to_room(
        room_code,
        {
            "type": "CHAT_MESSAGE_RECEIVED",
            "t": "CMR",
            "sender": msg_item["sender"],
            "text": msg_item["text"],
            "message": msg_item["text"],
            "avatar": msg_item["avatar"],
            "timestamp": msg_item["timestamp"],
        }
    )

    return {
        "status": "ok",
        "sender": sender,
        "text": text
    }


@router.post("/{room_code}/select-qa-question", summary="Select active Q&A question in room (WS + HTTP Fallback)")
async def select_qa_question_endpoint(
    room_code: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
) -> Any:
    target_qid = payload.get("question_id") or payload.get("qid")

    await redis_room_service.set_qa_session_state(
        room_code,
        is_active=True,
        current_question_id=target_qid
    )

    await room_websocket_manager.broadcast_to_room(
        room_code,
        {
            "type": "QA_QUESTION_CHANGED",
            "t": "QC",
            "current_question_id": target_qid,
        }
    )

    return {
        "status": "ok",
        "current_question_id": target_qid
    }

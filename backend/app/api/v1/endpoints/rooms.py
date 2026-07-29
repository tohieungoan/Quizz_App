from typing import Any, Optional
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
    quiz = crud_quiz.get(db=db, quiz_id=room_in.quiz_id)
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
        return room
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{room_code}", response_model=RoomResponse, summary="Get active room by code")
def get_room_by_code(
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
        sorted_questions = sorted(room.quiz.questions, key=lambda q: q.id)
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
            active_q = {
                "id": q.id,
                "text": q.content or "",
                "time_limit": q.time_limit,
                "options": options_live,
                "correct_option_key": None
            }

    # Populate room fields dynamically
    room.active_question = active_q
    return room


@router.post("/{room_id}/end", response_model=RoomResponse, summary="End a live room")
def end_room(
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

    updated_room = crud_room.update_status(db=db, room=room, status="ENDED")
    return updated_room


@router.post("/{room_code}/join", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED, summary="Join a live room by code")
def join_room_by_code(
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
    # 1. Verify if the room exists and is active
    room = crud_room.get_by_code(db=db, room_code=room_code)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active room not found or has already ended."
        )

    # 2. Check if registration is allowed (e.g. room status is WAITING)
    if room.status not in ["WAITING", "PLAYING"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot join room because its current status is {room.status}."
        )

    try:
        user_id = current_user.id if current_user else None
        participant = crud_room.join_room(
            db=db,
            room=room,
            nickname=participant_in.nickname,
            user_id=user_id
        )
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
    return room.participants


@router.post("/{room_id}/start", response_model=RoomResponse, summary="Start a live room (change status to PLAYING)")
def start_room(
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

    updated_room = crud_room.next_question(db=db, room=room)
    return updated_room


@router.get("/{room_id}/live-session", response_model=RoomLiveStatus, summary="Get real-time live session data (Host Panel)")
def get_live_session(
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
        sorted_questions = sorted(room.quiz.questions, key=lambda q: q.id)
        
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
            
        active_question = {
            "id": q.id,
            "text": q.content or "",
            "time_limit": q.time_limit,
            "options": options_live,
            "correct_option_key": correct_option_key
        }

    # 2. Participants and Answer Distribution
    participants_live = []
    distribution = {"A": 0, "B": 0, "C": 0, "D": 0}
    
    from app.models.room import ParticipantAnswer
    
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
            "answered": answered
        })

    return {
        "room_id": room.id,
        "room_code": room.room_code or "",
        "status": room.status or "",
        "current_question_index": room.current_question_index,
        "current_question_started_at": room.current_question_started_at,
        "quiz_title": room.quiz.title if room.quiz else "Quiz",
        "active_question": active_question,
        "participants": participants_live,
        "answer_distribution": distribution
    }


@router.post("/{room_id}/next-question", response_model=RoomResponse, summary="Host advances room to the next question")
def next_question(
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

    updated_room = crud_room.next_question(db=db, room=room)
    return updated_room


@router.post("/{room_code}/submit-answer", response_model=SubmitAnswerResponse, summary="Submit participant's answer to the active question")
def submit_answer(
    room_code: str,
    *,
    db: Session = Depends(get_db),
    answer_in: SubmitAnswerIn,
) -> Any:
    """
    Submit participant's answer for the active question.
    Calculates dynamic scoring based on server time and enforces timeouts (0 score if time is up).
    """
    # 1. Get Room
    room = crud_room.get_by_code(db=db, room_code=room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Active room not found or has already ended.")

    if room.status != "PLAYING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit answers because room status is {room.status}. Must be PLAYING."
        )

    # 2. Get Participant
    from app.models.room import Participant
    participant = db.query(Participant).filter(
        Participant.id == answer_in.participant_id,
        Participant.room_id == room.id
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found in this room.")

    # 3. Submit
    import datetime
    now = datetime.datetime.utcnow()
    try:
        is_correct, score, correct_option_key = crud_room.submit_answer(
            db=db,
            room=room,
            participant=participant,
            question_id=answer_in.question_id,
            selected_option_id=answer_in.selected_option_id,
            now=now
        )
        return {
            "is_correct": is_correct,
            "score": score,
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
    return updated_room
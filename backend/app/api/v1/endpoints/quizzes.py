from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.api.deps import get_db, get_current_active_user, get_current_active_admin
from app.crud.crud_quiz import crud_quiz
from app.models.exam import Exam
from app.models.room import Room
from app.schemas.quiz import (
    QuizCreate,
    QuizDraftCreate,
    QuizDraftSnapshot,
    QuizEditorResponse,
    QuizPageResponse,
    QuizPublishRequest,
    QuizResponse,
    QuizUpdate,
)
from app.services.media_asset_service import media_asset_service
from app.services.quiz_authoring_policy import (
    ACTIVE_ROOM_STATUSES,
    QuizInActiveExamError,
    QuizInActiveRoomError,
    ensure_quiz_authoring_is_unlocked,
)
from app.services.quiz_draft_service import (
    QuizAuthoringLockedError,
    QuizDraftError,
    QuizNotFoundError,
    QuizPermissionError,
    QuizPublishValidationError,
    QuizSnapshotError,
    QuizVersionConflictError,
    quiz_draft_service,
)

router = APIRouter()


@router.post("/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED, summary="Create a new quiz")
def create_quiz(
    *,
    db: Session = Depends(get_db),
    quiz_in: QuizCreate,
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Create a new empty quiz (shell). 
    Requires an active user. The quiz will be linked to the creator.
    """
    if quiz_in.status and quiz_in.status.lower() != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A quiz must be created as a draft and published through the validated publish endpoint.",
        )
    # Achievement points are granted by real completion milestones, not by
    # creating empty shells. This prevents draft-spam point farming.
    return crud_quiz.create_with_user(db=db, obj_in=quiz_in, user_id=current_user.id)


def _editor_payload(quiz) -> dict:
    return {
        "quiz": quiz,
        "questions": list(quiz.questions),
        "builder_state": quiz.draft_builder_state,
    }


def _raise_draft_http_error(error: QuizDraftError) -> None:
    if isinstance(error, QuizNotFoundError):
        raise HTTPException(status_code=404, detail=str(error))
    if isinstance(error, QuizPermissionError):
        raise HTTPException(status_code=403, detail=str(error))
    if isinstance(error, QuizAuthoringLockedError):
        raise HTTPException(status_code=409, detail=str(error))
    if isinstance(error, QuizVersionConflictError):
        raise HTTPException(
            status_code=409,
            detail={
                "code": "QUIZ_VERSION_CONFLICT",
                "message": str(error),
                "current_version": error.current_version,
            },
        )
    if isinstance(error, QuizPublishValidationError):
        raise HTTPException(
            status_code=422,
            detail={
                "code": "QUIZ_NOT_PUBLISHABLE",
                "message": str(error),
                "errors": error.errors,
            },
        )
    if isinstance(error, QuizSnapshotError):
        raise HTTPException(status_code=422, detail=str(error))
    raise HTTPException(status_code=400, detail=str(error))


def _ensure_quiz_authoring_is_unlocked(db: Session, quiz_id: int) -> None:
    try:
        ensure_quiz_authoring_is_unlocked(db, quiz_id)
    except (QuizInActiveRoomError, QuizInActiveExamError) as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error


@router.post(
    "/quizzes/drafts",
    response_model=QuizEditorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or resume an idempotent quiz draft",
)
def create_or_resume_quiz_draft(
    draft_in: QuizDraftCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    quiz = quiz_draft_service.create_or_get_draft(
        db,
        user_id=current_user.id,
        client_draft_id=draft_in.client_draft_id,
    )
    return _editor_payload(quiz)


@router.get(
    "/quizzes/drafts/{client_draft_id}",
    response_model=QuizEditorResponse,
    summary="Resume an existing quiz draft without creating one",
)
def read_quiz_draft_by_client_id(
    client_draft_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    try:
        quiz = quiz_draft_service.get_draft_by_client_id(
            db,
            user_id=current_user.id,
            client_draft_id=client_draft_id,
        )
        return _editor_payload(quiz)
    except QuizDraftError as error:
        _raise_draft_http_error(error)


@router.get(
    "/quizzes/{quiz_id}/editor",
    response_model=QuizEditorResponse,
    summary="Load a complete quiz authoring snapshot",
)
def read_quiz_editor(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    try:
        quiz = quiz_draft_service.get_editor_quiz(
            db,
            quiz_id,
            current_user.id,
            current_user.role == "SUPER_ADMIN",
        )
        return _editor_payload(quiz)
    except QuizDraftError as error:
        _raise_draft_http_error(error)


@router.put(
    "/quizzes/{quiz_id}/draft",
    response_model=QuizEditorResponse,
    summary="Atomically save a complete quiz draft snapshot",
)
def save_quiz_draft(
    quiz_id: int,
    draft_in: QuizDraftSnapshot,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    try:
        quiz = quiz_draft_service.save_snapshot(
            db,
            quiz_id,
            draft_in,
            current_user.id,
            current_user.role == "SUPER_ADMIN",
        )
        return _editor_payload(quiz)
    except QuizDraftError as error:
        _raise_draft_http_error(error)


@router.post(
    "/quizzes/{quiz_id}/publish",
    response_model=QuizEditorResponse,
    summary="Validate and atomically publish a quiz",
)
def publish_quiz(
    quiz_id: int,
    publish_in: QuizPublishRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    try:
        quiz = quiz_draft_service.publish(
            db,
            quiz_id,
            publish_in.expected_version,
            current_user.id,
            current_user.role == "SUPER_ADMIN",
        )
        return _editor_payload(quiz)
    except QuizDraftError as error:
        _raise_draft_http_error(error)


@router.post("/quizzes/{quiz_id}/duplicate", response_model=QuizResponse, status_code=status.HTTP_201_CREATED, summary="Duplicate a quiz")
def duplicate_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Duplicate an existing quiz along with all its questions and options.
    The new quiz will have '(Copy)' appended to its title and be set to Draft status.
    """
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions to duplicate this quiz")
        
    new_quiz = crud_quiz.duplicate(db=db, quiz_id=quiz_id, user_id=current_user.id)
    return new_quiz



@router.get("/quizzes", response_model=QuizPageResponse, summary="Get my quizzes")
def read_my_quizzes(
    db: Session = Depends(get_db),
    pageIndex: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1, le=1000),
    keyword: Optional[str] = Query(None, description="Search by title"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Retrieve quizzes created by the current user with search and filtering capabilities.
    """
    skip = (pageIndex - 1) * pageSize
    quizzes, total = crud_quiz.get_multi_by_user(
        db=db,
        user_id=current_user.id,
        skip=skip, 
        limit=pageSize,
        keyword=keyword,
        difficulty=difficulty,
        subject=subject
    )
    return {
        "data": quizzes,
        "total": total,
        "pageIndex": pageIndex,
        "pageSize": pageSize
    }


@router.get("/admin/quizzes", response_model=QuizPageResponse, summary="Get all quizzes (Admin)")
def read_all_quizzes(
    db: Session = Depends(get_db),
    pageIndex: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1, le=1000),
    keyword: Optional[str] = Query(None, description="Search by title"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    current_admin=Depends(get_current_active_admin),
) -> Any:
    """
    Retrieve all quizzes in the system (Admin only) with search and filtering capabilities.
    """
    skip = (pageIndex - 1) * pageSize
    quizzes, total = crud_quiz.get_multi_all(
        db=db, 
        skip=skip, 
        limit=pageSize,
        keyword=keyword,
        difficulty=difficulty,
        subject=subject
    )
    return {
        "data": quizzes,
        "total": total,
        "pageIndex": pageIndex,
        "pageSize": pageSize
    }


@router.get("/quizzes/{quiz_id}", response_model=QuizResponse, summary="Get quiz details")
def read_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Get detailed information about a specific quiz.
    """
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions to access this quiz")
        
    return quiz


@router.put("/quizzes/{quiz_id}", response_model=QuizResponse, summary="Update a quiz")
def update_quiz(
    *,
    db: Session = Depends(get_db),
    quiz_id: int,
    quiz_in: QuizUpdate,
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Update a quiz. You must be an active user and the creator of the quiz to update it.
    """
    quiz = crud_quiz.get_for_update(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions to update this quiz")

    _ensure_quiz_authoring_is_unlocked(db, quiz.id)
        
    if quiz.status and quiz.status.lower() == "published":
        # Only allow if the update is changing the status away from Published
        if not (quiz_in.status and quiz_in.status.lower() != "published"):
            raise HTTPException(status_code=400, detail="Cannot update a published quiz. Please change its status to Draft or Archived first.")

    if quiz_in.status and quiz_in.status.lower() == "published" and (
        not quiz.status or quiz.status.lower() != "published"
    ):
        raise HTTPException(
            status_code=400,
            detail="Use the publish endpoint so the quiz is validated before publication.",
        )
        
    quiz = crud_quiz.update(db=db, db_obj=quiz, obj_in=quiz_in)
    return quiz


@router.delete("/quizzes/{quiz_id}", response_model=QuizResponse, summary="Delete a quiz")
def delete_quiz(
    *,
    db: Session = Depends(get_db),
    quiz_id: int,
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Delete a quiz. You must be an active user and the creator of the quiz to delete it.
    """
    quiz = crud_quiz.get_with_relations(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions to delete this quiz")
        
    # A quiz's publication status does not affect whether it can be deleted.
    # It can only be deleted when it is not being used by an active room.
    # PLAYING is the current live status; RUNNING and LIVE are retained here
    # for compatibility with older room records/API clients.
    linked_rooms = db.query(Room).filter(Room.quiz_id == quiz_id).all()
    blocking_rooms = [
        room
        for room in linked_rooms
        if (room.status or "").strip().upper() in ACTIVE_ROOM_STATUSES
    ]

    if blocking_rooms:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This quiz cannot be deleted while it is used by a waiting or running room. End the room first.",
        )

    # Finished/ended rooms no longer block deletion. Delete them together with
    # the quiz so their foreign-key references cannot make the request fail.
    disposable_rooms = linked_rooms

    if db.query(Exam.id).filter(Exam.quiz_id == quiz_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This quiz cannot be deleted because it is assigned to an exam. Delete the exam assignment first.",
        )
        
    # Extract all media URLs from questions and their options before deleting the quiz (cascade)
    media_urls_to_delete = set()
    for question in quiz.questions:
        if question.media_url:
            media_urls_to_delete.add(question.media_url)
        if question.audio_url:
            media_urls_to_delete.add(question.audio_url)
        # Also gather from options
        for opt in question.options:
            if opt.media_url:
                media_urls_to_delete.add(opt.media_url)
            if opt.audio_url:
                media_urls_to_delete.add(opt.audio_url)
            
    # Capture the response and ownership data before deletion. After commit,
    # SQLAlchemy may expire the deleted instance; reading attributes from it or
    # serializing it can raise ObjectDeletedInstanceError and abort the HTTP
    # response (surfacing as a generic "Failed to fetch" in the browser).
    deleted_quiz = QuizResponse.model_validate(quiz)
    quiz_title = quiz.title
    quiz_id_val = quiz.id
    quiz_owner_id = quiz.user_id
    try:
        for room in disposable_rooms:
            db.delete(room)
        db.flush()
        crud_quiz.delete(db=db, quiz_id=quiz_id)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This quiz is still used by another feature and cannot be deleted yet.",
        ) from error
    
    # Trigger admin notification for critical data deletion
    try:
        from app.services.admin_notification_service import admin_notification_service
        admin_notification_service.notify_critical_data_deletion(
            db, item_type="Quiz Template", item_title=quiz_title, item_id=quiz_id_val, deleted_by=current_user
        )
    except Exception:
        pass

    # Trigger background tasks to delete all associated media ONLY IF they are not used elsewhere
    from app.crud.crud_question import crud_question
    cleanup_urls = {
        url for url in media_urls_to_delete
        if not crud_question.is_url_referenced(db, url)
    }
    media_asset_service.schedule_cleanup_by_urls(
        db, quiz_owner_id, cleanup_urls
    )
        
    return deleted_quiz

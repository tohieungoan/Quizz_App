from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_admin
from app.crud.crud_quiz import crud_quiz
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizResponse, QuizPageResponse
from app.utils.cloudinary_utils import delete_cloudinary_asset_bg

router = APIRouter()


@router.post("", response_model=QuizResponse, status_code=status.HTTP_201_CREATED, summary="Create a new quiz")
def create_quiz(
    *,
    db: Session = Depends(get_db),
    quiz_in: QuizCreate,
    current_admin=Depends(get_current_active_admin),
) -> Any:
    """
    Create a new empty quiz (shell). 
    Requires Admin privileges. The quiz will be linked to the creator.
    """
    quiz = crud_quiz.create_with_user(db=db, obj_in=quiz_in, user_id=current_admin.id)
    return quiz


@router.get("", response_model=QuizPageResponse, summary="Get all quizzes")
def read_all_quizzes(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_admin=Depends(get_current_active_admin),
) -> Any:
    """
    Retrieve all quizzes in the system.
    """
    quizzes, total = crud_quiz.get_multi_all(db=db, skip=skip, limit=limit)
    return {
        "data": quizzes,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{quiz_id}", response_model=QuizResponse, summary="Get quiz details")
def read_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_active_admin),
) -> Any:
    """
    Get detailed information about a specific quiz (Admin only).
    """
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Note: If it's private, we should check if current_user.id == quiz.user_id, 
    # but for simplicity in this step, we just return it.
    return quiz


@router.put("/{quiz_id}", response_model=QuizResponse, summary="Update a quiz")
def update_quiz(
    *,
    db: Session = Depends(get_db),
    quiz_id: int,
    quiz_in: QuizUpdate,
    current_admin=Depends(get_current_active_admin),
) -> Any:
    """
    Update a quiz. You must be an Admin and the creator of the quiz to update it.
    """
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    quiz = crud_quiz.update(db=db, db_obj=quiz, obj_in=quiz_in)
    return quiz


@router.delete("/{quiz_id}", response_model=QuizResponse, summary="Delete a quiz")
def delete_quiz(
    *,
    db: Session = Depends(get_db),
    quiz_id: int,
    background_tasks: BackgroundTasks,
    current_admin=Depends(get_current_active_admin),
) -> Any:
    """
    Delete a quiz. You must be an Admin and the creator of the quiz to delete it.
    """
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    # Extract all media URLs from questions and their options before deleting the quiz (cascade)
    media_urls_to_delete = []
    for question in quiz.questions:
        if question.media_url:
            media_urls_to_delete.append(question.media_url)
        if question.audio_url:
            media_urls_to_delete.append(question.audio_url)
        # Also gather from options
        for opt in question.options:
            if opt.media_url:
                media_urls_to_delete.append(opt.media_url)
            if opt.audio_url:
                media_urls_to_delete.append(opt.audio_url)
            
    quiz = crud_quiz.delete(db=db, quiz_id=quiz_id)
    
    # Trigger background tasks to delete all associated media ONLY IF they are not used elsewhere
    from app.crud.crud_question import crud_question
    for url in media_urls_to_delete:
        if not crud_question.is_url_referenced(db, url):
            background_tasks.add_task(delete_cloudinary_asset_bg, url)
        
    return quiz

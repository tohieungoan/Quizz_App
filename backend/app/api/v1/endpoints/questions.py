from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_admin
from app.crud.crud_question import crud_question
from app.crud.crud_quiz import crud_quiz
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse
from app.utils.cloudinary_utils import delete_cloudinary_asset_bg

router = APIRouter()

@router.post("/{quiz_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED, summary="Add a question to a quiz")
def create_question(
    quiz_id: int,
    question_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_active_admin),
) -> Any:
    """
    Create a new question (and its options) inside a specific quiz.
    Requires Admin privileges.
    """
    # Verify quiz exists
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    question = crud_question.create_with_options(db=db, obj_in=question_in, quiz_id=quiz_id)
    return question


@router.get("/{quiz_id}/questions", response_model=List[QuestionResponse], summary="Get all questions for a quiz")
def read_questions(
    quiz_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> Any:
    """
    Retrieve all questions for a specific quiz.
    """
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    questions = crud_question.get_multi_by_quiz(db=db, quiz_id=quiz_id, skip=skip, limit=limit)
    return questions



@router.put("/questions/{question_id}", response_model=QuestionResponse, summary="Update a question")
def update_question(
    question_id: int,
    question_in: QuestionUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_active_admin),
) -> Any:
    """
    Update a question (excluding options for now).
    """
    question = crud_question.get(db=db, question_id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    old_media_url = question.media_url
    old_audio_url = question.audio_url
        
    question, orphaned_urls = crud_question.update_with_options(db=db, db_obj=question, obj_in=question_in)
    
    # Check if main media or audio was replaced or removed, then add to orphaned list
    if old_media_url and question.media_url != old_media_url:
        orphaned_urls.append(old_media_url)
    if old_audio_url and question.audio_url != old_audio_url:
        orphaned_urls.append(old_audio_url)
        
    # Trigger background tasks to delete all orphaned assets
    for url in orphaned_urls:
        if url and not crud_question.is_url_referenced(db, url):
            background_tasks.add_task(delete_cloudinary_asset_bg, url)
        
    return question


@router.delete("/questions/{question_id}", summary="Delete a question")
def delete_question(
    question_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_active_admin),
) -> Any:
    """
    Delete a question and its options.
    """
    question = crud_question.get(db=db, question_id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    urls_to_check = set()
    if question.media_url:
        urls_to_check.add(question.media_url)
    if question.audio_url:
        urls_to_check.add(question.audio_url)
        
    # Gather URLs from all options before deletion
    for opt in question.options:
        if opt.media_url:
            urls_to_check.add(opt.media_url)
        if opt.audio_url:
            urls_to_check.add(opt.audio_url)
            
    crud_question.delete(db=db, question_id=question_id)
    
    # Trigger background tasks to delete associated media if they are no longer referenced
    for url in urls_to_check:
        if not crud_question.is_url_referenced(db, url):
            background_tasks.add_task(delete_cloudinary_asset_bg, url)
        
    return {"detail": "Question deleted successfully"}

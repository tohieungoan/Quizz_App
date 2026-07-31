from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.crud.crud_question import crud_question
from app.crud.crud_quiz import crud_quiz
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionPageResponse, QuestionImport
from app.utils.cloudinary_utils import delete_cloudinary_asset_bg

router = APIRouter()

@router.get("/questions/bank", response_model=QuestionPageResponse, summary="Get question bank")
def read_question_bank(
    db: Session = Depends(get_db),
    pageIndex: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1, le=1000),
    keyword: Optional[str] = Query(None, description="Search by content"),
    quiz_id: Optional[int] = Query(None, description="Filter by quiz ID"),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Retrieve all questions across all quizzes for the current user.
    """
    skip = (pageIndex - 1) * pageSize
    questions, total = crud_question.get_bank_questions(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=pageSize,
        keyword=keyword,
        quiz_id=quiz_id
    )
    return {
        "data": questions,
        "total": total,
        "pageIndex": pageIndex,
        "pageSize": pageSize
    }

@router.post("/{quiz_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED, summary="Add a question to a quiz")
def create_question(
    quiz_id: int,
    question_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Create a new question (and its options) inside a specific quiz.
    Requires an active user.
    """
    # Verify quiz exists
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions to add questions to this quiz")
        
    if quiz.status and quiz.status.lower() == "published":
        raise HTTPException(status_code=400, detail="Cannot add questions to a published quiz. Please change its status to Draft first.")
        
    question = crud_question.create_with_options(db=db, obj_in=question_in, quiz_id=quiz_id)
    return question


@router.post("/{quiz_id}/questions/import", response_model=List[QuestionResponse], status_code=status.HTTP_201_CREATED, summary="Import questions into a quiz")
def import_questions(
    quiz_id: int,
    import_data: QuestionImport,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Import a list of existing questions from the Question Bank into a specific quiz.
    Requires an active user who owns the destination quiz.
    """
    # 1. Verify destination quiz exists and belongs to the user
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if quiz.status and quiz.status.lower() == "published":
        raise HTTPException(status_code=400, detail="Cannot import questions into a published quiz. Please change its status to Draft first.")
        
    # 2. Perform the import (duplicate questions and options)
    imported_questions = crud_question.import_questions_to_quiz(
        db=db, 
        target_quiz_id=quiz_id, 
        question_ids=import_data.question_ids,
        user_id=current_user.id
    )
    
    return imported_questions


@router.get("/{quiz_id}/questions", response_model=List[QuestionResponse], summary="Get all questions for a quiz")
def read_questions(
    quiz_id: int,
    db: Session = Depends(get_db),
    pageIndex: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=1, le=1000),
    keyword: Optional[str] = Query(None, description="Search in question content"),
    difficulty: Optional[str] = Query(None, description="Filter by question difficulty"),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Retrieve all questions for a specific quiz, with optional search and filtering.
    """
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if not quiz.is_public and quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions to view questions for this quiz")
        
    skip = (pageIndex - 1) * pageSize
    questions = crud_question.get_multi_by_quiz(
        db=db, quiz_id=quiz_id, skip=skip, limit=pageSize,
        keyword=keyword, difficulty=difficulty
    )
    return questions



@router.put("/questions/{question_id}", response_model=QuestionResponse, summary="Update a question")
def update_question(
    question_id: int,
    question_in: QuestionUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Update a question (excluding options for now).
    """
    question = crud_question.get(db=db, question_id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if question.quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions to update this question")
        
    if question.quiz.status and question.quiz.status.lower() == "published":
        raise HTTPException(status_code=400, detail="Cannot update a question in a published quiz. Please change the quiz status to Draft first.")
        
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
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Delete a question and its options.
    """
    question = crud_question.get(db=db, question_id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if question.quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions to delete this question")
        
    if question.quiz.status and question.quiz.status.lower() == "published":
        raise HTTPException(status_code=400, detail="Cannot delete a question in a published quiz. Please change the quiz status to Draft first.")
        
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

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, get_current_active_admin
from app.crud.crud_quiz import crud_quiz
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizResponse, QuizPageResponse
from app.utils.cloudinary_utils import delete_cloudinary_asset_bg

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
    quiz = crud_quiz.create_with_user(db=db, obj_in=quiz_in, user_id=current_user.id)
    return quiz


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
    quiz = crud_quiz.get(db=db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions to update this quiz")
        
    if quiz.status and quiz.status.lower() == "published":
        # Only allow if the update is changing the status away from Published
        if not (quiz_in.status and quiz_in.status.lower() != "published"):
            raise HTTPException(status_code=400, detail="Cannot update a published quiz. Please change its status to Draft or Archived first.")
        
    quiz = crud_quiz.update(db=db, db_obj=quiz, obj_in=quiz_in)
    return quiz


@router.delete("/quizzes/{quiz_id}", response_model=QuizResponse, summary="Delete a quiz")
def delete_quiz(
    *,
    db: Session = Depends(get_db),
    quiz_id: int,
    background_tasks: BackgroundTasks,
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
        
    if quiz.status and quiz.status.lower() == "published":
        raise HTTPException(status_code=400, detail="Cannot delete a published quiz. Please change its status to Draft or Archived first.")
        
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
            
    quiz = crud_quiz.delete(db=db, quiz_id=quiz_id)
    
    # Trigger background tasks to delete all associated media ONLY IF they are not used elsewhere
    from app.crud.crud_question import crud_question
    for url in media_urls_to_delete:
        if not crud_question.is_url_referenced(db, url):
            background_tasks.add_task(delete_cloudinary_asset_bg, url)
        
    return quiz

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.quiz import Quiz, Question, QuestionOption
from app.models.group import Group, GroupMember
from app.models.exam import Exam, ExamAssignee, ExamAnswer
from app.models.notification import Notification
from app.schemas.exam import (
    ExamAssignRequest,
    ExamUpdateRequest,
    ExamAssignDetailResponse,
    ExamResponse,
    UserExamResponse,
    ExamAnswerRequest,
    ExamTakeResponse,
)

def assign_active_exams_to_new_member(db: Session, group_id: int, user_id: int) -> None:
    """
    Find all active, non-expired exams belonging to the given group_id,
    then automatically assign them to user_id (if not already assigned).
    """
    now = datetime.utcnow()
    active_exams = db.query(Exam).filter(
        Exam.group_id == group_id,
        Exam.status == "ACTIVE",
        Exam.end_time > now
    ).all()

    for exam in active_exams:
        exists = db.query(ExamAssignee).filter(
            ExamAssignee.exam_id == exam.id,
            ExamAssignee.user_id == user_id
        ).first()

        if not exists:
            assignee = ExamAssignee(
                exam_id=exam.id,
                user_id=user_id,
                status="PENDING",
            )
            db.add(assignee)

            notification = Notification(
                user_id=user_id,
                sender_id=exam.host_id,
                target_type="PERSONAL",
                target_group_id=group_id,
                title="NEW EXAM ASSIGNED (NEW MEMBER)",
                content=f"You just joined the group and have an ongoing exam '{exam.title}' that must be completed before {exam.end_time.strftime('%Y-%m-%d %H:%M')}.",
                type="EXAM_ASSIGNED",
                action_url=f"/exams/{exam.id}",
                is_read=False,
                created_at=datetime.utcnow()
            )
            db.add(notification)


router = APIRouter()

@router.post("/assign", response_model=ExamAssignDetailResponse, status_code=status.HTTP_201_CREATED, summary="Assign a quiz to a group as an exam")
def assign_exam(
    body: ExamAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Assign a quiz as an exam to a study group.
    Creates an Exam record and links all approved group members as ExamAssignees.
    """
    # 1. Validate Quiz
    quiz = db.query(Quiz).filter(Quiz.id == body.quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )
    if quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to assign this quiz.",
        )

    # 2. Validate Group
    group = db.query(Group).filter(Group.id == body.group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        )
    if group.owner_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to assign exams to this group.",
        )

    # 2.5. Check duplicate active exam for this quiz in this group (same quiz, group, start_time, and end_time)
    duplicate = db.query(Exam).filter(
        Exam.quiz_id == body.quiz_id,
        Exam.group_id == body.group_id,
        Exam.start_time == body.start_time,
        Exam.end_time == body.end_time,
        Exam.status == "ACTIVE"
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active exam with the exact same details and schedule already exists for this group.",
        )

    # 3. Create Exam
    exam_title = body.title.strip() if body.title else quiz.title
    db_exam = Exam(
        quiz_id=body.quiz_id,
        host_id=current_user.id,
        group_id=body.group_id,
        title=exam_title,
        start_time=body.start_time,
        end_time=body.end_time,
        timer=body.timer,
        navigation_rule=body.navigation_rule,
        results_published=body.results_published if body.results_published is not None else False,
        status=body.status,
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)

    # 4. Find all approved group members
    members = db.query(GroupMember).filter(
        GroupMember.group_id == body.group_id,
        GroupMember.status == "APPROVED"
    ).all()

    assignees = []
    # 5. Create ExamAssignee and Notification for each member
    for member in members:
        # Check if already assigned (safety guard)
        exists = db.query(ExamAssignee).filter(
            ExamAssignee.exam_id == db_exam.id,
            ExamAssignee.user_id == member.user_id
        ).first()
        if not exists:
            assignee = ExamAssignee(
                exam_id=db_exam.id,
                user_id=member.user_id,
                status="PENDING",
            )
            db.add(assignee)
            assignees.append(assignee)

            # Create notification
            notification = Notification(
                user_id=member.user_id,
                sender_id=current_user.id,
                target_type="PERSONAL",
                target_group_id=group.id,
                title="NEW EXAM ASSIGNED",
                content=f"You have a new exam '{exam_title}' from the group '{group.name}' that must be completed before {body.end_time.strftime('%Y-%m-%d %H:%M')}.",
                type="EXAM_ASSIGNED",
                action_url=f"/exams/{db_exam.id}",
            )
            db.add(notification)

    db.commit()

    # Refresh assignees to include auto-generated ids
    for assignee in assignees:
        db.refresh(assignee)

    return {
        "exam": db_exam,
        "assignees_count": len(assignees),
        "assignees": assignees
    }


@router.get("/assigned", response_model=List[Any], summary="Retrieve exams assigned by the current user")
def read_assigned_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a list of exams assigned (created) by the logged-in host/teacher.
    Includes aggregated stats for total assignees and submitted answers.
    """
    exams = db.query(Exam).filter(Exam.host_id == current_user.id).all()
    
    result = []
    for exam in exams:
        total_assignees = db.query(ExamAssignee).filter(ExamAssignee.exam_id == exam.id).count()
        submitted_count = db.query(ExamAssignee).filter(
            ExamAssignee.exam_id == exam.id,
            ExamAssignee.submitted_at.isnot(None)
        ).count()

        result.append({
            "id": exam.id,
            "quiz_id": exam.quiz_id,
            "quiz_title": exam.quiz.title if exam.quiz else None,
            "title": exam.title,
            "start_time": exam.start_time,
            "end_time": exam.end_time,
            "timer": exam.timer,
            "status": exam.status,
            "results_published": exam.results_published,
            "total_assignees": total_assignees,
            "submitted_count": submitted_count,
            "created_at": exam.created_at,
        })
    return result


@router.get("/my-exams", response_model=List[UserExamResponse], summary="Retrieve exams assigned to the current user")
def read_my_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a list of exams assigned to the logged-in user.
    """
    assignees = db.query(ExamAssignee).filter(ExamAssignee.user_id == current_user.id).all()
    
    result = []
    for assignee in assignees:
        exam = assignee.exam
        if not exam:
            continue
        
        result.append({
            "id": assignee.id,
            "exam_id": exam.id,
            "status": assignee.status,
            "score": assignee.score,
            "submitted_at": assignee.submitted_at,
            "exam_title": exam.title,
            "timer": exam.timer,
            "start_time": exam.start_time,
            "end_time": exam.end_time,
            "host_fullname": exam.host.fullname if exam.host else None,
            "quiz_subject": exam.quiz.subject if exam.quiz else None,
        })
    return result


@router.get("/{exam_id}", response_model=ExamAssignDetailResponse, summary="Get details of a specific assigned exam")
def get_exam_details(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get detailed information about an exam and its assignees.
    Only the host (owner) or SUPER_ADMIN can view this details.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found.",
        )
    if exam.host_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this exam.",
        )
    
    assignees = db.query(ExamAssignee).filter(ExamAssignee.exam_id == exam_id).all()
    
    return {
        "exam": exam,
        "assignees_count": len(assignees),
        "assignees": assignees
    }


@router.put("/{exam_id}", response_model=ExamResponse, summary="Update exam settings")
def update_exam(
    exam_id: int,
    body: ExamUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update configuration of an exam (e.g. deadline, duration, title, status).
    Only the host (owner) or SUPER_ADMIN can modify settings.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found.",
        )
    if exam.host_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this exam.",
        )

    update_data = body.model_dump(exclude_unset=True)
    
    # Check duplicate active exam if quiz, group or time are modified to identical setup
    if "end_time" in update_data or "start_time" in update_data:
        new_start = update_data.get("start_time", exam.start_time)
        new_end = update_data.get("end_time", exam.end_time)
        duplicate = db.query(Exam).filter(
            Exam.id != exam.id,
            Exam.quiz_id == exam.quiz_id,
            Exam.group_id == exam.group_id,
            Exam.start_time == new_start,
            Exam.end_time == new_end,
            Exam.status == "ACTIVE"
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An active exam with the exact same details and schedule already exists for this group.",
            )

    for field, value in update_data.items():
        setattr(exam, field, value)
        
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.delete("/{exam_id}", summary="Delete an assigned exam")
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete an assigned exam.
    Only the host (owner) or SUPER_ADMIN can delete it.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found.",
        )
    if exam.host_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this exam.",
        )
    db.delete(exam)
    db.commit()
    return {"message": "Exam assignment deleted successfully.", "exam_id": exam_id}


def _helper_submit_exam(db: Session, assignee: ExamAssignee) -> float:
    """
    Utility function to calculate score, save submission date, and mark status as COMPLETED.
    """
    exam = assignee.exam
    quiz = exam.quiz
    
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
    total_questions = len(questions)
    
    if total_questions == 0:
        assignee.status = "COMPLETED"
        assignee.score = 0.0
        assignee.submitted_at = datetime.utcnow()
        db.add(assignee)
        db.commit()
        return 0.0

    answers = db.query(ExamAnswer).filter(ExamAnswer.exam_assignee_id == assignee.id).all()
    answers_dict = {a.question_id: a for a in answers}

    correct_count = 0
    for q in questions:
        user_ans = answers_dict.get(q.id)
        if not user_ans:
            continue
            
        if q.type == "WRITTEN":
            pass
        else:
            if user_ans.selected_option_id:
                correct_option = db.query(QuestionOption).filter(
                    QuestionOption.id == user_ans.selected_option_id,
                    QuestionOption.question_id == q.id,
                    QuestionOption.is_correct == True
                ).first()
                if correct_option:
                    correct_count += 1

    score = (correct_count / total_questions) * 100.0

    assignee.status = "COMPLETED"
    assignee.score = round(score, 2)
    assignee.submitted_at = datetime.utcnow()
    
    db.add(assignee)
    db.commit()
    db.refresh(assignee)
    return assignee.score


@router.post("/{exam_id}/start", summary="Start taking an exam")
def start_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Start the assigned exam. Change status to IN_PROGRESS and log start time.
    Strictly: each user can only start once.
    """
    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == current_user.id
    ).first()
    
    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not assigned to this exam.",
        )
        
    exam = assignee.exam
    if not exam or exam.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This exam is not active.",
        )
        
    now = datetime.utcnow()
    if exam.end_time and now > exam.end_time:
        assignee.status = "COMPLETED"
        db.add(assignee)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The deadline for this exam has already passed.",
        )
        
    if assignee.status == "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already completed or abandoned this exam.",
        )
        
    if assignee.status == "IN_PROGRESS":
        from datetime import timedelta
        time_elapsed = now - assignee.started_at
        allowed_duration = timedelta(minutes=exam.timer)
        if time_elapsed > allowed_duration:
            score = _helper_submit_exam(db, assignee)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Time limit reached. Your exam has been auto-submitted with score: {score}%.",
            )
        return {"message": "Exam is already in progress. Continuing...", "started_at": assignee.started_at}
        
    assignee.status = "IN_PROGRESS"
    assignee.started_at = now
    db.add(assignee)
    db.commit()
    db.refresh(assignee)
    
    return {"message": "Exam started successfully.", "started_at": assignee.started_at}


@router.get("/{exam_id}/take", response_model=ExamTakeResponse, summary="Get exam questions for taking (excluding correct answers)")
def take_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get exam metadata and questions list. Hides is_correct for safety.
    Auto-submits if time limit has passed.
    """
    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == current_user.id
    ).first()
    
    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not assigned to this exam.",
        )
        
    exam = assignee.exam
    if not exam or exam.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This exam is not active.",
        )

    now = datetime.utcnow()
    from datetime import timedelta
    if exam.end_time and now > exam.end_time:
        if assignee.status != "COMPLETED":
            _helper_submit_exam(db, assignee)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The deadline for this exam has passed.",
        )

    if assignee.status == "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must start the exam first.",
        )
        
    if assignee.status == "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already completed or abandoned this exam.",
        )

    time_elapsed = now - assignee.started_at
    allowed_duration = timedelta(minutes=exam.timer)
    if time_elapsed > allowed_duration:
        score = _helper_submit_exam(db, assignee)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Time limit reached. Your exam has been auto-submitted with score: {score}%.",
        )

    remaining_seconds = int((allowed_duration - time_elapsed).total_seconds())

    quiz = exam.quiz
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).order_by(Question.id.asc()).all()

    formatted_questions = []
    for q in questions:
        options = db.query(QuestionOption).filter(QuestionOption.question_id == q.id).order_by(QuestionOption.id.asc()).all()
        formatted_options = []
        for idx, opt in enumerate(options):
            formatted_options.append({
                "id": opt.id,
                "option_text": opt.content or "",
                "order": idx + 1
            })
            
        formatted_questions.append({
            "id": q.id,
            "question_text": q.content or "",
            "question_type": q.type or "MULTIPLE_CHOICE",
            "order": len(formatted_questions) + 1,
            "points": q.time_limit or 1.0,
            "options": formatted_options
        })

    return {
        "exam": exam,
        "remaining_seconds": remaining_seconds,
        "questions": formatted_questions
    }


@router.post("/{exam_id}/answer", summary="Save user answer for a question")
def submit_answer(
    exam_id: int,
    body: ExamAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Save or update an answer for a specific question during the exam.
    Only allowed when status is IN_PROGRESS and within duration.
    """
    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == current_user.id
    ).first()
    
    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not assigned to this exam.",
        )
        
    exam = assignee.exam
    if not exam or exam.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This exam is not active.",
        )
        
    if assignee.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only submit answers while the exam is IN_PROGRESS.",
        )

    now = datetime.utcnow()
    from datetime import timedelta
    if exam.end_time and now > exam.end_time:
        _helper_submit_exam(db, assignee)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exam deadline has passed. Your exam has been auto-submitted.",
        )

    time_elapsed = now - assignee.started_at
    if time_elapsed > timedelta(minutes=exam.timer):
        _helper_submit_exam(db, assignee)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exam time limit reached. Your exam has been auto-submitted.",
        )

    question = db.query(Question).filter(Question.id == body.question_id, Question.quiz_id == exam.quiz_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID for this exam.",
        )

    answer = db.query(ExamAnswer).filter(
        ExamAnswer.exam_assignee_id == assignee.id,
        ExamAnswer.question_id == body.question_id
    ).first()

    if not answer:
        answer = ExamAnswer(
            exam_assignee_id=assignee.id,
            question_id=body.question_id,
            selected_option_id=body.selected_option_id,
            answer_text=body.answer_text
        )
        db.add(answer)
    else:
        answer.selected_option_id = body.selected_option_id
        answer.answer_text = body.answer_text
        db.add(answer)

    db.commit()
    return {"message": "Answer saved successfully."}


@router.post("/{exam_id}/submit", summary="Submit exam and calculate score")
def submit_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Explicitly submit the exam. Calculate final score and lock status.
    """
    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == current_user.id
    ).first()
    
    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not assigned to this exam.",
        )
        
    if assignee.status == "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted or abandoned this exam.",
        )
        
    if assignee.status == "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must start the exam first before submitting.",
        )

    score = _helper_submit_exam(db, assignee)
    return {"message": "Exam submitted successfully.", "score": f"{score}%"}


@router.post("/{exam_id}/abandon", summary="Abandon/exit the exam (marked as completed with current answers)")
def abandon_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Abandon the exam (exited, closed tab, or manually quit).
    Auto-submits with whatever answers already stored, and locks the exam from being taken again.
    """
    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == current_user.id
    ).first()
    
    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not assigned to this exam.",
        )
        
    if assignee.status == "COMPLETED":
        return {"message": "Exam was already completed.", "score": f"{assignee.score}%"}

    if assignee.status == "PENDING":
        assignee.status = "COMPLETED"
        assignee.score = 0.0
        assignee.submitted_at = datetime.utcnow()
        db.add(assignee)
        db.commit()
        return {"message": "Exam abandoned and locked.", "score": "0%"}

    score = _helper_submit_exam(db, assignee)
    return {"message": "Exam abandoned (exited). Locked from re-taking.", "score": f"{score}%"}

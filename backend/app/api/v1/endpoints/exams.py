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
    ExamFeedbackRequest,
    AnswerGradeRequest,
)
import logging
logger = logging.getLogger(__name__)

def _send_sync_ws_notification(user_id: int, title: str, content: str, action_url: str = None) -> None:
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
            loop = asyncio.get_event_loop()
        except RuntimeError:
            pass

        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(manager.send_personal_message(payload, user_id), loop)
        else:
            asyncio.run(manager.send_personal_message(payload, user_id))
    except Exception as e:
        logger.warning(f"Failed to push WS notification to user {user_id}: {e}")

def assign_active_exams_to_new_member(db: Session, group_id: int, user_id: int) -> None:
    """
    Find all active exams belonging to the given group_id,
    then automatically assign them to user_id (if not already assigned).
    """
    from sqlalchemy import func
    active_exams = db.query(Exam).filter(
        Exam.group_id == group_id,
        func.upper(Exam.status) == "ACTIVE"
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

            _send_sync_ws_notification(
                user_id=user_id,
                title="NEW EXAM ASSIGNED (NEW MEMBER)",
                content=f"You just joined the group and have an ongoing exam '{exam.title}'.",
                action_url=f"/exams/{exam.id}"
            )


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
        start_time=body.start_time if body.start_time else datetime.utcnow(),
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
                content=f"You have a new exam '{exam_title}' from the group '{group.name}'.",
                type="EXAM_ASSIGNED",
                action_url=f"/exams/{db_exam.id}",
            )
            db.add(notification)

            # Real-time WebSocket push event (Zero-latency notification)
            _send_sync_ws_notification(
                user_id=member.user_id,
                title="NEW EXAM ASSIGNED",
                content=f"You have a new exam '{exam_title}' from the group '{group.name}'.",
                action_url=f"/exams/{db_exam.id}"
            )

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
            "group_id": exam.group_id,
            "group_name": exam.group.name if exam.group else None,
            "quiz_subject": exam.quiz.subject if exam.quiz else None,
            "navigation_rule": exam.navigation_rule,
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
            "score": assignee.score if exam.results_published else None,
            "submitted_at": assignee.submitted_at,
            "exam_title": exam.title,
            "timer": exam.timer,
            "start_time": exam.start_time,
            "end_time": exam.end_time,
            "host_fullname": exam.host.fullname if exam.host else None,
            "quiz_subject": exam.quiz.subject if exam.quiz else None,
            "navigation_rule": exam.navigation_rule,
            "results_published": exam.results_published,
        })
    return result


@router.get("/{exam_id}/my-result", summary="Get current user's own exam result with questions, answers, and host feedback")
def get_my_exam_result(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Return the logged-in student's detailed result for a specific exam:
    - Exam metadata (title, host, score, submitted_at, feedback_comment)
    - Full question list with the student's selected answers and correctness
    Must be declared BEFORE /{exam_id} to avoid FastAPI routing conflicts.
    """
    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == current_user.id,
    ).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Exam result not found")

    exam = assignee.exam
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Block access if the host has not published results yet
    if not exam.results_published:
        raise HTTPException(
            status_code=403,
            detail="Results have not been published yet. Please wait for the host to release them.",
        )

    quiz = exam.quiz
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).order_by(Question.id.asc()).all()
    answers = db.query(ExamAnswer).filter(ExamAnswer.exam_assignee_id == assignee.id).all()
    answers_dict = {a.question_id: a for a in answers}

    formatted_questions = []
    correct_count = 0
    for q in questions:
        options = db.query(QuestionOption).filter(QuestionOption.question_id == q.id).order_by(QuestionOption.id.asc()).all()
        user_ans = answers_dict.get(q.id)

        formatted_options = [
            {"id": opt.id, "content": opt.content or "", "is_correct": opt.is_correct}
            for opt in options
        ]

        is_correct = user_ans.is_correct if user_ans else False
        if is_correct:
            correct_count += 1

        formatted_questions.append({
            "id": q.id,
            "content": q.content or "Untitled Question",
            "type": q.type or "MULTIPLE_CHOICE",
            "options": formatted_options,
            "user_answer": {
                "selected_option_id": user_ans.selected_option_id if user_ans else None,
                "answer_text": user_ans.answer_text if user_ans else None,
                "is_correct": is_correct,
                "answer_score": user_ans.score if user_ans else None,
            } if user_ans else None,
        })

    return {
        "exam_id": exam.id,
        "exam_title": exam.title,
        "host_fullname": exam.host.fullname if exam.host else None,
        "quiz_subject": quiz.subject if quiz else None,
        "status": assignee.status,
        "score": assignee.score,
        "started_at": assignee.started_at,
        "submitted_at": assignee.submitted_at,
        "feedback_comment": assignee.feedback_comment,
        "correct_count": correct_count,
        "total_questions": len(questions),
        "questions": formatted_questions,
    }


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
    
    # Check if Quiz or Group is being modified
    quiz_id_changed = "quiz_id" in update_data and update_data["quiz_id"] != exam.quiz_id
    group_id_changed = "group_id" in update_data and update_data["group_id"] != exam.group_id
    
    if quiz_id_changed or group_id_changed:
        # Check if any student has started or completed the exam
        started_assignee = db.query(ExamAssignee).filter(
            ExamAssignee.exam_id == exam.id,
            ExamAssignee.status.in_(["IN_PROGRESS", "COMPLETED", "SUBMITTED"])
        ).first()
        
        if started_assignee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify Quiz or Group because some students have already started or submitted the exam."
            )
            
        # Perform the updates
        if quiz_id_changed:
            exam.quiz_id = update_data["quiz_id"]
            del update_data["quiz_id"]
        
        if group_id_changed:
            new_group_id = update_data["group_id"]
            # Validate new group
            new_group = db.query(Group).filter(Group.id == new_group_id).first()
            if not new_group:
                raise HTTPException(status_code=404, detail="New Study Group not found.")
            
            # 1. Delete all existing assignees and notifications for this exam
            db.query(ExamAssignee).filter(ExamAssignee.exam_id == exam.id).delete()
            db.query(Notification).filter(
                Notification.target_type == "PERSONAL",
                Notification.target_group_id == exam.group_id,
                Notification.type == "EXAM_ASSIGNED",
                Notification.sender_id == current_user.id
            ).delete()
            
            # 2. Update group_id
            exam.group_id = new_group_id
            del update_data["group_id"]
            
            # 3. Create new ExamAssignee and Notification for each approved member in the new group
            new_members = db.query(GroupMember).filter(
                GroupMember.group_id == new_group_id,
                GroupMember.status == "APPROVED"
            ).all()
            
            for member in new_members:
                assignee = ExamAssignee(
                    exam_id=exam.id,
                    user_id=member.user_id,
                    status="PENDING",
                )
                db.add(assignee)
                
                # Create notification for new member
                notification = Notification(
                    user_id=member.user_id,
                    sender_id=current_user.id,
                    target_type="PERSONAL",
                    target_group_id=new_group_id,
                    title="NEW EXAM ASSIGNED (GROUP UPDATED)",
                    content=f"You have a new exam '{exam.title}' assigned to your group '{new_group.name}'.",
                    type="EXAM_ASSIGNED",
                    action_url=f"/exams/{exam.id}",
                )
                db.add(notification)
                _send_sync_ws_notification(
                    user_id=member.user_id,
                    title="NEW EXAM ASSIGNED (GROUP UPDATED)",
                    content=f"You have a new exam '{exam.title}' assigned to your group '{new_group.name}'.",
                    action_url=f"/exams/{exam.id}"
                )
    
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
            
        q_type = (q.type or "").strip().lower()
        if q_type in ["essay", "written"]:
            user_ans.is_correct = False
            db.add(user_ans)
        elif q_type in ["short_answer", "short answer", "short", "fill in the blank", "fill_in_the_blank"]:
            # Evaluate short answer / fill in the blank answers case-insensitively
            user_val = (user_ans.answer_text or "").strip().lower()
            correct_opts = db.query(QuestionOption).filter(
                QuestionOption.question_id == q.id,
                QuestionOption.is_correct == True
            ).all()
            
            is_match = False
            for opt in correct_opts:
                opt_val = (opt.content or "").strip().lower()
                if user_val == opt_val:
                    is_match = True
                    break
            
            if is_match:
                correct_count += 1
                user_ans.is_correct = True
            else:
                user_ans.is_correct = False
            db.add(user_ans)
        else:
            if user_ans.selected_option_id:
                correct_option = db.query(QuestionOption).filter(
                    QuestionOption.id == user_ans.selected_option_id,
                    QuestionOption.question_id == q.id,
                    QuestionOption.is_correct == True
                ).first()
                if correct_option:
                    correct_count += 1
                    user_ans.is_correct = True
                else:
                    user_ans.is_correct = False
            else:
                user_ans.is_correct = False
            db.add(user_ans)

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

    # Check correctness based on question type
    is_correct = False
    q_type = (question.type or "").strip().lower()
    if q_type in ["essay", "written"]:
        is_correct = False
    elif q_type in ["short_answer", "short answer", "short", "fill in the blank", "fill_in_the_blank"]:
        user_val = (body.answer_text or "").strip().lower()
        correct_opts = db.query(QuestionOption).filter(
            QuestionOption.question_id == question.id,
            QuestionOption.is_correct == True
        ).all()
        for opt in correct_opts:
            if user_val == (opt.content or "").strip().lower():
                is_correct = True
                break
    else:
        if body.selected_option_id:
            correct_opt = db.query(QuestionOption).filter(
                QuestionOption.id == body.selected_option_id,
                QuestionOption.question_id == body.question_id,
                QuestionOption.is_correct == True
            ).first()
            if correct_opt:
                is_correct = True

    if not answer:
        answer = ExamAnswer(
            exam_assignee_id=assignee.id,
            question_id=body.question_id,
            selected_option_id=body.selected_option_id,
            answer_text=body.answer_text,
            is_correct=is_correct
        )
        db.add(answer)
    else:
        answer.selected_option_id = body.selected_option_id
        answer.answer_text = body.answer_text
        answer.is_correct = is_correct
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


@router.get("/{exam_id}/missed-questions", summary="Get most missed questions in this exam")
def get_most_missed_questions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get questions that were most frequently answered incorrectly in this exam.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.host_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Permission denied")

    from app.models.quiz import Question, QuestionOption
    from app.models.exam import ExamAssignee, ExamAnswer
    from sqlalchemy import func
    
    questions = db.query(Question).filter(Question.quiz_id == exam.quiz_id).all()
    
    assignee_ids = [a.id for a in db.query(ExamAssignee.id).filter(ExamAssignee.exam_id == exam_id).all()]
    if not assignee_ids:
        return []
        
    total_participants = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.status.in_(["SUBMITTED", "COMPLETED"])
    ).count()
    
    if total_participants == 0:
        total_participants = db.query(ExamAssignee).filter(
            ExamAssignee.exam_id == exam_id
        ).count()
        
    if total_participants == 0:
        return []

    result = []
    
    for q in questions:
        # Count participants who answered this question CORRECTLY
        correct_count = db.query(func.count(ExamAnswer.id)).filter(
            ExamAnswer.exam_assignee_id.in_(assignee_ids),
            ExamAnswer.question_id == q.id,
            ExamAnswer.is_correct == True
        ).scalar() or 0

        # Unanswered / skipped / incorrect questions are all counted as missed
        wrong_count = total_participants - correct_count
        if wrong_count <= 0:
            continue

        wrong_percentage = int((wrong_count / total_participants) * 100)

        common_wrong_opt = db.query(
            ExamAnswer.selected_option_id,
            func.count(ExamAnswer.id).label("cnt")
        ).filter(
            ExamAnswer.exam_assignee_id.in_(assignee_ids),
            ExamAnswer.question_id == q.id,
            ExamAnswer.is_correct == False,
            ExamAnswer.selected_option_id.isnot(None)
        ).group_by(ExamAnswer.selected_option_id).order_by(func.count(ExamAnswer.id).desc()).first()

        common_wrong_text = "Skipped / Unanswered"
        if common_wrong_opt:
            opt_id = common_wrong_opt[0]
            opt = db.query(QuestionOption).filter(QuestionOption.id == opt_id).first()
            if opt:
                common_wrong_text = opt.content or "Skipped / Unanswered"
        else:
            common_wrong_text_opt = db.query(
                ExamAnswer.answer_text,
                func.count(ExamAnswer.id).label("cnt")
            ).filter(
                ExamAnswer.exam_assignee_id.in_(assignee_ids),
                ExamAnswer.question_id == q.id,
                ExamAnswer.is_correct == False,
                ExamAnswer.answer_text.isnot(None)
            ).group_by(ExamAnswer.answer_text).order_by(func.count(ExamAnswer.id).desc()).first()
            if common_wrong_text_opt and common_wrong_text_opt[0]:
                common_wrong_text = common_wrong_text_opt[0]

        correct_opts = db.query(QuestionOption).filter(
            QuestionOption.question_id == q.id,
            QuestionOption.is_correct == True
        ).all()
        correct_text = ", ".join([o.content for o in correct_opts]) if correct_opts else "N/A"

        result.append({
            "id": q.id,
            "question": q.content or "Untitled Question",
            "wrongCount": wrong_count,
            "totalCount": total_participants,
            "wrongPercentage": wrong_percentage,
            "commonWrongAnswer": common_wrong_text,
            "correctAnswer": correct_text
        })
        
    result.sort(key=lambda x: x["wrongPercentage"], reverse=True)
    return result


@router.post("/{exam_id}/submissions/{user_id}/reset", summary="Reset a student's exam attempt")
def reset_student_exam_attempt(
    exam_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Clear all stored answers and reset progress for a student's exam, allowing them to retake it.
    Only the host of the exam or SUPER_ADMIN is authorized.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if exam.host_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Permission denied")
        
    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == user_id
    ).first()
    
    if not assignee:
        raise HTTPException(status_code=404, detail="Student submission not found for this exam")
        
    # 1. Delete all answers for this assignee
    db.query(ExamAnswer).filter(ExamAnswer.exam_assignee_id == assignee.id).delete()
    
    # 2. Reset assignee fields to default PENDING state
    assignee.status = "PENDING"
    assignee.score = None
    assignee.started_at = None
    assignee.submitted_at = None
    assignee.feedback_comment = None
    
    db.add(assignee)
    db.commit()
    
    return {"message": "Student exam attempt reset successfully. The student can now retake the exam."}


@router.get("/{exam_id}/submissions/{user_id}", summary="Get detailed student submission details (questions, answers, points, and correctness)")
def get_student_submission_details(
    exam_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get detailed view of a student's submission (quiz questions, student answers, option choices, correctness, and feedback).
    Only the host (owner) or SUPER_ADMIN can view this.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.host_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Permission denied")

    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == user_id
    ).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Student submission not found")

    quiz = exam.quiz
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).order_by(Question.id.asc()).all()
    answers = db.query(ExamAnswer).filter(ExamAnswer.exam_assignee_id == assignee.id).all()
    answers_dict = {a.question_id: a for a in answers}

    formatted_questions = []
    for q in questions:
        options = db.query(QuestionOption).filter(QuestionOption.question_id == q.id).order_by(QuestionOption.id.asc()).all()
        formatted_options = []
        for opt in options:
            formatted_options.append({
                "id": opt.id,
                "content": opt.content or "",
                "is_correct": opt.is_correct
            })

        user_ans = answers_dict.get(q.id)
        formatted_questions.append({
            "id": q.id,
            "content": q.content or "Untitled Question",
            "type": q.type or "MULTIPLE_CHOICE",
            "difficulty": q.difficulty or "Beginner",
            "time_limit": q.time_limit,
            "options": formatted_options,
            "user_answer": {
                "selected_option_id": user_ans.selected_option_id if user_ans else None,
                "answer_text": user_ans.answer_text if user_ans else None,
                "is_correct": user_ans.is_correct if user_ans else False
            } if user_ans else None
        })

    student_user = db.query(User).filter(User.id == user_id).first()

    return {
        "student": {
            "id": user_id,
            "fullname": student_user.fullname if student_user else f"User {user_id}",
            "email": student_user.email if student_user else "N/A"
        },
        "status": assignee.status,
        "score": assignee.score,
        "started_at": assignee.started_at,
        "submitted_at": assignee.submitted_at,
        "feedback_comment": assignee.feedback_comment,
        "questions": formatted_questions
    }


@router.put("/{exam_id}/submissions/{user_id}/feedback", summary="Save host feedback and grade for a student submission")
def save_student_submission_feedback(
    exam_id: int,
    user_id: int,
    body: ExamFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update the score and leave feedback comments for a student's submission.
    Only the host (owner) or SUPER_ADMIN is authorized.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.host_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Permission denied")

    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == user_id
    ).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Student submission not found")

    if body.feedback_comment is not None:
        assignee.feedback_comment = body.feedback_comment
    if body.score is not None:
        assignee.score = body.score

    db.add(assignee)
    db.commit()
    db.refresh(assignee)

    # Send Notification to the student
    notification = Notification(
        user_id=user_id,
        sender_id=current_user.id,
        target_type="PERSONAL",
        target_group_id=exam.group_id,
        title="EXAM GRADED & FEEDBACK RECEIVED",
        content=f"Your submission for exam '{exam.title}' has been graded. Score: {assignee.score}%. Check host feedback.",
        type="FEEDBACK",
        action_url=f"/exams/results",
    )
    db.add(notification)
    db.commit()

    # Real-time WebSocket push event (Zero-latency notification for feedback)
    _send_sync_ws_notification(
        user_id=user_id,
        title="EXAM GRADED & FEEDBACK RECEIVED",
        content=f"Your submission for exam '{exam.title}' has been graded. Score: {assignee.score}%. Check host feedback.",
        action_url=f"/exams/results"
    )

    return {
        "message": "Feedback saved successfully and student notified.",
        "score": assignee.score,
        "feedback_comment": assignee.feedback_comment
    }


@router.put(
    "/{exam_id}/submissions/{user_id}/answers/{question_id}/grade",
    summary="Grade a single question answer (set correct/incorrect and optional partial score)"
)
def grade_single_answer(
    exam_id: int,
    user_id: int,
    question_id: int,
    body: AnswerGradeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Allow host to override is_correct and assign a partial score for an individual
    question answer. After saving, recalculates the overall submission score from
    all answered questions.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.host_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Permission denied")

    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == user_id,
    ).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Student submission not found")

    answer = db.query(ExamAnswer).filter(
        ExamAnswer.exam_assignee_id == assignee.id,
        ExamAnswer.question_id == question_id,
    ).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found for this question")

    # Update answer correctness and optional partial score
    answer.is_correct = body.is_correct
    if body.score is not None:
        answer.score = body.score
    elif body.is_correct and answer.score is None:
        # Auto-set 1.0 point if no score provided and marking correct
        answer.score = 1.0
    elif not body.is_correct:
        answer.score = 0.0

    db.add(answer)
    db.flush()

    # Recalculate total score for this assignee from all answers
    all_answers = db.query(ExamAnswer).filter(
        ExamAnswer.exam_assignee_id == assignee.id
    ).all()

    total_questions = db.query(Question).filter(
        Question.quiz_id == exam.quiz_id
    ).count()

    if total_questions > 0:
        def effective_score(a: ExamAnswer) -> float:
            """
            Use the explicit per-answer score when available.
            Fall back to 1.0 if the answer is marked correct but score column
            is still NULL (happens for answers auto-graded via is_correct only).
            """
            if a.score is not None:
                return float(a.score)
            if a.is_correct is True:
                return 1.0
            return 0.0

        earned = sum(effective_score(a) for a in all_answers)
        max_possible = float(total_questions)
        assignee.score = round((earned / max_possible) * 100, 2)
    
    db.add(assignee)
    db.commit()
    db.refresh(answer)

    return {
        "question_id": question_id,
        "is_correct": answer.is_correct,
        "answer_score": answer.score,
        "overall_score": assignee.score,
    }



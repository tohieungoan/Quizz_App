from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from datetime import datetime

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.quiz import Quiz, Question, QuestionOption
from app.models.group import Group, GroupMember
from app.models.exam import Exam, ExamAssignee, ExamAnswer
from app.models.quiz_variant import QuizVariantOption, QuizVariantQuestion, QuizVariantSet
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
from app.services.user_notification_service import user_notification_service
from app.services.quiz_variant_service import QuizVariantNotReadyError, quiz_variant_service

logger = logging.getLogger(__name__)

def _send_sync_ws_notification(user_id: int, title: str, content: str, action_url: str | None = None) -> None:
    """
    Safely dispatch a WebSocket notification from a synchronous thread worker in FastAPI.
    """
    try:
        import asyncio
        from app.api.v1.websockets.notification_manager import notification_manager
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
            asyncio.run_coroutine_threadsafe(notification_manager.send_personal_message(payload, user_id), loop)
        else:
            try:
                asyncio.run(notification_manager.send_personal_message(payload, user_id))
            except Exception as inner_e:
                logger.warning(f"Could not run async WS dispatch: {inner_e}")
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
        # Do not assign exams to the host/creator of the exam
        if exam.host_id == user_id:
            continue

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

            from app.services.user_notification_service import user_notification_service

            user_notification_service.send_notification(
                db=db,
                user_id=user_id,
                sender_id=exam.host_id,
                target_group_id=group_id,
                title="NEW EXAM ASSIGNED (NEW MEMBER)",
                content=f"You just joined the group and have an ongoing exam '{exam.title}' that must be completed before {exam.end_time.strftime('%Y-%m-%d %H:%M')}.",
                type="QUIZ_ASSIGNED",
                action_url=f"/exams/{exam.id}",
            )


router = APIRouter()


def _assign_exam_versions(db: Session, exam: Exam) -> None:
    """Assign every unassigned candidate to a stable, balanced paper."""
    if not exam.variant_set_id:
        return
    variant_set = db.query(QuizVariantSet).filter(
        QuizVariantSet.id == exam.variant_set_id
    ).first()
    if not variant_set:
        raise QuizVariantNotReadyError("The exam's quiz version set no longer exists.")
    if variant_set.status != "READY":
        raise QuizVariantNotReadyError(
            "Quiz versions are not ready for delivery. Fix or regenerate them before starting the exam."
        )
    assignees = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam.id
    ).with_for_update().all()
    quiz_variant_service.assign_balanced(
        assignees,
        quiz_variant_service.ready_variants(variant_set),
    )
    db.flush()


def _serialize_submission_questions(db: Session, assignee: ExamAssignee) -> list[dict[str, Any]]:
    """Return the exact immutable paper seen by one candidate."""
    answers = db.query(ExamAnswer).filter(
        ExamAnswer.exam_assignee_id == assignee.id
    ).all()
    answers_by_question = {answer.question_id: answer for answer in answers}
    answers_by_variant_question = {
        answer.variant_question_id: answer
        for answer in answers
        if answer.variant_question_id is not None
    }

    if assignee.quiz_variant_id:
        variant_questions = db.query(QuizVariantQuestion).options(
            selectinload(QuizVariantQuestion.options)
        ).filter(
            QuizVariantQuestion.quiz_variant_id == assignee.quiz_variant_id
        ).order_by(
            QuizVariantQuestion.position.asc(),
            QuizVariantQuestion.id.asc(),
        ).all()

        result = []
        for question in variant_questions:
            answer = answers_by_variant_question.get(question.id)
            if answer is None and question.original_question_id is not None:
                answer = answers_by_question.get(question.original_question_id)
            result.append({
                "id": question.original_question_id,
                "variant_question_id": question.id,
                "version_code": assignee.quiz_variant.version_code,
                "content": question.content or "Untitled Question",
                "type": question.type or "MULTIPLE_CHOICE",
                "difficulty": question.difficulty or "Beginner",
                "time_limit": question.time_limit,
                "media_url": question.media_url,
                "audio_url": question.audio_url,
                "options": [
                    {
                        "id": option.id,
                        "variant_option_id": option.id,
                        "original_option_id": option.original_option_id,
                        "content": option.content or "",
                        "is_correct": option.is_correct,
                    }
                    for option in question.options
                ],
                "user_answer": {
                    "selected_option_id": answer.variant_option_id,
                    "variant_option_id": answer.variant_option_id,
                    "answer_text": answer.answer_text,
                    "is_correct": bool(answer.is_correct),
                    "answer_score": answer.score,
                } if answer else None,
            })
        return result

    quiz_id = assignee.exam.quiz_id
    questions = db.query(Question).options(
        selectinload(Question.options)
    ).filter(
        Question.quiz_id == quiz_id
    ).order_by(Question.position.asc(), Question.id.asc()).all()

    return [
        {
            "id": question.id,
            "variant_question_id": None,
            "version_code": None,
            "content": question.content or "Untitled Question",
            "type": question.type or "MULTIPLE_CHOICE",
            "difficulty": question.difficulty or "Beginner",
            "time_limit": question.time_limit,
            "media_url": question.media_url,
            "audio_url": question.audio_url,
            "options": [
                {
                    "id": option.id,
                    "variant_option_id": None,
                    "original_option_id": option.id,
                    "content": option.content or "",
                    "is_correct": option.is_correct,
                }
                for option in question.options
            ],
            "user_answer": {
                "selected_option_id": answers_by_question[question.id].selected_option_id,
                "variant_option_id": None,
                "answer_text": answers_by_question[question.id].answer_text,
                "is_correct": bool(answers_by_question[question.id].is_correct),
                "answer_score": answers_by_question[question.id].score,
            } if question.id in answers_by_question else None,
        }
        for question in questions
    ]

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
    # Serialize exam assignment with quiz authoring. Authoring uses the same
    # row lock before checking active exams, preventing a check-then-insert race.
    quiz = db.query(Quiz).filter(Quiz.id == body.quiz_id).with_for_update().first()
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
    if (quiz.status or "").strip().lower() != "published":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only a published quiz can be assigned as an exam.",
        )
    should_use_variants = bool(body.use_ai_question or getattr(quiz, "variant_enabled", False))
    variant_set_id = None
    if should_use_variants:
        target_set_id = quiz.active_variant_set_id
        variant_set = None
        if target_set_id:
            variant_set = db.query(QuizVariantSet).filter(
                QuizVariantSet.id == target_set_id,
                QuizVariantSet.quiz_id == quiz.id,
            ).first()
        if not variant_set:
            variant_set = db.query(QuizVariantSet).filter(
                QuizVariantSet.quiz_id == quiz.id,
                QuizVariantSet.status == "READY",
            ).order_by(QuizVariantSet.id.desc()).first()

        if variant_set and variant_set.status == "READY":
            variant_set_id = variant_set.id
        elif getattr(quiz, "variant_enabled", False):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Quiz versions must be valid and published before assigning the exam.",
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
        use_ai_question=bool(body.use_ai_question),
        variant_set_id=variant_set_id,
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
        # Skip sending assignment notification to the Host who created the exam
        if member.user_id == current_user.id:
            continue

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

            user_notification_service.send_notification(
                db=db,
                user_id=member.user_id,
                sender_id=current_user.id,
                target_group_id=group.id,
                title="NEW EXAM ASSIGNED",
                content=f"You have a new exam '{exam_title}' from the group '{group.name}'.",
                type="QUIZ_ASSIGNED",
                action_url=f"/exams/{db_exam.id}",
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
    exams = db.query(Exam).filter(Exam.host_id == current_user.id).order_by(Exam.created_at.desc(), Exam.id.desc()).all()
    
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
            "use_ai_question": getattr(exam, "use_ai_question", False),
            "total_assignees": total_assignees,
            "submitted_count": submitted_count,
            "created_at": exam.created_at,
            "group_id": exam.group_id,
            "group_name": exam.group.name if exam.group else None,
            "quiz_subject": exam.quiz.subject if exam.quiz else None,
            "navigation_rule": exam.navigation_rule,
            "variant_set_id": exam.variant_set_id,
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
    assignees = (
        db.query(ExamAssignee)
        .join(Exam, ExamAssignee.exam_id == Exam.id)
        .filter(
            ExamAssignee.user_id == current_user.id,
            Exam.host_id != current_user.id
        )
        .order_by(Exam.created_at.desc(), ExamAssignee.id.desc())
        .all()
    )
    
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
            "group_name": exam.group.name if exam.group else "Individual / General",
            "navigation_rule": exam.navigation_rule,
            "results_published": exam.results_published,
            "use_ai_question": getattr(exam, "use_ai_question", False),
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
    formatted_questions = _serialize_submission_questions(db, assignee)
    correct_count = sum(
        1
        for question in formatted_questions
        if question["user_answer"] and question["user_answer"]["is_correct"]
    )

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
        "total_questions": len(formatted_questions),
        "version_code": assignee.quiz_variant.version_code if assignee.quiz_variant else None,
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
    exam = db.query(Exam).filter(Exam.id == exam_id).with_for_update().first()
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

    target_quiz_id = update_data.get("quiz_id", exam.quiz_id)
    target_quiz = exam.quiz
    resulting_status = str(update_data.get("status", exam.status) or "").strip().upper()
    quiz_id_changed = target_quiz_id != exam.quiz_id
    if quiz_id_changed or resulting_status == "ACTIVE":
        target_quiz = db.query(Quiz).filter(Quiz.id == target_quiz_id).with_for_update().first()
        if not target_quiz:
            raise HTTPException(status_code=404, detail="Quiz not found.")
        if target_quiz.user_id != current_user.id and current_user.role != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to assign this quiz.",
            )
        if (target_quiz.status or "").strip().lower() != "published":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An active exam must use a published quiz.",
            )
    
    # Check if Quiz or Group is being modified
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
        if quiz_id_changed or "use_ai_question" in update_data:
            new_use_ai = update_data.get("use_ai_question", getattr(exam, "use_ai_question", False))
            should_use_variants = bool(new_use_ai or getattr(target_quiz, "variant_enabled", False))
            if should_use_variants:
                target_set_id = target_quiz.active_variant_set_id
                variant_set = None
                if target_set_id:
                    variant_set = db.query(QuizVariantSet).filter(
                        QuizVariantSet.id == target_set_id,
                        QuizVariantSet.quiz_id == target_quiz.id,
                    ).first()
                if not variant_set:
                    variant_set = db.query(QuizVariantSet).filter(
                        QuizVariantSet.quiz_id == target_quiz.id,
                        QuizVariantSet.status == "READY",
                    ).order_by(QuizVariantSet.id.desc()).first()
                exam.variant_set_id = variant_set.id if (variant_set and variant_set.status == "READY") else None
            else:
                exam.variant_set_id = None

        if quiz_id_changed:
            exam.quiz_id = update_data["quiz_id"]
            db.query(ExamAssignee).filter(
                ExamAssignee.exam_id == exam.id
            ).update({ExamAssignee.quiz_variant_id: None}, synchronize_session=False)
            del update_data["quiz_id"]
        
        if group_id_changed:
            new_group_id = update_data["group_id"]
            # Validate new group
            new_group = db.query(Group).filter(Group.id == new_group_id).first()
            if not new_group:
                raise HTTPException(status_code=404, detail="New Study Group not found.")
            if new_group.owner_id != current_user.id and current_user.role != "SUPER_ADMIN":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to assign exams to this group.",
                )
            
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
                if member.user_id == current_user.id:
                    continue

                assignee = ExamAssignee(
                    exam_id=exam.id,
                    user_id=member.user_id,
                    status="PENDING",
                )
                db.add(assignee)
                
                user_notification_service.send_notification(
                    db=db,
                    user_id=member.user_id,
                    sender_id=current_user.id,
                    target_group_id=new_group_id,
                    title="NEW EXAM ASSIGNED (GROUP UPDATED)",
                    content=f"You have a new exam '{exam.title}' assigned to your group '{new_group.name}'.",
                    type="QUIZ_ASSIGNED",
                    action_url=f"/exams/{exam.id}",
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

    was_published = bool(exam.results_published)
    is_now_publishing = "results_published" in update_data and bool(update_data["results_published"]) and not was_published

    for field, value in update_data.items():
        setattr(exam, field, value)
        
    db.add(exam)
    db.commit()
    db.refresh(exam)

    if is_now_publishing:
        assignees = db.query(ExamAssignee).filter(ExamAssignee.exam_id == exam.id).all()
        for assignee in assignees:
            user_pref = getattr(assignee.user, "notify_results_published", True) if assignee.user else True
            if user_pref is not False:
                notification = Notification(
                    user_id=assignee.user_id,
                    sender_id=current_user.id,
                    target_type="PERSONAL",
                    target_group_id=exam.group_id,
                    title="RESULTS PUBLISHED",
                    content=f"Results for your exam '{exam.title}' have been published by the host. You can now view your score and detailed results.",
                    type="RESULTS_PUBLISHED",
                    action_url="/dashboard",
                )
                db.add(notification)
                _send_sync_ws_notification(
                    user_id=assignee.user_id,
                    title="RESULTS PUBLISHED",
                    content=f"Results for your exam '{exam.title}' have been published by the host. You can now view your score and detailed results.",
                    action_url="/dashboard"
                )
        db.commit()

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
    exam_title = (exam.quiz.title if exam.quiz else f"Exam #{exam.id}")
    exam_id_val = exam.id
    db.delete(exam)
    db.commit()

    # Trigger admin notification for critical data deletion
    try:
        from app.services.admin_notification_service import admin_notification_service
        admin_notification_service.notify_critical_data_deletion(
            db, item_type="Assigned Exam", item_title=exam_title, item_id=exam_id_val, deleted_by=current_user
        )
    except Exception:
        pass

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
        if user_ans.variant_question_id:
            variant_question = db.query(QuizVariantQuestion).filter(
                QuizVariantQuestion.id == user_ans.variant_question_id,
                QuizVariantQuestion.original_question_id == q.id,
                QuizVariantQuestion.quiz_variant_id == assignee.quiz_variant_id,
            ).first()
            if not variant_question:
                user_ans.is_correct = False
            elif q_type in ["short_answer", "short answer", "short", "fill in the blank", "fill_in_the_blank"]:
                normalized_answer = (user_ans.answer_text or "").strip().casefold()
                user_ans.is_correct = any(
                    option.is_correct and normalized_answer == (option.content or "").strip().casefold()
                    for option in variant_question.options
                )
            else:
                user_ans.is_correct = bool(
                    user_ans.variant_option_id
                    and db.query(QuizVariantOption.id).filter(
                        QuizVariantOption.id == user_ans.variant_option_id,
                        QuizVariantOption.variant_question_id == variant_question.id,
                        QuizVariantOption.is_correct == True,
                    ).first()
                )
            if user_ans.is_correct:
                correct_count += 1
            db.add(user_ans)
            continue
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

    if assignee.user:
        from app.crud.crud_user import crud_user
        earned_pts = 50 + int(assignee.score or 0)
        crud_user.add_achievement_points(db, assignee.user, earned_pts)

    return assignee.score if assignee.score is not None else 0.0


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
    # 1. Fetch exam details first
    exam = db.query(Exam).filter(Exam.id == exam_id).with_for_update().first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found.",
        )

    # 2. Check assignee record or auto-create if user is a member of the target group
    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == current_user.id
    ).first()
    
    if not assignee and exam.group_id:
        group_member = db.query(GroupMember).filter(
            GroupMember.group_id == exam.group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "APPROVED",
        ).first()
        if group_member:
            assignee = ExamAssignee(
                exam_id=exam_id,
                user_id=current_user.id,
                status="PENDING",
            )
            db.add(assignee)
            db.flush()
            db.refresh(assignee)

    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not assigned to this exam.",
        )
        
    if exam.status and exam.status.upper() in ["CLOSED", "ARCHIVED", "INACTIVE", "DRAFT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This exam is currently not active or has been closed by the host.",
        )
        
    now = datetime.utcnow()
    from datetime import timedelta
    is_valid_deadline = exam.end_time and (exam.start_time is None or exam.end_time > (exam.start_time + timedelta(seconds=60)))
    if is_valid_deadline and now > exam.end_time:
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
        time_elapsed = now - assignee.started_at
        allowed_duration = timedelta(minutes=exam.timer or 60)
        if time_elapsed > allowed_duration:
            score = _helper_submit_exam(db, assignee)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Time limit reached. Your exam has been auto-submitted with score: {score}%.",
            )
        return {"message": "Exam is already in progress. Continuing...", "started_at": assignee.started_at}

    try:
        _assign_exam_versions(db, exam)
    except QuizVariantNotReadyError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    db.refresh(assignee)
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
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found.",
        )

    assignee = db.query(ExamAssignee).filter(
        ExamAssignee.exam_id == exam_id,
        ExamAssignee.user_id == current_user.id
    ).first()
    
    if not assignee and exam.group_id:
        group_member = db.query(GroupMember).filter(
            GroupMember.group_id == exam.group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "APPROVED",
        ).first()
        if group_member:
            assignee = ExamAssignee(
                exam_id=exam_id,
                user_id=current_user.id,
                status="PENDING",
            )
            db.add(assignee)
            db.commit()
            db.refresh(assignee)

    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not assigned to this exam.",
        )
        
    if exam.status and exam.status.upper() in ["CLOSED", "ARCHIVED", "INACTIVE", "DRAFT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This exam is currently not active or has been closed by the host.",
        )

    now = datetime.utcnow()
    from datetime import timedelta
    is_valid_deadline = exam.end_time and (exam.start_time is None or exam.end_time > (exam.start_time + timedelta(seconds=60)))
    if is_valid_deadline and now > exam.end_time:
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

    existing_answers = db.query(ExamAnswer).filter(ExamAnswer.exam_assignee_id == assignee.id).all()
    user_answer_map = {ans.question_id: ans for ans in existing_answers}

    formatted_questions = []
    if assignee.quiz_variant_id:
        variant_questions = db.query(QuizVariantQuestion).options(
            selectinload(QuizVariantQuestion.options)
        ).filter(
            QuizVariantQuestion.quiz_variant_id == assignee.quiz_variant_id
        ).order_by(QuizVariantQuestion.position.asc(), QuizVariantQuestion.id.asc()).all()
        for variant_question in variant_questions:
            original_question_id = variant_question.original_question_id
            if original_question_id is None:
                continue
            user_ans = user_answer_map.get(original_question_id)
            formatted_questions.append({
                "id": original_question_id,
                "variant_question_id": variant_question.id,
                "version_code": assignee.quiz_variant.version_code if assignee.quiz_variant else None,
                "question_text": variant_question.content,
                "question_type": variant_question.type or "MULTIPLE_CHOICE",
                "order": len(formatted_questions) + 1,
                "points": variant_question.time_limit or 1.0,
                "media_url": variant_question.media_url,
                "audio_url": variant_question.audio_url,
                "audio_play_limit": variant_question.audio_play_limit,
                "user_answer": {
                    "selected_option_id": user_ans.variant_option_id,
                    "answer_text": user_ans.answer_text,
                } if user_ans else None,
                "options": [
                    {
                        "id": option.id,
                        "variant_option_id": option.id,
                        "option_text": option.content,
                        "order": index + 1,
                        "media_url": option.media_url,
                        "audio_url": option.audio_url,
                    }
                    for index, option in enumerate(variant_question.options)
                ],
            })
        return {
            "exam": exam,
            "remaining_seconds": remaining_seconds,
            "version_code": assignee.quiz_variant.version_code if assignee.quiz_variant else None,
            "questions": formatted_questions,
        }

    questions = db.query(Question).filter(Question.quiz_id == quiz.id).order_by(Question.position.asc(), Question.id.asc()).all()
    for q in questions:
        options = db.query(QuestionOption).filter(QuestionOption.question_id == q.id).order_by(QuestionOption.id.asc()).all()
        formatted_options = []
        for idx, opt in enumerate(options):
            formatted_options.append({
                "id": opt.id,
                "option_text": opt.content or "",
                "order": idx + 1,
                "media_url": opt.media_url,
                "audio_url": opt.audio_url,
            })
            
        user_ans = user_answer_map.get(q.id)
        user_ans_dict = None
        if user_ans:
            user_ans_dict = {
                "selected_option_id": user_ans.selected_option_id,
                "answer_text": user_ans.answer_text,
            }

        formatted_questions.append({
            "id": q.id,
            "question_text": q.content or "",
            "question_type": q.type or "MULTIPLE_CHOICE",
            "order": len(formatted_questions) + 1,
            "points": q.time_limit or 1.0,
            "media_url": q.media_url,
            "audio_url": q.audio_url,
            "audio_play_limit": q.audio_play_limit or 0,
            "user_answer": user_ans_dict,
            "options": formatted_options
        })

    return {
        "exam": exam,
        "remaining_seconds": remaining_seconds,
        "questions": formatted_questions,
        "version_code": None,
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

    # Check correctness using the immutable paper assigned to this candidate.
    is_correct = False
    q_type = (question.type or "").strip().lower()
    variant_question = None
    variant_option_id = None
    if assignee.quiz_variant_id:
        variant_question_query = db.query(QuizVariantQuestion).filter(
            QuizVariantQuestion.quiz_variant_id == assignee.quiz_variant_id,
            QuizVariantQuestion.original_question_id == body.question_id,
        )
        if body.variant_question_id is not None:
            variant_question_query = variant_question_query.filter(
                QuizVariantQuestion.id == body.variant_question_id
            )
        variant_question = variant_question_query.first()
        if not variant_question:
            raise HTTPException(status_code=400, detail="Invalid question for your assigned quiz version.")
        variant_option_id = body.variant_option_id or body.selected_option_id
        if q_type in ["short_answer", "short answer", "short", "fill in the blank", "fill_in_the_blank"]:
            normalized_answer = (body.answer_text or "").strip().casefold()
            is_correct = any(
                option.is_correct and normalized_answer == (option.content or "").strip().casefold()
                for option in variant_question.options
            )
        elif q_type not in ["essay", "written"] and variant_option_id:
            is_correct = db.query(QuizVariantOption.id).filter(
                QuizVariantOption.id == variant_option_id,
                QuizVariantOption.variant_question_id == variant_question.id,
                QuizVariantOption.is_correct == True,
            ).first() is not None
            if not db.query(QuizVariantOption.id).filter(
                QuizVariantOption.id == variant_option_id,
                QuizVariantOption.variant_question_id == variant_question.id,
            ).first():
                raise HTTPException(status_code=400, detail="Invalid option for your assigned quiz version.")
    elif q_type in ["essay", "written"]:
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
            selected_option_id=None if variant_question else body.selected_option_id,
            variant_question_id=variant_question.id if variant_question else None,
            variant_option_id=variant_option_id,
            answer_text=body.answer_text,
            is_correct=is_correct
        )
        db.add(answer)
    else:
        answer.selected_option_id = None if variant_question else body.selected_option_id
        answer.variant_question_id = variant_question.id if variant_question else None
        answer.variant_option_id = variant_option_id
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
    is_published = assignee.exam.results_published if (assignee.exam and assignee.exam.results_published is not None) else False
    return {
        "message": "Exam submitted successfully.",
        "score": f"{score}%" if is_published else None,
        "results_published": is_published
    }


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
        
    is_published = assignee.exam.results_published if (assignee.exam and assignee.exam.results_published is not None) else False

    if assignee.status == "COMPLETED":
        return {
            "message": "Exam was already completed.",
            "score": f"{assignee.score}%" if is_published else None,
            "results_published": is_published
        }

    if assignee.status == "PENDING":
        assignee.status = "COMPLETED"
        assignee.score = 0.0
        assignee.submitted_at = datetime.utcnow()
        db.add(assignee)
        db.commit()
        return {
            "message": "Exam abandoned and locked.",
            "score": "0%" if is_published else None,
            "results_published": is_published
        }

    score = _helper_submit_exam(db, assignee)
    return {
        "message": "Exam abandoned (exited). Locked from re-taking.",
        "score": f"{score}%" if is_published else None,
        "results_published": is_published
    }


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

    formatted_questions = _serialize_submission_questions(db, assignee)

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
        "version_code": assignee.quiz_variant.version_code if assignee.quiz_variant else None,
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



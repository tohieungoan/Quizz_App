"""
RAG Chatbot API endpoints with User-Specific Database Context.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_current_user
from app.models.user import User
from app.services.chatbot_service import rag_chatbot_service

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    answer: str


def build_user_db_context(db: Session, user: User) -> str:
    """
    Query real-time database context for the authenticated user (exams, results, groups, badges, points).
    """
    points = getattr(user, "achievement_points", 0) or 0
    streak = getattr(user, "study_streak", 0) or 0

    equipped_title = "None"
    unlocked_badges = []
    try:
        from app.models.badge import UserBadge, Badge
        ubs = (
            db.query(UserBadge)
            .join(Badge)
            .filter(UserBadge.user_id == user.id, UserBadge.is_unlocked == True)
            .all()
        )
        for ub in ubs:
            if ub.badge:
                unlocked_badges.append(ub.badge.name)
                if ub.is_equipped:
                    equipped_title = ub.badge.name
    except Exception as err:
        print(f"[build_user_db_context badge query error]: {err}")

    lines = [
        f"User Full Name: {user.fullname or 'N/A'}",
        f"User Email: {user.email}",
        f"User Role: {user.role or 'STUDENT'}",
        f"Achievement Points (Điểm thành tích): {points}",
        f"Study Streak (Chuỗi ngày học): {streak} days",
        f"Equipped Title (Danh hiệu đang trang bị): {equipped_title}",
        f"Unlocked Badges/Titles: {', '.join(unlocked_badges) if unlocked_badges else 'None'}",
    ]

    # 1. Fetch Assigned & Upcoming Exams
    try:
        from app.models.exam import ExamAssignee, Exam
        assignees = (
            db.query(ExamAssignee)
            .join(Exam)
            .filter(ExamAssignee.user_id == user.id)
            .all()
        )

        upcoming_exams = []
        published_completed_exams = []
        pending_completed_exams = []

        for ea in assignees:
            exam = ea.exam
            if not exam:
                continue
            title_str = exam.title or "Untitled Exam"
            is_completed = ea.status in ["SUBMITTED", "COMPLETED"] or ea.submitted_at is not None or ea.score is not None

            if is_completed:
                is_host_or_admin = user.role in ["ADMIN", "SUPER_ADMIN", "TEACHER"] or exam.host_id == user.id
                can_see_score = bool(exam.results_published) or is_host_or_admin
                sub_time = ea.submitted_at.strftime("%Y-%m-%d %H:%M") if ea.submitted_at else "N/A"

                if can_see_score:
                    score_str = f"{ea.score:.1f}" if ea.score is not None else "N/A"
                    published_completed_exams.append(
                        f"* **{title_str}** — Score: {score_str} (Submitted: {sub_time})"
                    )
                else:
                    pending_completed_exams.append(
                        f"* **{title_str}** — Score: Hidden / Pending Release (Results not yet published by host) (Submitted: {sub_time})"
                    )
            else:
                start_str = exam.start_time.strftime("%Y-%m-%d %H:%M") if exam.start_time else "Anytime"
                end_str = exam.end_time.strftime("%Y-%m-%d %H:%M") if exam.end_time else "No deadline"
                status_str = ea.status or "ASSIGNED"
                upcoming_exams.append(
                    f"* **{title_str}** — Duration: {exam.timer} mins | Deadline: {end_str} | Status: {status_str}"
                )

        lines.append("\n[USER ASSIGNED & UPCOMING EXAMS SCHEDULE]")
        if upcoming_exams:
            lines.extend(upcoming_exams[:8])  # Top 8 most relevant
            if len(upcoming_exams) > 8:
                lines.append(f"*(Note: Showing 8 out of {len(upcoming_exams)} total upcoming exams)*")
        else:
            lines.append("No upcoming assigned exams found.")

        lines.append("\n[USER RECENT COMPLETED EXAM RESULTS]")
        if published_completed_exams or pending_completed_exams:
            if published_completed_exams:
                lines.append("PUBLISHED RESULTS (Scores Visible to User):")
                lines.extend(published_completed_exams[:10])
            if pending_completed_exams:
                lines.append("PENDING RELEASE EXAMS (Scores Hidden by Host):")
                lines.extend(pending_completed_exams[:10])
        else:
            lines.append("No completed exam results found.")
    except Exception as err:
        print(f"[build_user_db_context exam query error]: {err}")

    # 2. Fetch User Study Groups (Owned + Joined)
    try:
        from app.models.group import GroupMember, Group

        # Created / Owned groups
        owned_groups = db.query(Group).filter(Group.owner_id == user.id).all()
        owned_names = [g.name for g in owned_groups if g.name]

        # Joined groups (APPROVED or ACTIVE)
        memberships = (
            db.query(GroupMember)
            .join(Group)
            .filter(
                GroupMember.user_id == user.id,
                GroupMember.status.in_(["APPROVED", "ACTIVE", "ACCEPTED"])
            )
            .all()
        )
        joined_names = [m.group.name for m in memberships if m.group and m.group.name]

        all_group_names = list(dict.fromkeys(owned_names + joined_names))

        lines.append("\n[USER STUDY GROUPS & MEMBERSHIPS]")
        if owned_names:
            lines.append(f"- Owned Groups (Created by User): {', '.join(owned_names)}")
        else:
            lines.append("- Owned Groups (Created by User): NONE (User does not own any groups).")

        if joined_names:
            lines.append(f"- Joined Groups (Member): {', '.join(joined_names)}")
        else:
            lines.append("- Joined Groups (Member): NONE (User is not a member of any joined groups).")
    except Exception as err:
        print(f"[build_user_db_context group query error]: {err}")

    return "\n".join(lines)


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Ask AI Assistant a question",
    description="Query RAG documentation + User-specific Database Context and return AI response."
)
def chat_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Build real-time database context for authenticated user
    user_context = ""
    if current_user:
        user_context = build_user_db_context(db, current_user)
        session_id = f"user_{current_user.id}"
    else:
        session_id = request.session_id or "default"

    try:
        answer = rag_chatbot_service.process_chat(
            question=question,
            session_id=session_id,
            user_context=user_context,
        )
        return ChatResponse(answer=answer)
    except Exception as err:
        print(f"[Chatbot Endpoint Error]: {err}")
        raise HTTPException(status_code=500, detail=f"AI Chatbot service error: {str(err)}")


@router.post(
    "/clear",
    summary="Clear chat history session",
    description="Reset memory conversation history for a given session."
)
def clear_chat_endpoint(
    session_id: Optional[str] = "default",
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    sid = f"user_{current_user.id}" if current_user else (session_id or "default")
    rag_chatbot_service.clear_history(session_id=sid)
    return {"status": "success", "message": "Chat history cleared."}

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id"), nullable=False)
    host_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    timer: Mapped[int] = mapped_column(Integer, nullable=False)  # Duration in minutes
    navigation_rule: Mapped[str] = mapped_column(String, default="FREE_NAV")
    results_published: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    quiz = relationship("Quiz")
    host = relationship("User", foreign_keys=[host_id])
    assignees = relationship("ExamAssignee", back_populates="exam", cascade="all, delete-orphan")


class ExamAssignee(Base):
    __tablename__ = "exam_assignees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("exam_id", "user_id", name="uq_exam_user"),
    )

    # Relationships
    exam = relationship("Exam", back_populates="assignees")
    user = relationship("User", foreign_keys=[user_id])
    answers = relationship("ExamAnswer", back_populates="exam_assignee", cascade="all, delete-orphan")


class ExamAnswer(Base):
    __tablename__ = "exam_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_assignee_id: Mapped[int] = mapped_column(Integer, ForeignKey("exam_assignees.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("question_options.id"), nullable=True)
    answer_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    answered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("exam_assignee_id", "question_id", name="uq_assignee_question"),
    )

    # Relationships
    exam_assignee = relationship("ExamAssignee", back_populates="answers")
    question = relationship("Question")
    selected_option = relationship("QuestionOption")


class ShortAnswerValidation(Base):
    __tablename__ = "short_answer_validation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_answer_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("participant_answers.id", ondelete="CASCADE"), nullable=True)
    exam_answer_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("exam_answers.id", ondelete="CASCADE"), nullable=True)
    ai_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    matched_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    participant_answer = relationship("ParticipantAnswer")
    exam_answer = relationship("ExamAnswer")

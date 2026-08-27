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
    group_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("groups.id"), nullable=True)
    variant_set_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("quiz_variant_sets.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    timer: Mapped[int] = mapped_column(Integer, nullable=False)  # Duration in minutes
    navigation_rule: Mapped[str] = mapped_column(String, default="FREE_NAV")
    results_published: Mapped[bool] = mapped_column(Boolean, default=False)
    use_ai_question: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    quiz = relationship("Quiz")
    host = relationship("User", foreign_keys=[host_id])
    group = relationship("Group", foreign_keys=[group_id])
    variant_set = relationship("QuizVariantSet", foreign_keys=[variant_set_id])
    assignees = relationship("ExamAssignee", back_populates="exam", cascade="all, delete-orphan")


class ExamAssignee(Base):
    __tablename__ = "exam_assignees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_variant_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("quiz_variants.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
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
    quiz_variant = relationship("QuizVariant", foreign_keys=[quiz_variant_id])
    answers = relationship("ExamAnswer", back_populates="exam_assignee", cascade="all, delete-orphan")

    @property
    def user_fullname(self) -> Optional[str]:
        return self.user.fullname if self.user else None

    @property
    def user_email(self) -> Optional[str]:
        return self.user.email if self.user else None


class ExamAnswer(Base):
    __tablename__ = "exam_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_assignee_id: Mapped[int] = mapped_column(Integer, ForeignKey("exam_assignees.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("question_options.id"), nullable=True)
    variant_question_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("quiz_variant_questions.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    variant_option_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("quiz_variant_options.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
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
    variant_question = relationship("QuizVariantQuestion", foreign_keys=[variant_question_id])
    variant_option = relationship("QuizVariantOption", foreign_keys=[variant_option_id])


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

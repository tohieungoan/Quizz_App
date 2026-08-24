"""Reusable quiz-version snapshots with a controlled authoring lifecycle.

QuizVariantSet represents one generated batch for an exact Quiz.version.
QuizVariant represents a complete paper (A-E) inside that batch.  Delivery
records reference these snapshots so later quiz edits cannot change an exam or
room that has already started. Generated versions remain editable only until a
delivery record references their set.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class QuizVariantSet(Base):
    __tablename__ = "quiz_variant_sets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_quiz_version: Mapped[int] = mapped_column(Integer, nullable=False)
    requested_count: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="PENDING", nullable=False, index=True)
    generation_key: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    prompt_version: Mapped[str] = mapped_column(String(32), nullable=False)
    generation_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    quiz = relationship("Quiz", foreign_keys=[quiz_id], back_populates="variant_sets")
    variants = relationship(
        "QuizVariant",
        back_populates="variant_set",
        cascade="all, delete-orphan",
        order_by="QuizVariant.variant_index",
    )

    __table_args__ = (
        CheckConstraint("requested_count BETWEEN 2 AND 5", name="ck_variant_set_count"),
        CheckConstraint(
            "status IN ('PENDING','GENERATING','READY','DIRTY','PARTIAL','FAILED','SUPERSEDED')",
            name="ck_variant_set_status",
        ),
    )


class QuizVariant(Base):
    __tablename__ = "quiz_variants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    variant_set_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("quiz_variant_sets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    variant_index: Mapped[int] = mapped_column(Integer, nullable=False)
    version_code: Mapped[str] = mapped_column(String(1), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="PENDING", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    variant_set = relationship("QuizVariantSet", back_populates="variants")
    questions = relationship(
        "QuizVariantQuestion",
        back_populates="variant",
        cascade="all, delete-orphan",
        order_by="QuizVariantQuestion.position",
    )

    __table_args__ = (
        UniqueConstraint("variant_set_id", "variant_index", name="uq_variant_set_index"),
        UniqueConstraint("variant_set_id", "version_code", name="uq_variant_set_code"),
        CheckConstraint("variant_index BETWEEN 0 AND 4", name="ck_quiz_variant_index"),
        CheckConstraint(
            "status IN ('PENDING','READY','FALLBACK','FAILED')",
            name="ck_quiz_variant_status",
        ),
    )


class QuizVariantQuestion(Base):
    __tablename__ = "quiz_variant_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_variant_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("quiz_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_question_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("questions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    time_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    media_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    audio_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    audio_play_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    variant = relationship("QuizVariant", back_populates="questions")
    original_question = relationship("Question", foreign_keys=[original_question_id])
    options = relationship(
        "QuizVariantOption",
        back_populates="variant_question",
        cascade="all, delete-orphan",
        order_by="QuizVariantOption.position",
    )

    __table_args__ = (
        UniqueConstraint("quiz_variant_id", "position", name="uq_variant_question_position"),
        UniqueConstraint(
            "quiz_variant_id",
            "original_question_id",
            name="uq_variant_original_question",
        ),
    )


class QuizVariantOption(Base):
    __tablename__ = "quiz_variant_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    variant_question_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("quiz_variant_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_option_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("question_options.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    media_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    audio_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    variant_question = relationship("QuizVariantQuestion", back_populates="options")
    original_option = relationship("QuestionOption", foreign_keys=[original_option_id])

    __table_args__ = (
        UniqueConstraint("variant_question_id", "position", name="uq_variant_option_position"),
        UniqueConstraint(
            "variant_question_id",
            "original_option_id",
            name="uq_variant_original_option",
        ),
    )

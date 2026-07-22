from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    difficulty: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", foreign_keys=[user_id])
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    upload_files = relationship("UploadFile", back_populates="quiz")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    parent_question_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    media_type: Mapped[str] = mapped_column(String, default="NONE")
    media_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    audio_play_limit: Mapped[int] = mapped_column(Integer, default=0)

    difficulty: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    time_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_original: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    parent_question = relationship("Question", remote_side=[id])
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")


class QuestionOption(Base):
    __tablename__ = "question_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    media_type: Mapped[str] = mapped_column(String, default="NONE")
    media_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    question = relationship("Question", back_populates="options")


class UploadFile(Base):
    __tablename__ = "upload_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete="SET NULL"), nullable=True)
    filename: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    upload_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    quiz = relationship("Quiz", back_populates="upload_files")

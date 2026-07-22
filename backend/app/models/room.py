from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id"), nullable=False)
    host_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    room_code: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    qr_code_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    mode: Mapped[str] = mapped_column(String, default="GAME")

    allow_skip_question: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_show_rank: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_anonymous_question: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_voice_question: Mapped[bool] = mapped_column(Boolean, default=False)
    use_ai_question: Mapped[bool] = mapped_column(Boolean, default=False)
    shuffle_options: Mapped[bool] = mapped_column(Boolean, default=False)

    expire_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    quiz = relationship("Quiz")
    host = relationship("User", foreign_keys=[host_id])
    teams = relationship("RoomTeam", back_populates="room", cascade="all, delete-orphan")
    participants = relationship("Participant", back_populates="room", cascade="all, delete-orphan")
    qa_questions = relationship("LiveQAQuestion", back_populates="room", cascade="all, delete-orphan")


class RoomTeam(Base):
    __tablename__ = "room_teams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    team_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    team_color: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    room = relationship("Room", back_populates="teams")
    members = relationship("Participant", back_populates="team")


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    team_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("room_teams.id", ondelete="SET NULL"), nullable=True)
    nickname: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    score: Mapped[float] = mapped_column(Float, default=0.0)

    __table_args__ = (
        UniqueConstraint("room_id", "user_id", name="uq_room_user"),
        UniqueConstraint("room_id", "nickname", name="uq_room_nickname"),
    )

    # Relationships
    room = relationship("Room", back_populates="participants")
    user = relationship("User", foreign_keys=[user_id])
    team = relationship("RoomTeam", back_populates="members")
    answers = relationship("ParticipantAnswer", back_populates="participant", cascade="all, delete-orphan")


class ParticipantAnswer(Base):
    __tablename__ = "participant_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_id: Mapped[int] = mapped_column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("question_options.id"), nullable=True)
    answer_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    answered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("participant_id", "question_id", name="uq_participant_question"),
    )

    # Relationships
    participant = relationship("Participant", back_populates="answers")
    question = relationship("Question")
    selected_option = relationship("QuestionOption")


class LiveQAQuestion(Base):
    __tablename__ = "live_qa_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    participant_id: Mapped[int] = mapped_column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)
    question_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    audio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    upvote_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    room = relationship("Room", back_populates="qa_questions")
    participant = relationship("Participant")
    upvotes = relationship("LiveQAUpvote", back_populates="qa_question", cascade="all, delete-orphan")


class LiveQAUpvote(Base):
    __tablename__ = "live_qa_upvotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    qa_question_id: Mapped[int] = mapped_column(Integer, ForeignKey("live_qa_questions.id", ondelete="CASCADE"), nullable=False)
    participant_id: Mapped[int] = mapped_column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("qa_question_id", "participant_id", name="uq_qa_participant"),
    )

    # Relationships
    qa_question = relationship("LiveQAQuestion", back_populates="upvotes")
    participant = relationship("Participant")

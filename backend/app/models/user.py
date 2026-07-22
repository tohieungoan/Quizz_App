from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fullname: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    study_streak: Mapped[int] = mapped_column(Integer, default=0)
    auth_provider: Mapped[str] = mapped_column(String, default="LOCAL")
    provider_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, default="USER")
    status: Mapped[str] = mapped_column(String, default="ACTIVE")
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    achievement_points: Mapped[int] = mapped_column(Integer, default=0)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="refresh_tokens")



class UserSetting(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    notification_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    in_app_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_system: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_quiz_assigned: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_exam_reminder: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_results_published: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_room_invite: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="settings")

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    category: Mapped[str] = mapped_column(String, default="TITLE")
    tier: Mapped[str] = mapped_column(String, default="COMMON")
    points_required: Mapped[int] = mapped_column(Integer, default=0)
    type_value: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target_value: Mapped[int] = mapped_column(Integer, default=1)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id: Mapped[int] = mapped_column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)

    current_progress: Mapped[int] = mapped_column(Integer, default=0)
    is_unlocked: Mapped[bool] = mapped_column(Boolean, default=False)
    is_equipped: Mapped[bool] = mapped_column(Boolean, default=False)

    unlocked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    # Relationships
    user = relationship("User")
    badge = relationship("Badge", back_populates="user_badges")

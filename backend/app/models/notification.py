from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sender_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    target_type: Mapped[str] = mapped_column(String, default="PERSONAL")
    target_group_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)

    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    action_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[user_id])
    target_group = relationship("Group", foreign_keys=[target_group_id])

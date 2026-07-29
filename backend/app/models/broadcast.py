from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class BroadcastLog(Base):
    __tablename__ = "broadcast_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String, default="ANNOUNCEMENT")
    target_type: Mapped[str] = mapped_column(String, default="ALL_USERS")
    target_group_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    action_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    is_scheduled: Mapped[bool] = mapped_column(Boolean, default=False)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Status: PENDING, SENT, CANCELLED, FAILED
    status: Mapped[str] = mapped_column(String, default="SENT")
    
    # APScheduler Job ID
    job_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    admin = relationship("User", foreign_keys=[admin_id])
    target_group = relationship("Group", foreign_keys=[target_group_id])

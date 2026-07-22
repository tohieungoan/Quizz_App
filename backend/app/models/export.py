from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Export(Base):
    __tablename__ = "exports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    room_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    exam_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("exams.id", ondelete="SET NULL"), nullable=True)

    type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    room = relationship("Room")
    exam = relationship("Exam")

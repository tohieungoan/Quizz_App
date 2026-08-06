from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class AdminSetting(Base):
    __tablename__ = "admin_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    # Master Email Alerts Switch
    email_alerts_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    # Account Lifecycle Matrix
    lifecycle_user_registered_inapp: Mapped[bool] = mapped_column(Boolean, default=True)
    lifecycle_user_registered_email: Mapped[bool] = mapped_column(Boolean, default=True)

    lifecycle_user_deleted_inapp: Mapped[bool] = mapped_column(Boolean, default=True)
    lifecycle_user_deleted_email: Mapped[bool] = mapped_column(Boolean, default=True)

    lifecycle_user_status_inapp: Mapped[bool] = mapped_column(Boolean, default=True)
    lifecycle_user_status_email: Mapped[bool] = mapped_column(Boolean, default=False)

    lifecycle_user_imported_inapp: Mapped[bool] = mapped_column(Boolean, default=True)
    lifecycle_user_imported_email: Mapped[bool] = mapped_column(Boolean, default=True)

    # Security & Permissions Matrix
    security_permission_changes_inapp: Mapped[bool] = mapped_column(Boolean, default=True)
    security_permission_changes_email: Mapped[bool] = mapped_column(Boolean, default=True)

    security_critical_data_deletion_inapp: Mapped[bool] = mapped_column(Boolean, default=True)
    security_critical_data_deletion_email: Mapped[bool] = mapped_column(Boolean, default=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

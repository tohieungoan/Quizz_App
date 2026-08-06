from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.admin_setting import AdminSetting
from app.schemas.admin_setting import AdminSettingUpdate


class CRUDAdminSetting:
    def get_or_create(self, db: Session, user_id: Optional[int] = None) -> AdminSetting:
        """Retrieve admin settings or initialize with defaults if not present."""
        setting = db.query(AdminSetting).first()
        if not setting:
            setting = AdminSetting(
                user_id=user_id,
                email_alerts_enabled=True,
                lifecycle_user_registered_inapp=True,
                lifecycle_user_registered_email=True,
                lifecycle_user_deleted_inapp=True,
                lifecycle_user_deleted_email=True,
                lifecycle_user_status_inapp=True,
                lifecycle_user_status_email=False,
                lifecycle_user_imported_inapp=True,
                lifecycle_user_imported_email=True,
                security_permission_changes_inapp=True,
                security_permission_changes_email=True,
                security_critical_data_deletion_inapp=True,
                security_critical_data_deletion_email=True,
            )
            db.add(setting)
            db.commit()
            db.refresh(setting)
        return setting

    def update(self, db: Session, obj_in: AdminSettingUpdate, user_id: Optional[int] = None) -> AdminSetting:
        """Update system-wide admin notification settings."""
        setting = self.get_or_create(db, user_id=user_id)
        update_data = obj_in.model_dump()
        for field, value in update_data.items():
            if hasattr(setting, field):
                setattr(setting, field, value)
        setting.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(setting)
        return setting


crud_admin_setting = CRUDAdminSetting()

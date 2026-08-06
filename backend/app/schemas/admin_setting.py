from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AdminSettingBase(BaseModel):
    email_alerts_enabled: bool = True
    lifecycle_user_registered_inapp: bool = True
    lifecycle_user_registered_email: bool = True
    lifecycle_user_deleted_inapp: bool = True
    lifecycle_user_deleted_email: bool = True
    lifecycle_user_status_inapp: bool = True
    lifecycle_user_status_email: bool = False
    lifecycle_user_imported_inapp: bool = True
    lifecycle_user_imported_email: bool = True
    security_permission_changes_inapp: bool = True
    security_permission_changes_email: bool = True
    security_critical_data_deletion_inapp: bool = True
    security_critical_data_deletion_email: bool = True


class AdminSettingUpdate(AdminSettingBase):
    pass


class AdminSettingResponse(AdminSettingBase):
    id: int
    user_id: Optional[int] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

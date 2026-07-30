from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    id: int
    title: str
    content: str
    type: Optional[str] = None
    action_url: Optional[str] = None
    target_group_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    data: List[NotificationResponse]
    unread_count: int

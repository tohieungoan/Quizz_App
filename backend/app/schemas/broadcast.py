from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

class BroadcastRequest(BaseModel):
    title: str
    content: str
    type: str = "ANNOUNCEMENT"  # ANNOUNCEMENT, SYSTEM, INFO
    targetType: str = "ALL_USERS" # ALL_USERS, GROUP, USER
    targetGroupId: Optional[int] = None
    targetUserId: Optional[int] = None
    actionUrl: Optional[str] = None
    isScheduled: bool = False
    scheduledAt: Optional[str] = None

class BroadcastResponse(BaseModel):
    success: bool
    message: str
    job_id: Optional[str] = None

class BroadcastLogSchema(BaseModel):
    id: int
    title: str
    content: str
    type: str
    target_type: str
    target_group_id: Optional[int] = None
    action_url: Optional[str] = None
    is_scheduled: bool
    scheduled_at: Optional[datetime] = None
    status: str
    job_id: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class BroadcastHistoryResponse(BaseModel):
    data: List[BroadcastLogSchema]
    total: int
    pageIndex: int
    pageSize: int

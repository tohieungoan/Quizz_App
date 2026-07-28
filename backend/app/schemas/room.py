from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class RoomAdminResponse(BaseModel):
    id: int
    title: str
    room_code: str
    host_name: str
    quiz_title: str
    status: str
    participantCount: int
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class RoomAdminPageResponse(BaseModel):
    data: List[RoomAdminResponse]
    total: int
    pageIndex: int
    pageSize: int

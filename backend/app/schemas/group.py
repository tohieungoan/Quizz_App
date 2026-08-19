from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "GraduationCap"
    status: Optional[str] = "OPEN"


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    status: Optional[str] = None


class GroupMemberResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    role_in_group: str
    status: str
    joined_at: Optional[datetime] = None
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class GroupResponse(GroupBase):
    id: int
    owner_id: int
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    group_code: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GroupDetailResponse(GroupResponse):
    members: List[GroupMemberResponse] = []


class GroupJoinRequest(BaseModel):
    group_code: str


class GroupInviteRequest(BaseModel):
    email: str


class BulkRequestAction(BaseModel):
    member_ids: List[int] = []
    all_members: bool = False


class BulkInvitationAction(BaseModel):
    group_ids: List[int] = []
    all_invitations: bool = False


class ExamScoreDetail(BaseModel):
    examTitle: str
    score: str
    status: str
    completedAt: Optional[str] = ""
    timeTaken: Optional[str] = ""


class RosterMemberResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    joined_at: Optional[datetime] = None
    examsCompleted: int
    totalExamsAssigned: int
    averageScore: str
    avatar: Optional[str] = None
    examScores: List[ExamScoreDetail] = []




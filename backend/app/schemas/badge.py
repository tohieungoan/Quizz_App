"""
Pydantic Models for Badge.
Used to validate input data and format output data for APIs.
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class BadgeCategory(str, Enum):
    TITLE = "TITLE"
    BADGE = "BADGE"


class BadgeTier(str, Enum):
    COMMON = "COMMON"
    RARE = "RARE"
    EPIC = "EPIC"
    LEGENDARY = "LEGENDARY"


class BadgeType(str, Enum):
    STREAK = "STREAK"
    QUIZ_COUNT = "QUIZ_COUNT"
    PERFECT_SCORE = "PERFECT_SCORE"
    TOTAL_POINTS = "TOTAL_POINTS"
    QUIZ_COMPLETED = "QUIZ_COMPLETED"


class BadgeBase(BaseModel):
    name: str = Field(..., examples=["Beginner"])
    description: Optional[str] = Field(None, examples=["Complete your first quiz"])
    icon: Optional[str] = Field(None, examples=["https://example.com/icon.png"])
    category: Optional[BadgeCategory] = Field(BadgeCategory.TITLE, examples=["TITLE"])
    tier: Optional[BadgeTier] = Field(BadgeTier.COMMON, examples=["COMMON"])
    points_required: Optional[int] = Field(0, examples=[10])
    type_value: Optional[str] = Field(None, examples=["QUIZ_COUNT"])
    target_value: Optional[int] = Field(1, examples=[1])


class BadgeCreate(BadgeBase):
    pass


class BadgeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[BadgeCategory] = None
    tier: Optional[BadgeTier] = None
    points_required: Optional[int] = None
    type_value: Optional[str] = None
    target_value: Optional[int] = None


class BadgeResponse(BadgeBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BadgePageResponse(BaseModel):
    data: List[BadgeResponse]
    total: int
    skip: int
    limit: int


class BadgeUserResponse(BaseModel):
    id: int
    user_id: int
    badge_id: int
    current_progress: int
    is_unlocked: bool
    is_equipped: bool
    unlocked_at: Optional[datetime] = None
    
    # We include basic user info to show in the UI
    user_name: str
    user_email: str
    
    model_config = ConfigDict(from_attributes=True)

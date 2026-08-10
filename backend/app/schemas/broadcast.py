from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import List, Optional

VALID_BROADCAST_TYPES = {"ANNOUNCEMENT", "SYSTEM", "INFO", "UPDATE", "PROMOTION", "EVENT"}

class BroadcastRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Broadcast title (3-200 chars)")
    content: str = Field(..., min_length=5, max_length=2000, description="Broadcast content (5-2000 chars)")
    type: str = Field(default="ANNOUNCEMENT", description="Broadcast type")
    targetType: Optional[str] = Field(default="ALL_USERS", description="Target audience type (defaults to ALL_USERS)")
    actionUrl: Optional[str] = Field(default=None, description="Optional action URL (relative or https/http)")
    isScheduled: bool = Field(default=False, description="Whether to schedule this broadcast")
    scheduledAt: Optional[str] = Field(default=None, description="ISO datetime string for scheduled execution")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if len(cleaned) < 3 or len(cleaned) > 200:
            raise ValueError("Broadcast title must be between 3 and 200 non-empty characters.")
        return cleaned

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if len(cleaned) < 5 or len(cleaned) > 2000:
            raise ValueError("Broadcast content must be between 5 and 2000 non-empty characters.")
        return cleaned

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        upper_v = (v or "").strip().upper()
        if upper_v not in VALID_BROADCAST_TYPES:
            raise ValueError(f"Invalid broadcast type '{v}'. Allowed types: {', '.join(sorted(VALID_BROADCAST_TYPES))}")
        return upper_v

    @field_validator("actionUrl")
    @classmethod
    def validate_action_url(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        if len(cleaned) > 500:
            raise ValueError("Action URL must not exceed 500 characters.")
        
        # Check against dangerous pseudo-protocols
        lower_url = cleaned.lower()
        if lower_url.startswith(("javascript:", "data:", "vbscript:", "file:")):
            raise ValueError("Action URL contains an invalid or disallowed protocol.")
            
        # Must be either a valid relative URL (starting with /) or absolute HTTP/HTTPS
        if not (cleaned.startswith("/") or cleaned.startswith("http://") or cleaned.startswith("https://")):
            raise ValueError("Action URL must start with '/' (internal route) or 'http://' / 'https://'.")
            
        return cleaned

class BroadcastResponse(BaseModel):
    success: bool
    message: str
    job_id: Optional[str] = None

class BroadcastLogSchema(BaseModel):
    id: int
    admin_id: Optional[int] = None
    title: str
    content: str
    type: str
    target_type: str = "ALL_USERS"
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

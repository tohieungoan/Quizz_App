"""
Pydantic Models for User object.
Used to validate input data (UserCreate, UserUpdate) and format output data (UserResponse).
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field


# Base Schema containing shared attributes
class UserBase(BaseModel):
    email: EmailStr
    fullname: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = "USER"
    status: Optional[str] = "ACTIVE"


# Schema used when creating a new User (POST /api/v1/users)
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password minimum 6 characters")
    auth_provider: Optional[str] = "LOCAL"
    provider_id: Optional[str] = None


# Schema used when updating User information (PUT / PATCH /api/v1/users/{id})
class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    avatar: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[str] = None
    status: Optional[str] = None
    email_verified: Optional[bool] = None


# Schema used for password change (when logged in)
class UserChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


# Schema used for Forgot Password API
class UserForgotPassword(BaseModel):
    email: EmailStr


# Schema used for Reset Password with Token API
class UserResetPassword(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, description="New password minimum 6 characters")


# Schema used for Email Verification API
class UserVerifyEmail(BaseModel):
    token: str


# Schema used for Resending Verification Email API
class UserResendVerification(BaseModel):
    email: EmailStr




# Schema used for Response returned to Client (GET /api/v1/users)
class UserResponse(UserBase):
    id: int
    study_streak: int = 0
    auth_provider: str = "LOCAL"
    provider_id: Optional[str] = None
    email_verified: bool = False
    achievement_points: int = 0
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Schema containing full information (used internally in backend if needed)
class UserInDB(UserResponse):
    password: Optional[str] = None


class UserSettingResponse(BaseModel):
    notification_email: Optional[str] = None
    email_notifications_enabled: bool = True
    in_app_notifications_enabled: bool = True
    notify_system: bool = True
    notify_quiz_assigned: bool = True
    notify_exam_reminder: bool = True
    notify_results_published: bool = True
    notify_room_invite: bool = True

    model_config = ConfigDict(from_attributes=True)


class UserSettingUpdate(BaseModel):
    email_notifications_enabled: Optional[bool] = None
    in_app_notifications_enabled: Optional[bool] = None
    notify_system: Optional[bool] = None
    notify_quiz_assigned: Optional[bool] = None
    notify_exam_reminder: Optional[bool] = None
    notify_results_published: Optional[bool] = None
    notify_room_invite: Optional[bool] = None


class NotificationEmailRequest(BaseModel):
    email: EmailStr



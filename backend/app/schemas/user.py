"""
Pydantic Models cho đối tượng User.
Dùng để Validate dữ liệu đầu vào (UserCreate, UserUpdate) và định dạng dữ liệu đầu ra (UserResponse).
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field


# Base Schema chứa các thuộc tính dùng chung
class UserBase(BaseModel):
    email: EmailStr
    fullname: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = "USER"
    status: Optional[str] = "ACTIVE"


# Schema dùng khi tạo mới User (POST /api/v1/users)
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Mật khẩu tối thiểu 6 ký tự")
    auth_provider: Optional[str] = "LOCAL"
    provider_id: Optional[str] = None


# Schema dùng khi cập nhật thông tin User (PUT / PATCH /api/v1/users/{id})
class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    avatar: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[str] = None
    status: Optional[str] = None
    email_verified: Optional[bool] = None


# Schema dùng khi đổi mật khẩu riêng biệt
class UserChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


# Schema dùng cho Response trả về cho Client (GET /api/v1/users)
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


# Schema chứa thông tin đầy đủ (dùng nội bộ backend nếu cần)
class UserInDB(UserResponse):
    password: Optional[str] = None


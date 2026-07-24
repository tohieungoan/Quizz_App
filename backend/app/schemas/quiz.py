from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

# --- QUIZ SCHEMAS ---
class QuizBase(BaseModel):
    title: str = Field(..., examples=["Basic Math Quiz"])
    subject: Optional[str] = Field(None, examples=["Mathematics"])
    description: Optional[str] = Field(None, examples=["A simple test of basic addition and subtraction."])
    difficulty: Optional[str] = Field("Beginner", examples=["Beginner", "Intermediate", "Advanced"])
    is_public: Optional[bool] = Field(False, examples=[False])
    status: Optional[str] = Field("Draft", examples=["Draft", "Published", "Archived"])

class QuizCreate(QuizBase):
    pass

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    is_public: Optional[bool] = None
    status: Optional[str] = None

class QuizResponse(QuizBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class QuizPageResponse(BaseModel):
    data: List[QuizResponse]
    total: int
    skip: int
    limit: int

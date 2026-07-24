from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

# --- QUESTION OPTION SCHEMAS ---
class QuestionOptionBase(BaseModel):
    content: Optional[str] = Field(None, examples=["A. Paris"])
    audio_url: Optional[str] = Field(None, examples=["https://res.cloudinary.com/demo/video/upload/sample.mp3"])
    media_url: Optional[str] = Field(None, examples=["https://res.cloudinary.com/demo/image/upload/sample.jpg"])
    is_correct: Optional[bool] = Field(False, examples=[True])

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOptionUpdate(QuestionOptionBase):
    pass

class QuestionOptionResponse(QuestionOptionBase):
    id: int
    question_id: int

    class Config:
        from_attributes = True


# --- QUESTION SCHEMAS ---
class QuestionBase(BaseModel):
    parent_question_id: Optional[int] = Field(None, examples=[None])
    type: Optional[str] = Field("Multiple Choice", examples=["Multiple Choice", "True/False", "Fill in the Blank"])
    content: Optional[str] = Field(..., examples=["What is the capital of France?"])
    audio_url: Optional[str] = Field(None, examples=["https://res.cloudinary.com/demo/video/upload/question.mp3"])
    media_url: Optional[str] = Field(None, examples=["https://res.cloudinary.com/demo/image/upload/question.jpg"])
    audio_play_limit: Optional[int] = Field(0, examples=[0, 3])
    difficulty: Optional[str] = Field("Beginner", examples=["Beginner", "Intermediate"])
    time_limit: Optional[int] = Field(None, examples=[30])
    source: Optional[str] = Field(None, examples=["Internal"])
    is_original: Optional[bool] = Field(True, examples=[True])

class QuestionCreate(QuestionBase):
    options: List[QuestionOptionCreate] = Field(default_factory=list)

class QuestionUpdate(QuestionBase):
    content: Optional[str] = None
    options: Optional[List[QuestionOptionCreate]] = None

class QuestionResponse(QuestionBase):
    id: int
    quiz_id: int
    created_at: datetime
    updated_at: datetime
    options: List[QuestionOptionResponse] = []

    class Config:
        from_attributes = True

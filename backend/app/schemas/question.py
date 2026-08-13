from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator

# --- QUESTION OPTION SCHEMAS ---
class QuestionOptionBase(BaseModel):
    content: Optional[str] = Field(None, examples=["A. Paris"])
    audio_url: Optional[str] = Field(None, examples=["https://res.cloudinary.com/demo/video/upload/sample.mp3"])
    media_url: Optional[str] = Field(None, examples=["https://res.cloudinary.com/demo/image/upload/sample.jpg"])
    is_correct: Optional[bool] = Field(False, examples=[True])

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOptionUpdate(QuestionOptionBase):
    id: Optional[int] = None

class QuestionOptionResponse(QuestionOptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_id: int


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
    is_original: Optional[bool] = Field(True, examples=[True])
    position: Optional[int] = Field(0, ge=0)

class QuestionCreate(QuestionBase):
    options: List[QuestionOptionCreate] = Field(default_factory=list)
    
    @model_validator(mode='after')
    def validate_options_count(self):
        q_type = (self.type or "").strip().lower()
        if q_type in ["true/false", "true_false"]:
            if len(self.options) != 2:
                raise ValueError("True/False questions must have exactly 2 options.")
        elif q_type in ["short answer", "short", "fill in the blank"]:
            if len(self.options) < 1 or len(self.options) > 5:
                raise ValueError("Short Answer / Fill in the blank questions must have between 1 and 5 acceptable options.")
        elif q_type in ["multiple choice", "multiple_choice", "multiple"]:
            if len(self.options) < 2:
                raise ValueError("Multiple Choice questions must have at least 2 options.")
            if not any(opt.is_correct for opt in self.options):
                raise ValueError("Multiple Choice questions must have at least one correct option.")
        return self

class QuestionUpdate(QuestionBase):
    content: Optional[str] = None
    options: Optional[List[QuestionOptionUpdate]] = None

    @model_validator(mode='after')
    def validate_options_count(self):
        if self.options is not None:
            q_type = (self.type or "").strip().lower()
            if q_type in ["true/false", "true_false"]:
                if len(self.options) != 2:
                    raise ValueError("True/False questions must have exactly 2 options.")
            elif q_type in ["short answer", "short", "fill in the blank"]:
                if len(self.options) < 1 or len(self.options) > 5:
                    raise ValueError("Short Answer / Fill in the blank questions must have between 1 and 5 acceptable options.")
            elif q_type in ["multiple choice", "multiple_choice", "multiple"]:
                if len(self.options) < 2:
                    raise ValueError("Multiple Choice questions must have at least 2 options.")
                if not any(opt.is_correct for opt in self.options):
                    raise ValueError("Multiple Choice questions must have at least one correct option.")
        return self

class QuestionResponse(QuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    created_at: datetime
    updated_at: datetime
    options: List[QuestionOptionResponse] = Field(default_factory=list)

class QuestionPageResponse(BaseModel):
    data: List[QuestionResponse]
    total: int
    pageIndex: int
    pageSize: int

class QuestionImport(BaseModel):
    question_ids: List[int] = Field(..., max_length=100, description="List of question IDs to import into the quiz")

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


QUESTION_TYPE_ALIASES = {
    "multiple choice": "Multiple Choice",
    "multiple_choice": "Multiple Choice",
    "multiple": "Multiple Choice",
    "true/false": "True/False",
    "true_false": "True/False",
    "truefalse": "True/False",
    "short answer": "Short Answer",
    "short": "Short Answer",
    "fill in the blank": "Short Answer",
    "fill in blank": "Short Answer",
}
QUESTION_DIFFICULTIES = {
    "easy": "Easy",
    "medium": "Medium",
    "hard": "Hard",
    "beginner": "Beginner",
    "intermediate": "Intermediate",
    "advanced": "Advanced",
}


def _validate_option_set(question_type: str, options: list) -> None:
    if any(not (option.content or "").strip() for option in options):
        raise ValueError("Answer options cannot be empty.")

    correct_count = sum(option.is_correct is True for option in options)
    if question_type == "True/False":
        if len(options) != 2:
            raise ValueError("True/False questions must have exactly 2 options.")
        if correct_count != 1:
            raise ValueError("True/False questions must have exactly one correct option.")
    elif question_type == "Short Answer":
        if not 1 <= len(options) <= 5:
            raise ValueError("Short Answer questions must have between 1 and 5 acceptable options.")
        if correct_count < 1:
            raise ValueError("Short Answer questions must have at least one accepted answer.")
    else:
        if not 2 <= len(options) <= 20:
            raise ValueError("Multiple Choice questions must have between 2 and 20 options.")
        if correct_count != 1:
            raise ValueError("Multiple Choice questions must have exactly one correct option.")

# --- QUESTION OPTION SCHEMAS ---
class QuestionOptionBase(BaseModel):
    content: Optional[str] = Field(None, max_length=10000, examples=["A. Paris"])
    audio_url: Optional[str] = Field(None, max_length=2048, examples=["https://res.cloudinary.com/demo/video/upload/sample.mp3"])
    media_url: Optional[str] = Field(None, max_length=2048, examples=["https://res.cloudinary.com/demo/image/upload/sample.jpg"])
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
    type: Optional[str] = Field("Multiple Choice", max_length=50, examples=["Multiple Choice", "True/False", "Short Answer"])
    content: Optional[str] = Field(..., max_length=50000, examples=["What is the capital of France?"])
    audio_url: Optional[str] = Field(None, max_length=2048, examples=["https://res.cloudinary.com/demo/video/upload/question.mp3"])
    media_url: Optional[str] = Field(None, max_length=2048, examples=["https://res.cloudinary.com/demo/image/upload/question.jpg"])
    audio_play_limit: Optional[int] = Field(0, ge=0, le=100, examples=[0, 3])
    difficulty: Optional[str] = Field("Beginner", max_length=30, examples=["Beginner", "Intermediate"])
    time_limit: Optional[int] = Field(None, ge=1, le=86400, examples=[30])
    is_original: Optional[bool] = Field(True, examples=[True])
    position: Optional[int] = Field(0, ge=0)

    @field_validator("type")
    @classmethod
    def normalize_question_type(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = QUESTION_TYPE_ALIASES.get(value.strip().lower())
        if normalized is None:
            raise ValueError("Unsupported question type.")
        return normalized

    @field_validator("difficulty")
    @classmethod
    def normalize_difficulty(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = QUESTION_DIFFICULTIES.get(value.strip().lower())
        if normalized is None:
            raise ValueError("Unsupported question difficulty.")
        return normalized

class QuestionCreate(QuestionBase):
    type: str = Field(default="Multiple Choice", max_length=50)
    content: str = Field(..., min_length=1, max_length=50000)
    options: List[QuestionOptionCreate] = Field(default_factory=list, max_length=20)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Question content cannot be empty.")
        return cleaned
    
    @model_validator(mode='after')
    def validate_options_count(self):
        _validate_option_set(self.type, self.options)
        return self

class QuestionUpdate(QuestionBase):
    type: Optional[str] = Field(None, max_length=50)
    content: Optional[str] = Field(None, max_length=50000)
    options: Optional[List[QuestionOptionUpdate]] = Field(None, max_length=20)

    @field_validator("content")
    @classmethod
    def validate_updated_content(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Question content cannot be empty.")
        return cleaned

    @model_validator(mode='after')
    def validate_options_count(self):
        if "content" in self.model_fields_set and self.content is None:
            raise ValueError("Question content cannot be null.")
        if self.options is not None:
            if self.type is None:
                raise ValueError("Question type is required when replacing answer options.")
            _validate_option_set(self.type, self.options)
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

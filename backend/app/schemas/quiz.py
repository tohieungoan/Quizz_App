from datetime import datetime
from typing import Any, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.question import QuestionResponse


# --- QUIZ SCHEMAS ---
class QuizBase(BaseModel):
    title: str = Field(..., max_length=255, examples=["Basic Math Quiz"])
    subject: Optional[str] = Field(None, examples=["Mathematics"])
    description: Optional[str] = Field(
        None, examples=["A simple test of basic addition and subtraction."]
    )
    difficulty: Optional[str] = Field(
        "Beginner", examples=["Beginner", "Intermediate", "Advanced"]
    )
    is_public: Optional[bool] = Field(False, examples=[False])
    status: Optional[str] = Field("Draft", examples=["Draft", "Published", "Archived"])
    shuffle_options: Optional[bool] = True

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = value.strip().title()
        if normalized not in {"Draft", "Published", "Archived"}:
            raise ValueError("Status must be Draft, Published, or Archived.")
        return normalized


class QuizCreate(QuizBase):
    # Creation cannot be used as an alternate publish path. A quiz becomes
    # Published only through the validated publish endpoint.
    status: Literal["Draft"] = Field(default="Draft", examples=["Draft"])

    @field_validator("status", mode="before")
    @classmethod
    def normalize_draft_status(cls, value):
        if isinstance(value, str) and value.strip().lower() == "draft":
            return "Draft"
        return value


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    is_public: Optional[bool] = None
    status: Optional[str] = None
    shuffle_options: Optional[bool] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        return QuizBase.validate_status(value)


class QuizResponse(QuizBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    question_count: int = 0
    version: int = 1
    published_at: Optional[datetime] = None

class QuizPageResponse(BaseModel):
    data: List[QuizResponse]
    total: int
    pageIndex: int
    pageSize: int


class DraftOptionSnapshot(BaseModel):
    id: Optional[int] = None
    content: str = Field(default="", max_length=10000)
    audio_url: Optional[str] = Field(None, max_length=2048)
    media_url: Optional[str] = Field(None, max_length=2048)
    is_correct: bool = False


class DraftQuestionSnapshot(BaseModel):
    id: Optional[int] = None
    client_id: Optional[str] = Field(None, max_length=100)
    parent_question_id: Optional[int] = None
    type: str = Field(default="Multiple Choice", max_length=50)
    content: str = Field(default="", max_length=50000)
    audio_url: Optional[str] = Field(None, max_length=2048)
    media_url: Optional[str] = Field(None, max_length=2048)
    audio_play_limit: int = Field(default=0, ge=0, le=100)
    difficulty: str = Field(default="Medium", max_length=30)
    time_limit: Optional[int] = Field(default=60, ge=1, le=86400)
    is_original: bool = True
    options: List[DraftOptionSnapshot] = Field(default_factory=list, max_length=20)


class QuizDraftCreate(BaseModel):
    client_draft_id: str = Field(..., min_length=8, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")


class QuizDraftSnapshot(BaseModel):
    expected_version: int = Field(..., ge=1)
    complete_snapshot: Literal[True]
    expected_question_count: int = Field(..., ge=0, le=2000)
    title: str = Field(default="", max_length=255)
    subject: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=20000)
    difficulty: Optional[str] = Field(default="Medium", max_length=30)
    is_public: bool = False
    shuffle_options: bool = True
    builder_state: Optional[dict[str, Any]] = None
    questions: List[DraftQuestionSnapshot] = Field(default_factory=list, max_length=2000)

    @model_validator(mode="after")
    def validate_complete_snapshot(self):
        if self.expected_question_count != len(self.questions):
            raise ValueError("expected_question_count must match the complete questions snapshot.")
        persisted_ids = [question.id for question in self.questions if question.id is not None]
        if len(persisted_ids) != len(set(persisted_ids)):
            raise ValueError("Question IDs must be unique within a draft snapshot.")
        return self


class QuizPublishRequest(BaseModel):
    expected_version: int = Field(..., ge=1)


class QuizEditorResponse(BaseModel):
    quiz: QuizResponse
    questions: List[QuestionResponse] = Field(default_factory=list)
    builder_state: Optional[dict[str, Any]] = None


class QuizVersionConflictResponse(BaseModel):
    message: str
    current_version: int

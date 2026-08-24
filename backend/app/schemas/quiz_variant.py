"""Public contracts for author preview and delivery of quiz variants."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class QuizVariantOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_option_id: Optional[int] = None
    content: str
    media_url: Optional[str] = None
    audio_url: Optional[str] = None
    is_correct: bool
    position: int


class QuizVariantQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_question_id: Optional[int] = None
    type: Optional[str] = None
    content: str
    difficulty: Optional[str] = None
    time_limit: Optional[int] = None
    media_url: Optional[str] = None
    audio_url: Optional[str] = None
    audio_play_limit: int = 0
    position: int
    options: List[QuizVariantOptionResponse] = Field(default_factory=list)


class QuizVariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    variant_index: int
    version_code: str
    status: str
    questions: List[QuizVariantQuestionResponse] = Field(default_factory=list)


class QuizVariantSetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    source_quiz_version: int
    requested_count: int
    status: str
    prompt_version: str
    generation_model: Optional[str] = None
    attempt_count: int
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    variants: List[QuizVariantResponse] = Field(default_factory=list)


class QuizVariantRetryResponse(BaseModel):
    variant_set_id: int
    status: str


class QuizVariantGenerateRequest(BaseModel):
    expected_version: int = Field(..., ge=1)


class QuizVariantOptionUpdate(BaseModel):
    id: Optional[int] = None
    content: str = Field(default="", max_length=10000)
    media_url: Optional[str] = Field(None, max_length=2048)
    audio_url: Optional[str] = Field(None, max_length=2048)
    is_correct: bool = False


class QuizVariantQuestionUpdate(BaseModel):
    type: str = Field(..., min_length=1, max_length=50)
    content: str = Field(..., min_length=1, max_length=50000)
    difficulty: Optional[str] = Field(default="Medium", max_length=30)
    time_limit: Optional[int] = Field(default=60, ge=1, le=86400)
    media_url: Optional[str] = Field(None, max_length=2048)
    audio_url: Optional[str] = Field(None, max_length=2048)
    options: List[QuizVariantOptionUpdate] = Field(default_factory=list, max_length=20)

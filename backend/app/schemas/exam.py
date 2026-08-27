from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class ExamAssignRequest(BaseModel):
    quiz_id: int
    group_id: int
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: datetime  # Deadline
    timer: int  # Duration in minutes
    navigation_rule: Optional[str] = "FREE_NAV"
    results_published: Optional[bool] = False
    status: Optional[str] = "ACTIVE"
    use_ai_question: Optional[bool] = False

class ExamUpdateRequest(BaseModel):
    quiz_id: Optional[int] = None
    group_id: Optional[int] = None
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    timer: Optional[int] = None
    navigation_rule: Optional[str] = None
    results_published: Optional[bool] = None
    status: Optional[str] = None
    use_ai_question: Optional[bool] = None

class ExamResponse(BaseModel):
    id: int
    quiz_id: int
    host_id: int
    title: Optional[str]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    timer: int
    navigation_rule: str
    results_published: bool
    status: str
    created_at: datetime
    variant_set_id: Optional[int] = None
    use_ai_question: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

class ExamAssigneeResponse(BaseModel):
    id: int
    exam_id: int
    user_id: int
    status: Optional[str]
    started_at: Optional[datetime]
    submitted_at: Optional[datetime]
    score: Optional[float]
    feedback_comment: Optional[str]
    user_fullname: Optional[str] = None
    user_email: Optional[str] = None
    quiz_variant_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class ExamAssignDetailResponse(BaseModel):
    exam: ExamResponse
    assignees_count: int
    assignees: List[ExamAssigneeResponse]

class UserExamResponse(BaseModel):
    id: int  # ExamAssignee ID
    exam_id: int
    status: Optional[str]
    score: Optional[float]
    submitted_at: Optional[datetime]
    exam_title: Optional[str]
    timer: int
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    host_fullname: Optional[str]
    quiz_subject: Optional[str]
    group_name: Optional[str] = None
    navigation_rule: Optional[str] = "FREE_NAV"
    results_published: Optional[bool] = False
    use_ai_question: Optional[bool] = False


class ExamAnswerRequest(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    variant_question_id: Optional[int] = None
    variant_option_id: Optional[int] = None
    answer_text: Optional[str] = None


class TakeQuestionOptionResponse(BaseModel):
    id: int
    option_text: str
    order: int
    media_url: Optional[str] = None
    audio_url: Optional[str] = None
    variant_option_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class UserAnswerDetailResponse(BaseModel):
    selected_option_id: Optional[int] = None
    answer_text: Optional[str] = None


class TakeQuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: str
    order: int
    points: float
    media_url: Optional[str] = None
    audio_url: Optional[str] = None
    audio_play_limit: Optional[int] = 0
    user_answer: Optional[UserAnswerDetailResponse] = None
    options: List[TakeQuestionOptionResponse] = Field(default_factory=list)
    variant_question_id: Optional[int] = None
    version_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ExamTakeResponse(BaseModel):
    exam: ExamResponse
    remaining_seconds: int
    questions: List[TakeQuestionResponse] = Field(default_factory=list)
    version_code: Optional[str] = None


class ExamFeedbackRequest(BaseModel):
    feedback_comment: Optional[str] = None
    score: Optional[float] = None


class AnswerGradeRequest(BaseModel):
    is_correct: bool
    score: Optional[float] = None  # Partial score for this individual question

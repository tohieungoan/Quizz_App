from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

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

class ExamUpdateRequest(BaseModel):
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    timer: Optional[int] = None
    navigation_rule: Optional[str] = None
    results_published: Optional[bool] = None
    status: Optional[str] = None

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

    model_config = ConfigDict(from_attributes=True)

class ExamAssignDetailResponse(BaseModel):
    exam: ExamResponse
    assignees_count: int
    assignees: List[ExamAssigneeResponse]

class StudentExamResponse(BaseModel):
    id: int  # ID của ExamAssignee
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


class ExamAnswerRequest(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    answer_text: Optional[str] = None


class TakeQuestionOptionResponse(BaseModel):
    id: int
    option_text: str
    order: int

    model_config = ConfigDict(from_attributes=True)


class TakeQuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: str
    order: int
    points: float
    options: List[TakeQuestionOptionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ExamTakeResponse(BaseModel):
    exam: ExamResponse
    remaining_seconds: int
    questions: List[TakeQuestionResponse] = []

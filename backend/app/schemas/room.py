from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ----------------------------------------------------------------------
# Live Question & Option Schemas
# ----------------------------------------------------------------------
class OptionLive(BaseModel):
    id: int
    key: str  # A, B, C, D
    label: str

    model_config = ConfigDict(from_attributes=True)


class QuestionLive(BaseModel):
    id: int
    text: str
    type: Optional[str] = None
    time_limit: Optional[int] = None
    options: List[OptionLive]
    correct_option_key: Optional[str] = None
    audio_url: Optional[str] = None
    media_url: Optional[str] = None
    audio_play_limit: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# Room Core Schemas
# ----------------------------------------------------------------------
class RoomCreate(BaseModel):
    quiz_id: int
    group_id: Optional[int] = None
    title: Optional[str] = None
    mode: str = Field("CLASSIC", description="CLASSIC, TEAM, EXAM")
    progression_mode: str = Field("manual", description="manual, auto")
    allow_skip_question: bool = True
    allow_show_rank: bool = True
    allow_anonymous_question: bool = True
    allow_voice_question: bool = False
    use_ai_question: bool = False
    shuffle_options: bool = False


class RoomResponse(BaseModel):
    id: int
    quiz_id: int
    host_id: int
    group_id: Optional[int] = None
    room_code: Optional[str] = None
    qr_code_url: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    mode: str
    progression_mode: str
    allow_skip_question: bool
    allow_show_rank: bool
    allow_anonymous_question: bool
    allow_voice_question: bool
    use_ai_question: bool
    shuffle_options: bool
    expire_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    participants_count: int = 0
    current_question_index: int = 0
    current_question_started_at: Optional[datetime] = None
    active_question: Optional[QuestionLive] = None

    model_config = ConfigDict(from_attributes=True)


class RoomSettingsUpdate(BaseModel):
    progression_mode: Optional[str] = None
    allow_show_rank: Optional[bool] = None
    shuffle_options: Optional[bool] = None


# ----------------------------------------------------------------------
# Participant & Gameplay Schemas
# ----------------------------------------------------------------------
class ParticipantJoin(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50)


class ParticipantResponse(BaseModel):
    id: int
    room_id: int
    user_id: Optional[int] = None
    team_id: Optional[int] = None
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    status: Optional[str] = None
    joined_at: datetime
    score: float
    streak: int = 0

    model_config = ConfigDict(from_attributes=True)


class ParticipantLive(BaseModel):
    id: int
    nickname: str
    score: float
    streak: int = 0
    answered: bool

    model_config = ConfigDict(from_attributes=True)


class RoomLiveStatus(BaseModel):
    room_id: int
    room_code: str
    status: str
    current_question_index: int
    current_question_started_at: Optional[datetime] = None
    quiz_title: str
    total_questions: int
    active_question: Optional[QuestionLive] = None
    participants: List[ParticipantLive]
    answer_distribution: dict[str, int]  # Option key (A, B, C, D) -> count of answers


class SubmitAnswerIn(BaseModel):
    participant_id: int
    question_id: int
    selected_option_id: Optional[int] = None
    answer_text: Optional[str] = None
    active_power_up: Optional[str] = None
    streak: Optional[int] = None


class SubmitAnswerResponse(BaseModel):
    is_correct: bool
    score: float
    total_score: float = 0.0
    correct_option_key: Optional[str] = None  # A, B, C, D


# ----------------------------------------------------------------------
# Admin Dashboard Schemas
# ----------------------------------------------------------------------
class RoomAdminResponse(BaseModel):
    id: int
    title: str
    room_code: str
    host_name: str
    quiz_title: str
    status: str
    participantCount: int
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RoomAdminPageResponse(BaseModel):
    data: List[RoomAdminResponse]
    total: int
    pageIndex: int
    pageSize: int
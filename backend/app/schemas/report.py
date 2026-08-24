from typing import List, Optional
from pydantic import BaseModel

class ReportMetrics(BaseModel):
    avg_score: float
    total_participants: int
    total_questions: int

class ReportListItem(BaseModel):
    id: int
    type: str  # "ROOM" or "EXAM"
    room_code: str
    quiz_title: str
    room_title: str
    host: str
    date: str
    participants: int
    avg_score: str  # Format: "78.5%"

class ReportPageResponse(BaseModel):
    data: List[ReportListItem]
    total: int
    pageIndex: int
    pageSize: int

class ReportParticipant(BaseModel):
    id: str
    user_id: Optional[str] = None
    nickname: str
    status: str
    joined_at: Optional[str] = None
    score: float
    time_taken: str = "N/A"
    correct_answers: str = "0/0"  # e.g. "8/10"
    accuracy: str = "0%"  # e.g. "80.0%"
    rank: int = 0
    version_code: Optional[str] = None

class ReportParticipantPageResponse(BaseModel):
    data: List[ReportParticipant]
    total: int
    pageIndex: int
    pageSize: int

class ReportQuestionAnalysis(BaseModel):
    id: int
    original_question_id: Optional[int] = None
    version_code: Optional[str] = None
    question: str
    correct: int
    incorrect: int
    rate: float
    difficulty: str = "Medium"

class ReportQuestionPageResponse(BaseModel):
    data: List[ReportQuestionAnalysis]
    total: int
    pageIndex: int
    pageSize: int

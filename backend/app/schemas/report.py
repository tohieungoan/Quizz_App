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

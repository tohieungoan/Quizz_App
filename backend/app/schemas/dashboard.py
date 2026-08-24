from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import date


class DashboardMetrics(BaseModel):
    total_quizzes: int
    total_users: int
    active_rooms: int
    avg_score: float


class HottestQuiz(BaseModel):
    quiz_id: int
    title: str
    play_count: int


class RoomDistribution(BaseModel):
    game_mode: int
    exam_mode: int


class TopActiveRoom(BaseModel):
    id: int
    room_code: str
    quiz_title: str
    host_name: str
    host_avatar: Optional[str] = None
    participant_count: int
    status: str


class EngagementData(BaseModel):
    date: str
    room_count: int


class DashboardOverviewResponse(BaseModel):
    metrics: DashboardMetrics
    hottest_quizzes: List[HottestQuiz]
    room_distribution: RoomDistribution
    top_active_rooms: List[TopActiveRoom]
    engagement_history: List[EngagementData]

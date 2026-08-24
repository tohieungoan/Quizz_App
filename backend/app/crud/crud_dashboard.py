from sqlalchemy.orm import Session
from sqlalchemy import func, desc, Float, case, cast, Date

from app.models.quiz import Quiz
from app.models.user import User
from app.models.room import Room, Participant, ParticipantAnswer
from app.crud.crud_room import crud_room
from app.schemas.dashboard import (
    DashboardOverviewResponse, 
    DashboardMetrics, 
    HottestQuiz, 
    RoomDistribution, 
    TopActiveRoom
)

class CRUDDashboard:
    def get_overview(self, db: Session) -> DashboardOverviewResponse:
        # Automatically clean up stale / expired rooms before aggregating metrics
        crud_room.auto_end_stale_rooms(db)

        # 1. Dashboard Metrics
        total_quizzes = db.query(func.count(Quiz.id)).scalar() or 0
        total_users = db.query(func.count(User.id)).scalar() or 0
        active_rooms = db.query(func.count(Room.id)).filter(Room.status.in_(["PLAYING", "RUNNING", "WAITING"])).scalar() or 0
        
        # Avg score based on ParticipantAnswer is_correct percentage
        answer_stats = db.query(
            func.count(ParticipantAnswer.id).label("total"),
            func.sum(case((ParticipantAnswer.is_correct == True, 1), else_=0)).label("correct")
        ).first()
        
        total_answers = answer_stats.total if answer_stats and answer_stats.total else 0
        correct_answers = answer_stats.correct if answer_stats and answer_stats.correct else 0
        
        avg_score = (correct_answers / total_answers * 100) if total_answers > 0 else 0.0

        # 2. Hottest Quizzes (Top 5 quizzes by number of rooms created)
        hottest_query = (
            db.query(
                Quiz.id.label("quiz_id"),
                Quiz.title.label("title"),
                func.count(Room.id).label("play_count")
            )
            .join(Room, Quiz.id == Room.quiz_id)
            .group_by(Quiz.id)
            .order_by(desc("play_count"))
            .limit(5)
            .all()
        )
        hottest_quizzes = [
            {"quiz_id": row.quiz_id, "title": row.title or "Untitled Quiz", "play_count": row.play_count}
            for row in hottest_query
        ]

        # 3. Room Distribution (Game vs Exam Mode)
        mode_counts = (
            db.query(
                Room.mode,
                func.count(Room.id).label("total_rooms")
            )
            .group_by(Room.mode)
            .all()
        )
        
        game_mode = 0
        exam_mode = 0
        for mode_row in mode_counts:
            if mode_row.mode == "GAME":
                game_mode = mode_row.total_rooms
            elif mode_row.mode == "EXAM":
                exam_mode = mode_row.total_rooms

        # 4. Top Active Rooms (Top 5 RUNNING rooms ordered by participant count)
        top_rooms_query = (
            db.query(
                Room.id,
                Room.room_code,
                Quiz.title.label("quiz_title"),
                User.fullname.label("host_name"),
                User.avatar.label("host_avatar"),
                func.count(Participant.id).label("participant_count"),
                Room.status
            )
            .join(Quiz, Room.quiz_id == Quiz.id)
            .join(User, Room.host_id == User.id)
            .outerjoin(Participant, Room.id == Participant.room_id)
            .filter(Room.status.in_(["PLAYING", "RUNNING", "WAITING"]))
            .group_by(Room.id, Quiz.title, User.fullname, User.avatar)
            .order_by(desc("participant_count"))
            .limit(5)
            .all()
        )
        
        top_active_rooms = [
            {
                "id": row.id,
                "room_code": row.room_code or "",
                "quiz_title": row.quiz_title or "",
                "host_name": row.host_name or "",
                "host_avatar": row.host_avatar or None,
                "participant_count": row.participant_count,
                "status": row.status or "RUNNING"
            }
            for row in top_rooms_query
        ]

        # 5. Engagement History (Last 7 days room creation)
        from datetime import datetime, timedelta
        
        today = datetime.utcnow().date()
        seven_days_ago = today - timedelta(days=6)
        
        history_query = (
            db.query(
                cast(Room.created_at, Date).label("date"),
                func.count(Room.id).label("room_count")
            )
            .filter(Room.created_at >= seven_days_ago)
            .group_by(cast(Room.created_at, Date))
            .order_by(cast(Room.created_at, Date))
            .all()
        )
        
        engagement_map = {str(row.date): row.room_count for row in history_query}
        engagement_history = []
        
        for i in range(7):
            current_date = seven_days_ago + timedelta(days=i)
            date_str = str(current_date)
            engagement_history.append({
                "date": date_str[-5:], # Format MM-DD for frontend
                "room_count": engagement_map.get(date_str, 0)
            })

        return DashboardOverviewResponse(
            metrics=DashboardMetrics(
                total_quizzes=total_quizzes,
                total_users=total_users,
                active_rooms=active_rooms,
                avg_score=round(avg_score, 1)
            ),
            hottest_quizzes=[HottestQuiz(**hq) for hq in hottest_quizzes],
            room_distribution=RoomDistribution(
                game_mode=game_mode,
                exam_mode=exam_mode
            ),
            top_active_rooms=[TopActiveRoom(**tr) for tr in top_active_rooms],
            engagement_history=engagement_history
        )

crud_dashboard = CRUDDashboard()

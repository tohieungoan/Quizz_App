from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from app.models.room import Room, Participant
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.room import RoomAdminPageResponse, RoomAdminResponse

class CRUDRoom:
    def get_admin_rooms(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[str] = None
    ) -> RoomAdminPageResponse:
        """
        Get all rooms for the Admin dashboard with pagination, search, and filtering.
        Calculates participantCount using outer join.
        """
        # Base query joining Room, Quiz, User, and counting Participants
        query = db.query(
            Room.id,
            Room.room_code,
            Room.status,
            Room.created_at.label("started_at"),
            Room.ended_at,
            Quiz.title.label("quiz_title"),
            User.fullname.label("host_name"),
            func.count(Participant.id).label("participant_count")
        ).join(
            Quiz, Room.quiz_id == Quiz.id
        ).join(
            User, Room.host_id == User.id
        ).outerjoin(
            Participant, Room.id == Participant.room_id
        )

        # Apply Status Filter
        if status and status.upper() != "ALL":
            query = query.filter(Room.status == status.upper())

        # Apply Search Filter (room_code, quiz_title, host_name)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Room.room_code.ilike(search_term),
                    Quiz.title.ilike(search_term),
                    User.fullname.ilike(search_term)
                )
            )

        # Group by Room, Quiz, User to count properly
        query = query.group_by(
            Room.id,
            Quiz.id,
            User.id
        )

        # Total count query (subquery is safer when grouping)
        total_query = db.query(func.count(Room.id))
        
        if status and status.upper() != "ALL":
            total_query = total_query.filter(Room.status == status.upper())
            
        if search:
            search_term = f"%{search}%"
            # Need joins to filter by Quiz/User in total count too
            total_query = total_query.join(Quiz, Room.quiz_id == Quiz.id).join(User, Room.host_id == User.id)
            total_query = total_query.filter(
                or_(
                    Room.room_code.ilike(search_term),
                    Quiz.title.ilike(search_term),
                    User.fullname.ilike(search_term)
                )
            )
            
        total = total_query.scalar() or 0

        # Apply sorting and pagination
        query = query.order_by(desc(Room.created_at))
        if limit > 0:
            query = query.offset(skip).limit(limit)

        results = query.all()
        
        # Map to Schema
        mapped_results = []
        for r in results:
            mapped_results.append(RoomAdminResponse(
                id=r.id,
                # For `title`, fallback to quiz_title if Room doesn't have a specific title field
                title=f"Room {r.room_code}", 
                room_code=r.room_code,
                host_name=r.host_name or "Unknown",
                quiz_title=r.quiz_title or "Unknown",
                status=r.status or "WAITING",
                participantCount=r.participant_count or 0,
                started_at=r.started_at,
                ended_at=r.ended_at
            ))

        return RoomAdminPageResponse(
            data=mapped_results,
            total=total,
            pageIndex=(skip // limit) + 1 if limit > 0 else 1,
            pageSize=limit
        )

crud_room = CRUDRoom()

import datetime
import random
from typing import List, Optional, Tuple

from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.models.quiz import Quiz
from app.models.room import Participant, Room
from app.models.user import User
from app.schemas.room import (
    RoomAdminPageResponse,
    RoomAdminResponse,
    RoomCreate,
    RoomSettingsUpdate,
)


class CRUDRoom:
    def get(self, db: Session, room_id: int) -> Optional[Room]:
        """Get room by ID."""
        return db.query(Room).filter(Room.id == room_id).first()

    def get_by_code(self, db: Session, room_code: str) -> Optional[Room]:
        """
        Get active room by code (status is not ENDED).
        This is useful for players attempting to join a room.
        """
        return db.query(Room).filter(
            Room.room_code == room_code,
            Room.status != "ENDED"
        ).first()

    def get_all_by_code(self, db: Session, room_code: str) -> Optional[Room]:
        """Get any room by code, regardless of status."""
        return db.query(Room).filter(Room.room_code == room_code).first()

    def generate_unique_room_code(self, db: Session) -> str:
        """
        Generate a unique 6-digit room code.
        Ensures the code is unique among all currently active rooms (status != ENDED).
        """
        max_attempts = 100
        for _ in range(max_attempts):
            code = str(random.randint(100000, 999999))
            # Check if there is an active room with this code
            exists = db.query(Room).filter(
                Room.room_code == code,
                Room.status != "ENDED"
            ).first()
            if not exists:
                return code
        
        # Fallback in case collision rate is extremely high
        raise ValueError("Could not generate a unique room code. Please try again.")

    def create_room(self, db: Session, obj_in: RoomCreate, host_id: int) -> Room:
        """Create a new live quiz room."""
        # Generate unique room code
        room_code = self.generate_unique_room_code(db)
        
        # Default qr_code_url using a free QR code generator API
        qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={room_code}"

        # Generate a default title if not provided
        title = obj_in.title or f"Live Quiz Room {room_code}"

        db_obj = Room(
            quiz_id=obj_in.quiz_id,
            host_id=host_id,
            group_id=obj_in.group_id,
            room_code=room_code,
            qr_code_url=qr_code_url,
            title=title,
            status="WAITING",  # Default status is WAITING (Lobby)
            mode=obj_in.mode,
            progression_mode=obj_in.progression_mode,
            allow_skip_question=obj_in.allow_skip_question,
            allow_show_rank=obj_in.allow_show_rank,
            allow_anonymous_question=obj_in.allow_anonymous_question,
            allow_voice_question=obj_in.allow_voice_question,
            use_ai_question=obj_in.use_ai_question,
            shuffle_options=obj_in.shuffle_options
        )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_status(self, db: Session, room: Room, status: str) -> Room:
        """Update room status (e.g. WAITING -> PLAYING -> ENDED)."""
        room.status = status
        if status == "ENDED":
            room.ended_at = datetime.datetime.utcnow()
            
        db.add(room)
        db.commit()
        db.refresh(room)
        return room

    def join_room(self, db: Session, room: Room, nickname: str, user_id: Optional[int] = None) -> Participant:
        """
        Join a participant to a live room.
        Supports reconnecting if the same user joins again.
        Raises ValueError if nickname is already taken in the active room.
        """
        # 1. If user is authenticated, check if they have already joined this room
        if user_id is not None:
            existing_user = db.query(Participant).filter(
                Participant.room_id == room.id,
                Participant.user_id == user_id
            ).first()
            if existing_user:
                existing_user.status = "JOINED"
                db.add(existing_user)
                db.commit()
                db.refresh(existing_user)
                return existing_user

        # 2. Check if nickname is already taken in this room
        existing_nickname = db.query(Participant).filter(
            Participant.room_id == room.id,
            Participant.nickname.ilike(nickname)
        ).first()
        
        if existing_nickname:
            raise ValueError(f"Nickname '{nickname}' is already taken in this room.")

        # 3. Create new participant
        participant = Participant(
            room_id=room.id,
            user_id=user_id,
            nickname=nickname,
            status="JOINED",
            score=0.0
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)
        return participant

    def next_question(self, db: Session, room: Room) -> Room:
        """
        Advance room to the next question.
        If current status is WAITING, start the game (status=PLAYING, question_index=1).
        If current status is PLAYING, increment question_index.
        If index exceeds total questions, end the session (status=ENDED).
        """
        total_questions = len(room.quiz.questions) if room.quiz else 0
        
        if room.status == "WAITING":
            room.status = "PLAYING"
            room.current_question_index = 1
            room.current_question_started_at = datetime.datetime.utcnow()
        elif room.status == "PLAYING":
            if room.current_question_index < total_questions:
                room.current_question_index += 1
                room.current_question_started_at = datetime.datetime.utcnow()
            else:
                room.status = "ENDED"
                room.ended_at = datetime.datetime.utcnow()
                
        db.add(room)
        db.commit()
        db.refresh(room)
        return room

    def submit_answer(
        self,
        db: Session,
        room: Room,
        participant: Participant,
        question_id: int,
        selected_option_id: int,
        now: datetime.datetime
    ) -> Tuple[bool, float, Optional[str]]:
        """
        Submit participant's answer to the active question.
        Validates timeouts, calculates dynamic scores based on speed,
        and aggregates participant score.
        """
        from app.models.quiz import Question, QuestionOption
        from app.models.room import ParticipantAnswer
        
        # 1. Verify if participant already answered this question
        existing_answer = db.query(ParticipantAnswer).filter(
            ParticipantAnswer.participant_id == participant.id,
            ParticipantAnswer.question_id == question_id
        ).first()
        if existing_answer:
            raise ValueError("You have already submitted an answer for this question.")

        # 2. Get Question and Options
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise ValueError("Question not found.")

        options = db.query(QuestionOption).filter(QuestionOption.question_id == question_id).all()
        selected_option = next((o for o in options if o.id == selected_option_id), None)
        if not selected_option:
            raise ValueError("Selected option is invalid for this question.")

        # 3. Check Timeout
        is_timeout = False
        time_limit = question.time_limit or 20  # default 20s
        if room.current_question_started_at:
            elapsed_seconds = (now - room.current_question_started_at).total_seconds()
            if elapsed_seconds > time_limit:
                is_timeout = True

        # 4. Determine correctness and calculate score
        is_correct = selected_option.is_correct or False
        score = 0.0

        if is_correct and not is_timeout:
            # Score formula: 500 + 500 * (1 - elapsed / time_limit)
            elapsed_seconds = max(0.0, (now - room.current_question_started_at).total_seconds())
            ratio = elapsed_seconds / time_limit
            score = 500.0 + 500.0 * (1.0 - min(ratio, 1.0))
            score = round(score, 2)

        # 5. Save ParticipantAnswer
        db_answer = ParticipantAnswer(
            participant_id=participant.id,
            question_id=question_id,
            selected_option_id=selected_option_id,
            is_correct=is_correct,
            score=score,
            answered_at=now
        )
        db.add(db_answer)

        # 6. Aggregate score to Participant
        participant.score += score
        db.add(participant)

        db.commit()
        db.refresh(participant)

        # Get correct option key (A, B, C, D)
        KEYS = ["A", "B", "C", "D"]
        sorted_options = sorted(options, key=lambda o: o.id)
        correct_option_key = None
        for idx, opt in enumerate(sorted_options):
            if opt.is_correct:
                correct_option_key = KEYS[idx] if idx < len(KEYS) else "A"
                break

        return is_correct, score, correct_option_key

    def update_settings(self, db: Session, room: Room, obj_in: RoomSettingsUpdate) -> Room:
        """Update live room settings (e.g. progression_mode, allow_show_rank, shuffle_options)."""
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(room, field, value)
        
        db.add(room)
        db.commit()
        db.refresh(room)
        return room

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

        # Total count query
        total_query = db.query(func.count(Room.id))
        
        if status and status.upper() != "ALL":
            total_query = total_query.filter(Room.status == status.upper())
            
        if search:
            search_term = f"%{search}%"
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
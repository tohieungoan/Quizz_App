import datetime
import random
import urllib.parse
from typing import List, Optional, Tuple

from app.core.config import settings

from sqlalchemy import desc, func, or_, and_
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
    def auto_end_stale_rooms(self, db: Session) -> int:
        """
        Auto-end any rooms that are stale or expired across the entire platform:
        1. Rooms whose expire_at has passed (expire_at <= now)
        2. WAITING rooms created > 15 minutes ago
        3. PLAYING/RUNNING rooms created > 4 hours ago (abandoned games)
        """
        now = datetime.datetime.utcnow()
        waiting_cutoff = now - datetime.timedelta(minutes=15)
        playing_cutoff = now - datetime.timedelta(hours=4)
        
        stale_rooms = db.query(Room).filter(
            Room.status != "ENDED",
            or_(
                and_(Room.expire_at.isnot(None), Room.expire_at <= now),
                and_(Room.status == "WAITING", Room.created_at <= waiting_cutoff),
                and_(Room.status.in_(["PLAYING", "RUNNING"]), Room.created_at <= playing_cutoff)
            )
        ).all()
        
        count = 0
        for r in stale_rooms:
            r.status = "ENDED"
            r.ended_at = now
            db.add(r)
            count += 1
            
        if count > 0:
            db.commit()
            
        return count

    def check_and_auto_end_room(self, db: Session, room: Optional[Room]) -> Optional[Room]:
        """
        If room is not ENDED and is stale/expired, auto-end it immediately.
        """
        if room and room.status != "ENDED":
            now = datetime.datetime.utcnow()
            is_stale = False
            
            if room.expire_at and room.expire_at <= now:
                is_stale = True
            elif room.status == "WAITING" and (now - room.created_at) > datetime.timedelta(minutes=15):
                is_stale = True
            elif room.status in ["PLAYING", "RUNNING"] and (now - room.created_at) > datetime.timedelta(hours=4):
                is_stale = True
                
            if is_stale:
                room.status = "ENDED"
                room.ended_at = now
                db.add(room)
                db.commit()
                db.refresh(room)
        return room

    def get(self, db: Session, room_id: int) -> Optional[Room]:
        """Get room by ID."""
        room = db.query(Room).filter(Room.id == room_id).first()
        return self.check_and_auto_end_room(db, room)

    def get_by_code(self, db: Session, room_code: str) -> Optional[Room]:
        """
        Get active room by code (status is not ENDED and not expired).
        This is useful for players attempting to join a room.
        """
        now = datetime.datetime.utcnow()
        room = db.query(Room).filter(
            Room.room_code == room_code,
            Room.status != "ENDED",
            or_(Room.expire_at.is_(None), Room.expire_at > now)
        ).first()
        return self.check_and_auto_end_room(db, room)

    def get_all_by_code(self, db: Session, room_code: str) -> Optional[Room]:
        """Get any room by code, regardless of status."""
        room = db.query(Room).filter(Room.room_code == room_code).first()
        return self.check_and_auto_end_room(db, room)

    def generate_unique_room_code(self, db: Session) -> str:
        """
        Generate a unique 6-digit room code.
        Ensures the code is unique among all currently active and unexpired rooms.
        """
        max_attempts = 100
        now = datetime.datetime.utcnow()
        for _ in range(max_attempts):
            code = str(random.randint(100000, 999999))
            # Check if there is an active and unexpired room with this code
            exists = db.query(Room).filter(
                Room.room_code == code,
                Room.status != "ENDED",
                or_(Room.expire_at.is_(None), Room.expire_at > now)
            ).first()
            if not exists:
                return code
        
        # Fallback in case collision rate is extremely high
        raise ValueError("Could not generate a unique room code. Please try again.")

    def create_room(self, db: Session, obj_in: RoomCreate, host_id: int) -> Room:
        """Create a new live quiz room with a 2-hour expiration limit."""
        # Generate unique room code
        room_code = self.generate_unique_room_code(db)
        
        # Default qr_code_url using the full frontend lobby join link
        lobby_url = f"{settings.FRONTEND_URL}/lobby?roomCode={room_code}"
        encoded_url = urllib.parse.quote(lobby_url)
        qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={encoded_url}"

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
            shuffle_options=obj_in.shuffle_options,
            expire_at=datetime.datetime.utcnow() + datetime.timedelta(hours=2)
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
        # 0. Check group restriction if room is assigned to a target group
        if room.group_id is not None:
            if user_id is None:
                raise ValueError("This room is restricted to group members only. Please log in first.")
            
            from app.models.group import Group, GroupMember
            group = db.query(Group).filter(Group.id == room.group_id).first()
            if not group:
                raise ValueError("Associated group not found.")
            
            if group.owner_id != user_id:
                is_member = db.query(GroupMember).filter(
                    GroupMember.group_id == room.group_id,
                    GroupMember.user_id == user_id,
                    GroupMember.status == "APPROVED"
                ).first()
                if not is_member:
                    raise ValueError("You are not an approved member of this study group.")

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
        selected_option_id: Optional[int] = None,
        answer_text: Optional[str] = None,
        active_power_up: Optional[str] = None,
        client_streak: Optional[int] = None,
        now: Optional[datetime.datetime] = None
    ) -> Tuple[bool, float, float, Optional[str]]:
        """
        Submit participant's answer to the active question.
        Supports both MULTIPLE_CHOICE (using selected_option_id) and SHORT_ANSWER (using answer_text).
        Validates timeouts, calculates dynamic scores based on speed, streak bonus, and aggregates participant score.
        """
        if now is None:
            now = datetime.datetime.utcnow()
            
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
        raw_type = (question.type or "multiple_choice").lower().strip()
        is_short_answer = raw_type in ["short_answer", "short answer", "short", "fill in the blank", "fill_in_the_blank", "fill_in"]

        selected_option = None
        is_correct = False

        if is_short_answer:
            if answer_text:
                match_text = answer_text.strip().lower()
                for opt in options:
                    if opt.is_correct and opt.content and opt.content.strip().lower() == match_text:
                        selected_option = opt
                        is_correct = True
                        break
                if not selected_option and options:
                    selected_option = options[0]
        else:
            if selected_option_id is not None:
                selected_option = next((o for o in options if o.id == selected_option_id), None)
                if not selected_option:
                    raise ValueError("Selected option is invalid for this question.")
                is_correct = selected_option.is_correct or False
            else:
                is_correct = False

        # 3. Check Timeout
        is_timeout = False
        time_limit = question.time_limit or 20  # default 20s
        if room.current_question_started_at:
            elapsed_seconds = (now - room.current_question_started_at).total_seconds()
            if elapsed_seconds > time_limit:
                is_timeout = True

        current_streak = participant.streak if participant.streak is not None else (client_streak or 0)

        # 4. Calculate dynamic score (max 1000, min 500) + speed order bonus (1st: +100, 2nd & 3rd: +50) + streak bonus (streak * 10)
        score = 0.0
        if is_correct and not is_timeout:
            new_streak = current_streak + 1
            participant.streak = new_streak

            elapsed_seconds = max(0.0, (now - room.current_question_started_at).total_seconds()) if room.current_question_started_at else 0.0
            ratio = elapsed_seconds / time_limit
            # Base score ranges from 1000 down to 500
            base_score = 500.0 + 500.0 * (1.0 - min(ratio, 1.0))

            # Count how many participants ALREADY answered correctly for this question in this room
            correct_count = db.query(func.count(ParticipantAnswer.id)).join(
                Participant, ParticipantAnswer.participant_id == Participant.id
            ).filter(
                Participant.room_id == room.id,
                ParticipantAnswer.question_id == question_id,
                ParticipantAnswer.is_correct == True
            ).scalar() or 0

            # Order bonus: 1st person -> +100, 2nd & 3rd person -> +50, 4th+ -> +0
            if correct_count == 0:
                speed_bonus = 100.0
            elif correct_count in (1, 2):
                speed_bonus = 50.0
            else:
                speed_bonus = 0.0

            # Streak bonus: +10 per streak count (e.g. 7th streak = +70 pts)
            streak_bonus = new_streak * 10.0

            raw_score = base_score + speed_bonus + streak_bonus

            # Power-up bonus: double points
            if active_power_up == 'double':
                raw_score *= 2.0

            score = round(raw_score, 2)
        else:
            if active_power_up == 'shield':
                participant.streak = current_streak
            else:
                participant.streak = 0

        # 5. Save ParticipantAnswer
        db_answer = ParticipantAnswer(
            participant_id=participant.id,
            question_id=question_id,
            selected_option_id=selected_option.id if selected_option else None,
            answer_text=answer_text,
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

        # Get correct answer explanation to send back
        correct_option_key = None
        if is_short_answer:
            correct_opt = next((o for o in options if o.is_correct), None)
            correct_option_key = correct_opt.content if correct_opt else None
        else:
            KEYS = ["A", "B", "C", "D"]
            sorted_options = sorted(options, key=lambda o: o.id)
            for idx, opt in enumerate(sorted_options):
                if opt.is_correct:
                    correct_option_key = KEYS[idx] if idx < len(KEYS) else "A"
                    break

        return is_correct, score, participant.score, correct_option_key

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
        # Automatically clean up stale rooms first
        self.auto_end_stale_rooms(db)

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
            st_up = status.upper()
            if st_up in ["RUNNING", "PLAYING"]:
                query = query.filter(Room.status.in_(["RUNNING", "PLAYING"]))
            elif st_up in ["FINISHED", "ENDED"]:
                query = query.filter(Room.status.in_(["FINISHED", "ENDED"]))
            else:
                query = query.filter(Room.status == st_up)

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
            st_up = status.upper()
            if st_up in ["RUNNING", "PLAYING"]:
                total_query = total_query.filter(Room.status.in_(["RUNNING", "PLAYING"]))
            elif st_up in ["FINISHED", "ENDED"]:
                total_query = total_query.filter(Room.status.in_(["FINISHED", "ENDED"]))
            else:
                total_query = total_query.filter(Room.status == st_up)
            
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

    def leave_room(self, db: Session, participant_id: int) -> bool:
        """Remove a participant from the room."""
        participant = db.query(Participant).filter(Participant.id == participant_id).first()
        if participant:
            db.delete(participant)
            db.commit()
            return True
        return False


crud_room = CRUDRoom()
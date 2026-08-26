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

    def get_by_code_for_update(self, db: Session, room_code: str) -> Optional[Room]:
        """Lock an active room while a participant is being admitted."""
        now = datetime.datetime.utcnow()
        room = db.query(Room).filter(
            Room.room_code == room_code,
            Room.status != "ENDED",
            or_(Room.expire_at.is_(None), Room.expire_at > now),
        ).with_for_update().first()
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

    def create_room(
        self,
        db: Session,
        obj_in: RoomCreate,
        host_id: int,
        variant_set_id: Optional[int] = None,
    ) -> Room:
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
            variant_set_id=variant_set_id,
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

        # 2. Check if nickname matches an existing participant in this room
        existing_nickname = db.query(Participant).filter(
            Participant.room_id == room.id,
            Participant.nickname.ilike(nickname)
        ).first()
        
        if existing_nickname:
            if existing_nickname.user_id is None and user_id is None:
                # If a new unauthenticated guest joins with a duplicate nickname, append a 4-digit code to generate a unique guest nickname
                suffix = str(random.randint(1000, 9999))
                nickname = f"{nickname}_{suffix}"
            elif room.status != "WAITING":
                existing_nickname.status = "JOINED"
                db.add(existing_nickname)
                db.commit()
                db.refresh(existing_nickname)
                return existing_nickname
            else:
                raise ValueError(f"Nickname '{nickname}' is already taken in this room.")

        # 3. If new participant is joining, verify room is not locked and status is WAITING
        if getattr(room, "is_locked", False):
            raise ValueError("This room has been locked by the host. New participants cannot join.")
        if room.status != "WAITING":
            raise ValueError(f"Cannot join room: The quiz session has already started or ended (status: {room.status}).")

        # 4. Create new participant
        participant = Participant(
            room_id=room.id,
            user_id=user_id,
            nickname=nickname,
            status="JOINED",
            score=0.0
        )
        db.add(participant)
        db.flush()

        # If room has a variant_set_id, assign a balanced variant immediately
        if room.variant_set_id:
            from app.models.quiz_variant import QuizVariantSet
            from app.services.quiz_variant_service import quiz_variant_service
            variant_set = db.query(QuizVariantSet).filter(QuizVariantSet.id == room.variant_set_id).first()
            if variant_set and variant_set.status == "READY":
                ready_vars = quiz_variant_service.ready_variants(variant_set)
                if ready_vars:
                    all_participants = db.query(Participant).filter(Participant.room_id == room.id).all()
                    try:
                        quiz_variant_service.assign_balanced(all_participants, ready_vars)
                    except Exception:
                        pass

        db.commit()
        db.refresh(participant)
        return participant

    def kick_participant(self, db: Session, room: Room, participant_id: int) -> Participant:
        """
        Kick/Remove a participant from the room.
        """
        participant = db.query(Participant).filter(
            Participant.room_id == room.id,
            Participant.id == participant_id
        ).first()
        if not participant:
            raise ValueError(f"Participant with ID {participant_id} not found in this room.")
        
        db.delete(participant)
        db.commit()
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
        is_skipped: bool = False,
        now: Optional[datetime.datetime] = None
    ) -> Tuple[bool, float, float, Optional[str]]:
        """
        Submit participant's answer to the active question.
        Supports both MULTIPLE_CHOICE (using selected_option_id) and SHORT_ANSWER (using answer_text).
        Validates timeouts, calculates dynamic scores based on speed, streak bonus, and aggregates participant score.
        If is_skipped is True (or active_power_up == 'skip'), score is 0 but winning streak is preserved intact.
        """
        if now is None:
            now = datetime.datetime.utcnow()
            
        from app.models.quiz import Question, QuestionOption
        from app.models.quiz_variant import QuizVariantOption, QuizVariantQuestion
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
        if question.quiz_id != room.quiz_id:
            raise ValueError("Question does not belong to this room's quiz.")
        ordered_questions = sorted(room.quiz.questions, key=lambda item: (item.position, item.id))
        active_question = (
            ordered_questions[room.current_question_index - 1]
            if 1 <= room.current_question_index <= len(ordered_questions)
            else None
        )
        if active_question is None or active_question.id != question_id:
            raise ValueError("This question is not currently active.")

        options = db.query(QuestionOption).filter(QuestionOption.question_id == question_id).all()
        raw_type = (question.type or "multiple_choice").lower().strip()
        is_short_answer = raw_type in ["short_answer", "short answer", "short", "fill in the blank", "fill_in_the_blank", "fill_in"]

        selected_option = None
        selected_variant_option = None
        variant_question = None
        is_correct = False
        is_skip_action = bool(is_skipped or active_power_up == 'skip' or (selected_option_id is None and answer_text is None))

        if getattr(room, "use_ai_question", False) and participant.quiz_variant_id:
            variant_question = db.query(QuizVariantQuestion).filter(
                QuizVariantQuestion.quiz_variant_id == participant.quiz_variant_id,
                QuizVariantQuestion.original_question_id == question_id,
            ).first()
            if not variant_question:
                raise ValueError("Question is unavailable in your assigned quiz version.")

        if not is_skip_action:
            if variant_question:
                variant_options = list(variant_question.options)
                variant_type = (variant_question.type or question.type or "").lower().strip()
                is_short_answer = variant_type in [
                    "short_answer", "short answer", "short", "fill in the blank",
                    "fill_in_the_blank", "fill_in",
                ]
                if is_short_answer:
                    normalized = (answer_text or "").strip().casefold()
                    selected_variant_option = next(
                        (
                            option for option in variant_options
                            if option.is_correct
                            and normalized == (option.content or "").strip().casefold()
                        ),
                        None,
                    )
                    is_correct = selected_variant_option is not None
                elif selected_option_id is not None:
                    try:
                        target_option_id = int(selected_option_id)
                    except (ValueError, TypeError):
                        target_option_id = selected_option_id
                    selected_variant_option = db.query(QuizVariantOption).filter(
                        QuizVariantOption.id == target_option_id,
                        QuizVariantOption.variant_question_id == variant_question.id,
                    ).first()
                    if not selected_variant_option:
                        raise ValueError("Selected option is invalid for your assigned quiz version.")
                    is_correct = bool(selected_variant_option.is_correct)
            elif is_short_answer:
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
                    try:
                        target_opt_id = int(selected_option_id)
                    except (ValueError, TypeError):
                        target_opt_id = selected_option_id
                    selected_option = next((o for o in options if o.id == target_opt_id), None)
                    if not selected_option:
                        raise ValueError("Selected option is invalid for this question.")
                    is_correct = bool(selected_option.is_correct)
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

        # 4. Calculate dynamic score + streak bonus
        if is_correct and not is_timeout and not is_skip_action:
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

            speed_bonus = 0.0
            if correct_count == 0:
                speed_bonus = 100.0
            elif correct_count < 3:
                speed_bonus = 50.0

            streak_bonus = float(new_streak * 10)
            raw_score = base_score + speed_bonus + streak_bonus
            if active_power_up == 'double':
                raw_score *= 2.0
            score = float(round(raw_score))
        else:
            if active_power_up == 'shield' or active_power_up == 'skip' or is_skip_action:
                participant.streak = current_streak
            else:
                participant.streak = 0
            score = 0.0

        # Create or Record Answer
        pa = ParticipantAnswer(
            participant_id=participant.id,
            question_id=question_id,
            selected_option_id=selected_option.id if selected_option else None,
            variant_question_id=variant_question.id if variant_question else None,
            variant_option_id=selected_variant_option.id if selected_variant_option else None,
            answer_text=answer_text,
            is_correct=is_correct,
            score=score,
            answered_at=now
        )
        db.add(pa)

        # Update participant aggregate score
        participant.score = float(round(participant.score + score))
        db.add(participant)

        db.commit()
        db.refresh(participant)

        # Determine the correct answer key to send back (Suppressed in EXAM mode).
        correct_option_key = None
        if room.mode == "EXAM":
            correct_option_key = None
        elif is_short_answer:
            answer_options = list(variant_question.options) if variant_question else options
            correct_opt = next((o for o in answer_options if o.is_correct), None)
            correct_option_key = correct_opt.content if correct_opt else None
        elif variant_question:
            keys = [chr(ord("A") + index) for index in range(20)]
            sorted_options = sorted(
                variant_question.options,
                key=lambda option: (option.position, option.id),
            )
            for index, option in enumerate(sorted_options):
                if option.is_correct:
                    correct_option_key = keys[index] if index < len(keys) else str(index + 1)
                    break
        else:
            from app.utils.option_utils import format_question_options, get_shuffle_seed
            should_shuffle = bool(getattr(room, "shuffle_options", False) or (room.quiz and getattr(room.quiz, "shuffle_options", False)))
            seed = get_shuffle_seed(room.id, question_id, participant.nickname) if should_shuffle else None
            _, correct_option_key = format_question_options(
                options=options,
                should_shuffle=should_shuffle,
                seed=seed
            )

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
        Calculates participant_count using an outer join.
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
            User.avatar.label("host_avatar"),
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
                host_avatar=r.host_avatar or None,
                quiz_title=r.quiz_title or "Unknown",
                status=r.status or "WAITING",
                participant_count=r.participant_count or 0,
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

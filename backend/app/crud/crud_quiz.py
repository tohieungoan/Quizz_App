from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.quiz import Question, Quiz
from app.schemas.quiz import QuizCreate, QuizUpdate


class CRUDQuiz:
    @staticmethod
    def _paginate_with_question_counts(
        db: Session,
        query,
        skip: int,
        limit: int,
    ) -> Tuple[List[Quiz], int]:
        """Return a quiz page without hydrating every Question relationship."""
        total = query.count()
        counts = (
            db.query(
                Question.quiz_id.label("quiz_id"),
                func.count(Question.id).label("question_count"),
            )
            .group_by(Question.quiz_id)
            .subquery()
        )
        rows = (
            query.outerjoin(counts, counts.c.quiz_id == Quiz.id)
            .add_columns(func.coalesce(counts.c.question_count, 0))
            .order_by(Quiz.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        quizzes: List[Quiz] = []
        for quiz, question_count in rows:
            # QuizResponse reads the public property; keeping the aggregate on
            # the instance avoids a hidden lazy-load/N+1 during serialization.
            quiz.__dict__["_prefetched_question_count"] = int(question_count)
            quizzes.append(quiz)
        return quizzes, total

    def get(self, db: Session, quiz_id: int) -> Optional[Quiz]:
        """Get quiz by ID."""
        return db.query(Quiz).filter(Quiz.id == quiz_id).first()

    def get_for_update(self, db: Session, quiz_id: int) -> Optional[Quiz]:
        """Lock a quiz so authoring and room launch cannot race each other."""
        return db.query(Quiz).filter(Quiz.id == quiz_id).with_for_update().first()

    def get_with_relations(self, db: Session, quiz_id: int) -> Optional[Quiz]:
        """Get quiz by ID with all questions and options eagerly loaded to prevent N+1 queries."""
        from sqlalchemy.orm import joinedload
        from app.models.quiz import Question
        return db.query(Quiz).options(
            joinedload(Quiz.questions).joinedload(Question.options)
        ).filter(Quiz.id == quiz_id).first()

    def get_multi_all(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        keyword: Optional[str] = None,
        difficulty: Optional[str] = None,
        subject: Optional[str] = None
    ) -> Tuple[List[Quiz], int]:
        """Get all quizzes in the system with pagination and optional filtering."""
        query = db.query(Quiz)
        
        # Apply filters
        if keyword:
            # Case-insensitive search on title using ilike
            query = query.filter(Quiz.title.ilike(f"%{keyword}%"))
        if difficulty:
            query = query.filter(Quiz.difficulty == difficulty)
        if subject:
            query = query.filter(Quiz.subject == subject)
            
        return self._paginate_with_question_counts(db, query, skip, limit)

    def get_multi_by_user(
        self, 
        db: Session, 
        user_id: int,
        skip: int = 0, 
        limit: int = 100,
        keyword: Optional[str] = None,
        difficulty: Optional[str] = None,
        subject: Optional[str] = None
    ) -> Tuple[List[Quiz], int]:
        """Get all quizzes for a specific user with pagination and optional filtering."""
        query = db.query(Quiz).filter(Quiz.user_id == user_id)
        
        # Apply filters
        if keyword:
            # Case-insensitive search on title using ilike
            query = query.filter(Quiz.title.ilike(f"%{keyword}%"))
        if difficulty:
            query = query.filter(Quiz.difficulty == difficulty)
        if subject:
            query = query.filter(Quiz.subject == subject)
            
        return self._paginate_with_question_counts(db, query, skip, limit)

    def create_with_user(self, db: Session, obj_in: QuizCreate, user_id: int) -> Quiz:
        """Create a new quiz associated with a user."""
        db_obj = Quiz(
            user_id=user_id,
            title=obj_in.title,
            subject=obj_in.subject,
            description=obj_in.description,
            difficulty=obj_in.difficulty or "Beginner",
            is_public=obj_in.is_public or False,
            # Creation only produces drafts. Publishing is a separate validated
            # state transition handled by QuizDraftService.publish().
            status="Draft",
            shuffle_options=obj_in.shuffle_options if obj_in.shuffle_options is not None else True,
            variant_enabled=obj_in.variant_enabled,
            variant_count=obj_in.variant_count,
            version=1,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Quiz, obj_in: QuizUpdate) -> Quiz:
        """Update an existing quiz."""
        locked = db.query(Quiz).filter(Quiz.id == db_obj.id).with_for_update().first()
        if locked is None:
            raise ValueError("Quiz not found.")
        db_obj = locked
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.version = (db_obj.version or 0) + 1
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, quiz_id: int) -> Optional[Quiz]:
        """Delete a quiz by ID."""
        db_obj = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if db_obj:
            db.delete(db_obj)
            db.commit()
        return db_obj

    def duplicate(self, db: Session, quiz_id: int, user_id: int) -> Optional[Quiz]:
        """Deep duplicate a quiz, its questions, and options."""
        from app.models.quiz import Question, QuestionOption
        
        original_quiz = self.get_with_relations(db, quiz_id)
        if not original_quiz:
            return None
            
        import re
        
        # Determine base title and find existing copies
        base_title = re.sub(r'\s*\(Copy( \d+)?\)$', '', original_quiz.title or "")
        
        existing_copies = db.query(Quiz.title).filter(
            Quiz.user_id == user_id,
            Quiz.title.like(f"{base_title}%")
        ).all()
        
        max_copy = 0
        for (t,) in existing_copies:
            if not t:
                continue
            if t == f"{base_title} (Copy)":
                max_copy = max(max_copy, 1)
            else:
                match = re.match(r'^.*\(Copy (\d+)\)$', t)
                if match:
                    max_copy = max(max_copy, int(match.group(1)))
                    
        new_title = f"{base_title} (Copy {max_copy + 1})" if max_copy > 0 else f"{base_title} (Copy)"
        
        # 1. Clone Quiz
        new_quiz = Quiz(
            user_id=user_id,
            title=new_title,
            subject=original_quiz.subject,
            description=original_quiz.description,
            difficulty=original_quiz.difficulty,
            is_public=False, # Always private by default for a copy
            status="Draft",
            shuffle_options=original_quiz.shuffle_options,
            variant_enabled=original_quiz.variant_enabled,
            variant_count=original_quiz.variant_count,
            version=1,
        )
        db.add(new_quiz)
        db.flush() # Get new_quiz.id
        
        # 2. Clone Questions
        for position, original_question in enumerate(original_quiz.questions):
            new_question = Question(
                quiz_id=new_quiz.id,
                type=original_question.type,
                content=original_question.content,
                audio_url=original_question.audio_url,
                media_url=original_question.media_url,
                audio_play_limit=original_question.audio_play_limit,
                difficulty=original_question.difficulty,
                time_limit=original_question.time_limit,
                is_original=False,
                position=position,
                parent_question_id=original_question.parent_question_id or original_question.id # Track lineage
            )
            db.add(new_question)
            db.flush() # Get new_question.id
            
            # 3. Clone Options
            for original_option in original_question.options:
                new_option = QuestionOption(
                    question_id=new_question.id,
                    content=original_option.content,
                    audio_url=original_option.audio_url,
                    media_url=original_option.media_url,
                    is_correct=original_option.is_correct
                )
                db.add(new_option)
                
        db.commit()
        db.refresh(new_quiz)
        return new_quiz

crud_quiz = CRUDQuiz()

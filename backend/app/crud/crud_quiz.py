from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.quiz import Quiz
from app.schemas.quiz import QuizCreate, QuizUpdate


class CRUDQuiz:
    def get(self, db: Session, quiz_id: int) -> Optional[Quiz]:
        """Get quiz by ID."""
        return db.query(Quiz).filter(Quiz.id == quiz_id).first()

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
            
        total = query.count()
        quizzes = query.order_by(Quiz.id.desc()).offset(skip).limit(limit).all()
        return quizzes, total

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
            
        total = query.count()
        quizzes = query.order_by(Quiz.id.desc()).offset(skip).limit(limit).all()
        return quizzes, total

    def create_with_user(self, db: Session, obj_in: QuizCreate, user_id: int) -> Quiz:
        """Create a new quiz associated with a user."""
        db_obj = Quiz(
            user_id=user_id,
            title=obj_in.title,
            subject=obj_in.subject,
            description=obj_in.description,
            difficulty=obj_in.difficulty or "Beginner",
            is_public=obj_in.is_public or False,
            status=obj_in.status or "Draft"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Quiz, obj_in: QuizUpdate) -> Quiz:
        """Update an existing quiz."""
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
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
            
        # 1. Clone Quiz
        new_quiz = Quiz(
            user_id=user_id,
            title=f"{original_quiz.title} (Copy)",
            subject=original_quiz.subject,
            description=original_quiz.description,
            difficulty=original_quiz.difficulty,
            is_public=False, # Always private by default for a copy
            status="Draft"
        )
        db.add(new_quiz)
        db.flush() # Get new_quiz.id
        
        # 2. Clone Questions
        for original_question in original_quiz.questions:
            new_question = Question(
                quiz_id=new_quiz.id,
                type=original_question.type,
                content=original_question.content,
                audio_url=original_question.audio_url,
                media_url=original_question.media_url,
                audio_play_limit=original_question.audio_play_limit,
                difficulty=original_question.difficulty,
                time_limit=original_question.time_limit,
                source=original_question.source,
                is_original=False,
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
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.quiz import Quiz
from app.schemas.quiz import QuizCreate, QuizUpdate

class CRUDQuiz:
    def get(self, db: Session, quiz_id: int) -> Optional[Quiz]:
        """Get quiz by ID."""
        return db.query(Quiz).filter(Quiz.id == quiz_id).first()

    def get_multi_all(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100
    ) -> Tuple[List[Quiz], int]:
        """Get all quizzes in the system with pagination."""
        query = db.query(Quiz)
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

crud_quiz = CRUDQuiz()

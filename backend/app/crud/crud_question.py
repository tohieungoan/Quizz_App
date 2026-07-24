from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.quiz import Question, QuestionOption
from app.schemas.question import QuestionCreate, QuestionUpdate

class CRUDQuestion:
    def get(self, db: Session, question_id: int) -> Optional[Question]:
        return db.query(Question).filter(Question.id == question_id).first()

    def get_multi_by_quiz(
        self, db: Session, quiz_id: int, skip: int = 0, limit: int = 100
    ) -> List[Question]:
        return db.query(Question).filter(Question.quiz_id == quiz_id).order_by(Question.id.asc()).offset(skip).limit(limit).all()

    def create_with_options(self, db: Session, obj_in: QuestionCreate, quiz_id: int) -> Question:
        """Create a question and its associated options in a single transaction."""
        # 1. Create Question
        db_question = Question(
            quiz_id=quiz_id,
            parent_question_id=obj_in.parent_question_id,
            type=obj_in.type,
            content=obj_in.content,
            audio_url=obj_in.audio_url,
            media_url=obj_in.media_url,
            audio_play_limit=obj_in.audio_play_limit or 0,
            difficulty=obj_in.difficulty,
            time_limit=obj_in.time_limit,
            source=obj_in.source,
            is_original=obj_in.is_original
        )
        db.add(db_question)
        db.flush() # Flush to get db_question.id without committing

        # 2. Create Options
        for opt in obj_in.options:
            db_opt = QuestionOption(
                question_id=db_question.id,
                content=opt.content,
                audio_url=opt.audio_url,
                media_url=opt.media_url,
                is_correct=opt.is_correct
            )
            db.add(db_opt)
            
        db.commit()
        db.refresh(db_question)
        return db_question

    def update(self, db: Session, db_obj: Question, obj_in: QuestionUpdate) -> Question:
        """Update a question."""
        update_data = obj_in.model_dump(exclude_unset=True)
        # Prevent options from being processed here if passed accidentally
        update_data.pop("options", None)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_with_options(
        self, db: Session, db_obj: Question, obj_in: QuestionUpdate
    ) -> Tuple[Question, List[str]]:
        """
        Update a question and completely replace its options.
        Returns the updated question and a list of orphaned media/audio URLs from the deleted options.
        """
        orphaned_urls = []
        update_data = obj_in.model_dump(exclude_unset=True)
        options_data = update_data.pop("options", None)
        
        # Update main question fields
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        if options_data is not None:
            # 1. Gather URLs from old options and delete them
            for old_opt in list(db_obj.options):
                if old_opt.media_url:
                    orphaned_urls.append(old_opt.media_url)
                if old_opt.audio_url:
                    orphaned_urls.append(old_opt.audio_url)
                db.delete(old_opt)
                
            db_obj.options = []
            db.flush()
            
            # 2. Insert new options
            for opt_data in options_data:
                new_opt = QuestionOption(
                    question_id=db_obj.id,
                    content=opt_data.get("content"),
                    audio_url=opt_data.get("audio_url"),
                    media_url=opt_data.get("media_url"),
                    is_correct=opt_data.get("is_correct", False)
                )
                db.add(new_opt)
                
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj, orphaned_urls

    def delete(self, db: Session, question_id: int) -> Optional[Question]:
        db_obj = db.query(Question).filter(Question.id == question_id).first()
        if db_obj:
            db.delete(db_obj)
            db.commit()
        return db_obj
        
    def is_url_referenced(self, db: Session, url: str) -> bool:
        """Check if a media/audio URL is still being used by any other Question or QuestionOption."""
        from sqlalchemy import or_
        if not url:
            return False
            
        in_question = db.query(Question).filter(
            or_(Question.media_url == url, Question.audio_url == url)
        ).first()
        if in_question:
            return True
            
        in_option = db.query(QuestionOption).filter(
            or_(QuestionOption.media_url == url, QuestionOption.audio_url == url)
        ).first()
        if in_option:
            return True
            
        return False

crud_question = CRUDQuestion()


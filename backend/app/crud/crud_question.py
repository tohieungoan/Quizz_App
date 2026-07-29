from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.quiz import Question, QuestionOption
from app.schemas.question import QuestionCreate, QuestionUpdate

class CRUDQuestion:
    def get(self, db: Session, question_id: int) -> Optional[Question]:
        return db.query(Question).filter(Question.id == question_id).first()

    def get_multi_by_quiz(
        self, db: Session, quiz_id: int, skip: int = 0, limit: int = 100,
        keyword: Optional[str] = None, difficulty: Optional[str] = None
    ) -> List[Question]:
        from sqlalchemy.orm import joinedload
        query = db.query(Question).options(joinedload(Question.options)).filter(Question.quiz_id == quiz_id)
        
        if keyword:
            query = query.filter(Question.content.ilike(f"%{keyword}%"))
        if difficulty:
            query = query.filter(Question.difficulty == difficulty)
            
        return query.order_by(Question.id.asc()).offset(skip).limit(limit).all()

    def get_bank_questions(
        self, db: Session, user_id: int, skip: int = 0, limit: int = 100,
        keyword: Optional[str] = None, quiz_id: Optional[int] = None
    ) -> Tuple[List[Question], int]:
        from app.models.quiz import Quiz
        from sqlalchemy.orm import joinedload
        query = db.query(Question).options(joinedload(Question.options)).join(Quiz).filter(Quiz.user_id == user_id)
        
        if quiz_id:
            query = query.filter(Question.quiz_id == quiz_id)
        if keyword:
            query = query.filter(Question.content.ilike(f"%{keyword}%"))
            
        total = query.count()
        questions = query.order_by(Question.id.desc()).offset(skip).limit(limit).all()
        return questions, total

    def import_questions_to_quiz(
        self, db: Session, target_quiz_id: int, question_ids: List[int], user_id: int
    ) -> List[Question]:
        """Duplicate existing questions and their options, linking them to a new quiz."""
        if not question_ids:
            return []

        # 1. BATCH FETCH: Get all original questions owned by the user
        from app.models.quiz import Quiz
        original_qs = db.query(Question).join(Quiz).filter(
            Question.id.in_(question_ids),
            Quiz.user_id == user_id
        ).all()
        if not original_qs:
            return []

        # 2. Build a map of ultimate_parent_id for the submitted questions
        q_to_ultimate_id = {q: (q.parent_question_id or q.id) for q in original_qs}
        all_ultimate_ids = list(q_to_ultimate_id.values())

        # 3. BATCH DUPLICATE CHECK: Scan the target quiz once to find any already-imported parent IDs
        from sqlalchemy import or_
        existing_overlapping_qs = db.query(Question).filter(
            Question.quiz_id == target_quiz_id,
            or_(
                Question.id.in_(all_ultimate_ids),
                Question.parent_question_id.in_(all_ultimate_ids)
            )
        ).all()
        
        # Store in a Set for O(1) lookup performance
        existing_ultimate_ids = set(
            eq.parent_question_id or eq.id for eq in existing_overlapping_qs
        )

        imported_questions = []
        for original_q in original_qs:
            ultimate_parent_id = q_to_ultimate_id[original_q]
            
            # Skip if already exists in the quiz (or was imported earlier in this same batch)
            if ultimate_parent_id in existing_ultimate_ids:
                continue
                
            # Mark as existing to prevent duplicate imports within the same payload
            existing_ultimate_ids.add(ultimate_parent_id)
                
            # 4. Clone Question
            new_q = Question(
                quiz_id=target_quiz_id,
                parent_question_id=ultimate_parent_id,
                type=original_q.type,
                content=original_q.content,
                audio_url=original_q.audio_url,
                media_url=original_q.media_url,
                audio_play_limit=original_q.audio_play_limit,
                difficulty=original_q.difficulty,
                time_limit=original_q.time_limit,
                source="Imported",
                is_original=False
            )
            db.add(new_q)
            db.flush() # Get the newly generated ID to assign to Options
            
            # 5. Clone Options
            for opt in original_q.options:
                new_opt = QuestionOption(
                    question_id=new_q.id,
                    content=opt.content,
                    audio_url=opt.audio_url,
                    media_url=opt.media_url,
                    is_correct=opt.is_correct
                )
                db.add(new_opt)
                
            imported_questions.append(new_q)
            
        db.commit()
        for q in imported_questions:
            db.refresh(q)
            
        return imported_questions

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
            old_options = {opt.id: opt for opt in db_obj.options}
            new_option_ids = set()
            
            for opt_data in options_data:
                opt_id = opt_data.get("id")
                if opt_id and opt_id in old_options:
                    # Update existing option
                    old_opt = old_options[opt_id]
                    if old_opt.media_url and old_opt.media_url != opt_data.get("media_url"):
                        orphaned_urls.append(old_opt.media_url)
                    if old_opt.audio_url and old_opt.audio_url != opt_data.get("audio_url"):
                        orphaned_urls.append(old_opt.audio_url)
                        
                    old_opt.content = opt_data.get("content")
                    old_opt.audio_url = opt_data.get("audio_url")
                    old_opt.media_url = opt_data.get("media_url")
                    old_opt.is_correct = opt_data.get("is_correct", False)
                    new_option_ids.add(opt_id)
                else:
                    # Insert new option
                    new_opt = QuestionOption(
                        question_id=db_obj.id,
                        content=opt_data.get("content"),
                        audio_url=opt_data.get("audio_url"),
                        media_url=opt_data.get("media_url"),
                        is_correct=opt_data.get("is_correct", False)
                    )
                    db.add(new_opt)
                    
            # Delete removed options
            for old_id, old_opt in old_options.items():
                if old_id not in new_option_ids:
                    if old_opt.media_url:
                        orphaned_urls.append(old_opt.media_url)
                    if old_opt.audio_url:
                        orphaned_urls.append(old_opt.audio_url)
                    db.delete(old_opt)
                
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


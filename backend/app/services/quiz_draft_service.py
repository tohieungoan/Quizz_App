"""Transactional authoring workflow for quiz drafts.

The editor sends a complete snapshot. This service is the only place that is
allowed to reconcile that snapshot with questions/options, increment the quiz
version, and transition a draft to Published.
"""

from __future__ import annotations

from datetime import datetime
from typing import Iterable, Optional

from sqlalchemy.orm import Session, selectinload

from app.models.quiz import Question, QuestionOption, Quiz, UploadFile
from app.models.user import User
from app.schemas.quiz import (
    DraftOptionSnapshot,
    DraftQuestionSnapshot,
    QuizDraftSnapshot,
)
from app.services.quiz_authoring_policy import (
    QuizInActiveRoomError,
    ensure_quiz_is_not_in_active_room,
)
from app.utils.cloudinary_utils import is_managed_cloudinary_url


class QuizDraftError(Exception):
    """Base class for errors that are safe to expose to API clients."""


class QuizNotFoundError(QuizDraftError):
    pass


class QuizPermissionError(QuizDraftError):
    pass


class QuizVersionConflictError(QuizDraftError):
    def __init__(self, current_version: int):
        self.current_version = current_version
        super().__init__("This quiz was updated in another tab or session.")


class QuizSnapshotError(QuizDraftError):
    pass


class QuizActiveRoomError(QuizDraftError):
    pass


class QuizPublishValidationError(QuizDraftError):
    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__("Quiz is not ready to publish.")


class QuizDraftService:
    MAX_QUESTIONS = 2000

    @staticmethod
    def _can_manage(quiz: Quiz, user_id: int, is_super_admin: bool) -> bool:
        return quiz.user_id == user_id or is_super_admin

    @staticmethod
    def _editor_query(db: Session):
        return db.query(Quiz).options(
            selectinload(Quiz.questions).selectinload(Question.options)
        )

    def get_editor_quiz(
        self,
        db: Session,
        quiz_id: int,
        user_id: int,
        is_super_admin: bool = False,
    ) -> Quiz:
        quiz = self._editor_query(db).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise QuizNotFoundError("Quiz not found.")
        if not self._can_manage(quiz, user_id, is_super_admin):
            raise QuizPermissionError("You do not have permission to edit this quiz.")
        return quiz

    def create_or_get_draft(
        self,
        db: Session,
        user_id: int,
        client_draft_id: str,
    ) -> Quiz:
        existing = self._editor_query(db).filter(
            Quiz.user_id == user_id,
            Quiz.draft_key == client_draft_id,
        ).first()
        if existing:
            return existing

        quiz = Quiz(
            user_id=user_id,
            title="",
            subject="Science",
            description="",
            difficulty="Medium",
            is_public=False,
            shuffle_options=True,
            status="Draft",
            version=1,
            draft_key=client_draft_id,
        )
        try:
            db.add(quiz)
            db.commit()
            db.refresh(quiz)
        except Exception:
            db.rollback()
            # A retried request may race with the original insert. Resolve the
            # idempotency key once more before surfacing a database failure.
            existing = self._editor_query(db).filter(
                Quiz.user_id == user_id,
                Quiz.draft_key == client_draft_id,
            ).first()
            if existing:
                return existing
            raise
        return self.get_editor_quiz(db, quiz.id, user_id)

    def get_draft_by_client_id(
        self,
        db: Session,
        user_id: int,
        client_draft_id: str,
    ) -> Quiz:
        """Return an existing draft without creating an empty database row."""
        quiz = self._editor_query(db).filter(
            Quiz.user_id == user_id,
            Quiz.draft_key == client_draft_id,
        ).first()
        if not quiz:
            raise QuizNotFoundError("Draft not found.")
        return quiz

    def save_snapshot(
        self,
        db: Session,
        quiz_id: int,
        snapshot: QuizDraftSnapshot,
        user_id: int,
        is_super_admin: bool = False,
    ) -> Quiz:
        try:
            quiz = self._editor_query(db).filter(Quiz.id == quiz_id).with_for_update().first()
            if not quiz:
                raise QuizNotFoundError("Quiz not found.")
            if not self._can_manage(quiz, user_id, is_super_admin):
                raise QuizPermissionError("You do not have permission to edit this quiz.")
            try:
                ensure_quiz_is_not_in_active_room(db, quiz.id)
            except QuizInActiveRoomError as error:
                raise QuizActiveRoomError(str(error)) from error
            if quiz.version != snapshot.expected_version:
                raise QuizVersionConflictError(quiz.version)
            if len(snapshot.questions) > self.MAX_QUESTIONS:
                raise QuizSnapshotError(f"A quiz cannot exceed {self.MAX_QUESTIONS} questions.")

            old_urls = self._collect_urls(quiz.questions) | self._builder_state_urls(
                quiz.draft_builder_state
            )
            self._validate_media_ownership(
                db,
                snapshot.questions,
                old_urls,
                user_id,
                is_super_admin,
                self._builder_state_urls(snapshot.builder_state),
            )
            self._validate_parent_questions(db, quiz, snapshot.questions)

            quiz.title = snapshot.title.strip()
            quiz.subject = (snapshot.subject or "").strip() or None
            quiz.description = (snapshot.description or "").strip() or None
            quiz.difficulty = (snapshot.difficulty or "Medium").strip()
            quiz.is_public = snapshot.is_public
            quiz.shuffle_options = snapshot.shuffle_options
            quiz.draft_builder_state = snapshot.builder_state
            quiz.status = "Draft"

            self._reconcile_questions(db, quiz, snapshot.questions)
            quiz.version += 1
            quiz.updated_at = datetime.utcnow()
            db.flush()

            new_urls = self._collect_urls(quiz.questions) | self._builder_state_urls(
                snapshot.builder_state
            )
            self._attach_assets(db, new_urls, quiz, user_id, is_super_admin)
            self._schedule_orphan_assets(db, old_urls - new_urls, user_id)

            db.commit()
        except QuizDraftError:
            db.rollback()
            raise
        except Exception:
            db.rollback()
            raise
        return self.get_editor_quiz(db, quiz_id, user_id, is_super_admin)

    def publish(
        self,
        db: Session,
        quiz_id: int,
        expected_version: int,
        user_id: int,
        is_super_admin: bool = False,
    ) -> Quiz:
        try:
            quiz = self._editor_query(db).filter(Quiz.id == quiz_id).with_for_update().first()
            if not quiz:
                raise QuizNotFoundError("Quiz not found.")
            if not self._can_manage(quiz, user_id, is_super_admin):
                raise QuizPermissionError("You do not have permission to publish this quiz.")
            if quiz.version != expected_version:
                raise QuizVersionConflictError(quiz.version)

            validation_errors = self._validate_publishable(quiz)
            if validation_errors:
                raise QuizPublishValidationError(validation_errors)

            first_publication = quiz.published_at is None
            quiz.status = "Published"
            quiz.version += 1
            quiz.published_at = quiz.published_at or datetime.utcnow()
            quiz.draft_builder_state = None
            quiz.updated_at = datetime.utcnow()
            db.add(quiz)
            if first_publication:
                author = db.query(User).filter(User.id == quiz.user_id).with_for_update().first()
                if author:
                    author.achievement_points = (author.achievement_points or 0) + 30
                    db.add(author)
            db.commit()
        except QuizDraftError:
            db.rollback()
            raise
        except Exception:
            db.rollback()
            raise
        return self.get_editor_quiz(db, quiz_id, user_id, is_super_admin)

    @staticmethod
    def _validate_parent_questions(
        db: Session,
        quiz: Quiz,
        questions: list[DraftQuestionSnapshot],
    ) -> None:
        parent_ids = {
            question.parent_question_id
            for question in questions
            if question.parent_question_id is not None
        }
        if not parent_ids:
            return
        accessible_ids = {
            question_id
            for (question_id,) in db.query(Question.id)
            .join(Quiz, Question.quiz_id == Quiz.id)
            .filter(Question.id.in_(parent_ids), Quiz.user_id == quiz.user_id)
            .all()
        }
        if accessible_ids != parent_ids:
            raise QuizSnapshotError("A parent question is unavailable or owned by another user.")

    @staticmethod
    def _reconcile_questions(
        db: Session,
        quiz: Quiz,
        incoming_questions: list[DraftQuestionSnapshot],
    ) -> None:
        existing_questions = {question.id: question for question in quiz.questions}
        retained_question_ids: set[int] = set()

        for position, incoming in enumerate(incoming_questions):
            if incoming.id is not None:
                question = existing_questions.get(incoming.id)
                if question is None:
                    raise QuizSnapshotError(
                        f"Question {incoming.id} does not belong to quiz {quiz.id}."
                    )
                retained_question_ids.add(question.id)
            else:
                question = Question(quiz=quiz)
                db.add(question)

            question.parent_question_id = incoming.parent_question_id
            question.type = incoming.type.strip()
            question.content = incoming.content
            question.audio_url = incoming.audio_url
            question.media_url = incoming.media_url
            question.audio_play_limit = incoming.audio_play_limit
            question.difficulty = incoming.difficulty.strip()
            question.time_limit = incoming.time_limit
            question.is_original = incoming.is_original
            question.position = position

            QuizDraftService._reconcile_options(db, question, incoming.options)

        for question_id, question in existing_questions.items():
            if question_id not in retained_question_ids:
                db.delete(question)

    @staticmethod
    def _reconcile_options(
        db: Session,
        question: Question,
        incoming_options: list[DraftOptionSnapshot],
    ) -> None:
        existing_options = {option.id: option for option in question.options}
        retained_option_ids: set[int] = set()

        for incoming in incoming_options:
            if incoming.id is not None:
                option = existing_options.get(incoming.id)
                if option is None:
                    raise QuizSnapshotError(
                        f"Option {incoming.id} does not belong to question {question.id}."
                    )
                retained_option_ids.add(option.id)
            else:
                option = QuestionOption(question=question)
                db.add(option)

            option.content = incoming.content
            option.audio_url = incoming.audio_url
            option.media_url = incoming.media_url
            option.is_correct = incoming.is_correct

        for option_id, option in existing_options.items():
            if option_id not in retained_option_ids:
                db.delete(option)

    @staticmethod
    def _collect_urls(questions: Iterable[Question]) -> set[str]:
        urls: set[str] = set()
        for question in questions:
            if question.media_url:
                urls.add(question.media_url)
            if question.audio_url:
                urls.add(question.audio_url)
            for option in question.options:
                if option.media_url:
                    urls.add(option.media_url)
                if option.audio_url:
                    urls.add(option.audio_url)
        return urls

    @staticmethod
    def _snapshot_urls(questions: Iterable[DraftQuestionSnapshot]) -> set[str]:
        urls: set[str] = set()
        for question in questions:
            if question.media_url:
                urls.add(question.media_url)
            if question.audio_url:
                urls.add(question.audio_url)
            for option in question.options:
                if option.media_url:
                    urls.add(option.media_url)
                if option.audio_url:
                    urls.add(option.audio_url)
        return urls

    @staticmethod
    def _builder_state_urls(value) -> set[str]:
        urls: set[str] = set()
        if isinstance(value, dict):
            for item in value.values():
                urls.update(QuizDraftService._builder_state_urls(item))
        elif isinstance(value, list):
            for item in value:
                urls.update(QuizDraftService._builder_state_urls(item))
        elif isinstance(value, str) and value.startswith("https://"):
            urls.add(value)
        return urls

    def _validate_media_ownership(
        self,
        db: Session,
        questions: list[DraftQuestionSnapshot],
        existing_urls: set[str],
        user_id: int,
        is_super_admin: bool,
        additional_urls: Optional[set[str]] = None,
    ) -> None:
        urls = self._snapshot_urls(questions) | (additional_urls or set())
        if not urls:
            return
        assets = db.query(UploadFile).filter(UploadFile.secure_url.in_(urls)).all()
        assets_by_url = {asset.secure_url: asset for asset in assets}
        for url in urls:
            asset = assets_by_url.get(url)
            if asset:
                if asset.user_id != user_id and not is_super_admin:
                    raise QuizPermissionError("A media asset is owned by another user.")
                if asset.status in {"DELETED", "DELETE_PENDING"}:
                    raise QuizSnapshotError("A media asset is no longer available.")
            elif is_managed_cloudinary_url(url) and url not in existing_urls:
                raise QuizSnapshotError("Cloud media must be uploaded through the quiz editor.")

    @staticmethod
    def _attach_assets(
        db: Session,
        urls: set[str],
        quiz: Quiz,
        user_id: int,
        is_super_admin: bool,
    ) -> None:
        if not urls:
            return
        assets = db.query(UploadFile).filter(UploadFile.secure_url.in_(urls)).all()
        for asset in assets:
            if asset.user_id != user_id and not is_super_admin:
                raise QuizPermissionError("A media asset is owned by another user.")
            asset.quiz_id = quiz.id
            asset.status = "ATTACHED"
            asset.last_error = None
            db.add(asset)

    @staticmethod
    def _schedule_orphan_assets(db: Session, urls: set[str], user_id: int) -> None:
        if not urls:
            return
        assets = db.query(UploadFile).filter(
            UploadFile.user_id == user_id,
            UploadFile.secure_url.in_(urls),
            UploadFile.status.notin_(["DELETED", "DELETE_PENDING"]),
        ).all()
        for asset in assets:
            asset.status = "DELETE_PENDING"
            asset.last_error = None
            db.add(asset)

    @staticmethod
    def _validate_publishable(quiz: Quiz) -> list[str]:
        errors: list[str] = []
        if not (quiz.title or "").strip():
            errors.append("Quiz title is required.")
        if isinstance(quiz.draft_builder_state, dict):
            if quiz.draft_builder_state.get("editingType"):
                errors.append("Finish or cancel the question currently open in the builder before publishing.")
            if quiz.draft_builder_state.get("aiReviewQuestions"):
                errors.append("Import or discard AI-generated questions before publishing.")

        for index, question in enumerate(quiz.questions, start=1):
            prefix = f"Question {index}"
            question_type = (question.type or "").strip().lower()
            if question_type not in {
                "multiple choice",
                "multiple_choice",
                "multiple",
                "true/false",
                "true_false",
                "truefalse",
                "short answer",
                "short",
                "fill in the blank",
            }:
                errors.append(f"{prefix} has an unsupported type.")
                continue
            if not (question.content or "").strip():
                errors.append(f"{prefix} content is required.")
            if question.time_limit is None or question.time_limit < 1:
                errors.append(f"{prefix} must have a positive time limit.")

            options = list(question.options)
            blank_options = [option for option in options if not (option.content or "").strip()]
            if blank_options:
                errors.append(f"{prefix} contains an empty answer option.")
            correct_count = sum(option.is_correct is True for option in options)

            if question_type in {"multiple choice", "multiple_choice", "multiple"}:
                if len(options) < 2:
                    errors.append(f"{prefix} must have at least two options.")
                if correct_count != 1:
                    errors.append(f"{prefix} must have exactly one correct option.")
            elif question_type in {"true/false", "true_false", "truefalse"}:
                if len(options) != 2:
                    errors.append(f"{prefix} must have exactly two options.")
                if correct_count != 1:
                    errors.append(f"{prefix} must have exactly one correct option.")
            else:
                if not 1 <= len(options) <= 5:
                    errors.append(f"{prefix} must have between one and five accepted answers.")
                if correct_count < 1:
                    errors.append(f"{prefix} must have at least one accepted answer.")
        return errors


quiz_draft_service = QuizDraftService()

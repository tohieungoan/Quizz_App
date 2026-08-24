"""Lifecycle, generation, preview and assignment services for quiz versions."""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import logging
from collections import Counter
from datetime import datetime, timedelta
from typing import Iterable, Optional
from uuid import uuid4

from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.exam import Exam
from app.models.quiz import Quiz
from app.models.quiz_variant import (
    QuizVariant,
    QuizVariantOption,
    QuizVariantQuestion,
    QuizVariantSet,
)
from app.models.room import Room
from app.services.ai.orchestrator import LLMOrchestrator
from app.services.ai.prompt_builder import PromptBuilder
from app.services.quiz_variant_validator import (
    QuizVariantValidationError,
    quiz_variant_payload_validator,
)

logger = logging.getLogger(__name__)


class QuizVariantError(Exception):
    pass


class QuizVariantNotReadyError(QuizVariantError):
    pass


class QuizVariantMutationError(QuizVariantError):
    pass


class QuizVariantService:
    # This version is part of the generation key. Incrementing it prevents a
    # previously generated snapshot from being reused after layout rules change.
    PROMPT_VERSION = "quiz-variants-v5"
    MAX_ATTEMPTS = 3
    BATCH_SIZE = 3
    MAX_CONCURRENT_BATCHES = 2
    STALE_AFTER = timedelta(minutes=15)

    @staticmethod
    def _set_query(db: Session):
        return db.query(QuizVariantSet).options(
            selectinload(QuizVariantSet.variants)
            .selectinload(QuizVariant.questions)
            .selectinload(QuizVariantQuestion.options)
        )

    def prepare_set(self, db: Session, quiz: Quiz) -> QuizVariantSet:
        """Create an editable pre-delivery version set from the saved source."""
        if not quiz.variant_enabled:
            raise QuizVariantError("Quiz variants are disabled.")
        if not 2 <= quiz.variant_count <= 5:
            raise QuizVariantError("Quiz variant count must be between 2 and 5.")

        generation_key = (
            f"quiz:{quiz.id}:version:{quiz.version}:count:{quiz.variant_count}:"
            f"prompt:{self.PROMPT_VERSION}"
        )
        existing = self._set_query(db).filter(
            QuizVariantSet.generation_key == generation_key
        ).first()
        if existing:
            quiz.active_variant_set_id = existing.id
            return existing

        variant_set = QuizVariantSet(
            quiz_id=quiz.id,
            source_quiz_version=quiz.version,
            requested_count=quiz.variant_count,
            status="PENDING",
            generation_key=generation_key,
            prompt_version=self.PROMPT_VERSION,
        )
        db.add(variant_set)
        db.flush()

        source_questions = sorted(quiz.questions, key=lambda question: (question.position, question.id))
        for variant_index in range(quiz.variant_count):
            variant = QuizVariant(
                variant_set=variant_set,
                variant_index=variant_index,
                version_code=chr(ord("A") + variant_index),
                status="READY" if variant_index == 0 else "PENDING",
            )
            db.add(variant)
            db.flush()
            self._clone_questions(db, variant, source_questions, shuffle=variant_index > 0)

        if not source_questions:
            for variant in variant_set.variants:
                variant.status = "READY"
            variant_set.status = "READY"
            variant_set.completed_at = datetime.utcnow()

        db.flush()
        quiz.active_variant_set_id = variant_set.id
        return variant_set

    @staticmethod
    def _order_options_for_variant(
        source_options: Iterable,
        *,
        variant_set_id: int,
        variant_index: int,
        question_id: int,
    ) -> list:
        """Return a secret-seeded, balanced and reproducible answer layout.

        Pure random shuffling can cluster correct answers in one slot. Instead,
        the original slot is excluded until every other slot has been used, while
        an HMAC makes the slot order unpredictable outside the server. The final
        order is persisted in the immutable snapshot, so retries and delivery do
        not reshuffle a candidate's paper.
        """
        options = list(source_options)
        if variant_index <= 0 or len(options) < 2:
            return options

        secret = settings.SECRET_KEY.encode("utf-8")

        def rank(purpose: str, value: object, *, per_variant: bool = True) -> bytes:
            variant_scope = str(variant_index) if per_variant else "set"
            message = (
                f"quiz-variant-layout-v3:{purpose}:{variant_set_id}:"
                f"{variant_scope}:{question_id}:{value}"
            ).encode("utf-8")
            return hmac.new(secret, message, hashlib.sha256).digest()

        correct_options = [option for option in options if option.is_correct is True]

        if len(correct_options) == 1:
            correct_option = correct_options[0]
            source_correct_position = options.index(correct_option)
            alternative_positions = [
                position
                for position in range(len(options))
                if position != source_correct_position
            ]
            alternative_positions.sort(
                key=lambda position: rank("correct-slot", position, per_variant=False)
            )
            balanced_slots = [source_correct_position, *alternative_positions]
            target_position = balanced_slots[variant_index % len(balanced_slots)]
            distractors = [option for option in options if option is not correct_option]
            distractors.sort(key=lambda option: rank("distractor", option.id))
            distractors.insert(target_position, correct_option)
            return distractors

        # Multiple-answer questions cannot always have a unique correctness
        # pattern. Secret-seeded ordering still randomizes their layout without
        # asking the AI to decide which options are correct.
        shuffled = sorted(options, key=lambda option: rank("multi-answer", option.id))
        if shuffled == options:
            shuffled = shuffled[1:] + shuffled[:1]
        return shuffled

    @staticmethod
    def _clone_questions(
        db: Session,
        variant: QuizVariant,
        source_questions: Iterable,
        *,
        shuffle: bool,
    ) -> None:
        for position, source in enumerate(source_questions):
            variant_question = QuizVariantQuestion(
                variant=variant,
                original_question_id=source.id,
                type=source.type,
                content=(source.content or "").strip(),
                difficulty=source.difficulty,
                time_limit=source.time_limit,
                media_url=source.media_url,
                audio_url=source.audio_url,
                audio_play_limit=source.audio_play_limit or 0,
                position=position,
            )
            db.add(variant_question)
            db.flush()

            source_options = list(source.options)
            question_type = (source.type or "").strip().lower()
            should_shuffle = shuffle and question_type in {
                "multiple choice",
                "multiple_choice",
                "multiple",
            }
            if should_shuffle:
                source_options = QuizVariantService._order_options_for_variant(
                    source_options,
                    variant_set_id=variant.variant_set_id,
                    variant_index=variant.variant_index,
                    question_id=source.id,
                )
            for option_position, source_option in enumerate(source_options):
                db.add(
                    QuizVariantOption(
                        variant_question=variant_question,
                        original_option_id=source_option.id,
                        content=(source_option.content or "").strip(),
                        media_url=source_option.media_url,
                        audio_url=source_option.audio_url,
                        is_correct=source_option.is_correct is True,
                        position=option_position,
                    )
                )

    def get_active_set(self, db: Session, quiz_id: int) -> Optional[QuizVariantSet]:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz or not quiz.active_variant_set_id:
            return None
        return self._set_query(db).filter(
            QuizVariantSet.id == quiz.active_variant_set_id,
            QuizVariantSet.quiz_id == quiz_id,
        ).first()

    def update_question(
        self,
        db: Session,
        quiz: Quiz,
        variant_id: int,
        question_id: int,
        payload,
    ) -> QuizVariantQuestion:
        """Update one generated question without mutating the source quiz."""
        variant_set, variant = self._get_mutable_variant(db, quiz, variant_id)
        question = db.query(QuizVariantQuestion).filter(
            QuizVariantQuestion.id == question_id,
            QuizVariantQuestion.quiz_variant_id == variant.id,
        ).with_for_update().first()
        if not question:
            raise QuizVariantMutationError("Generated question not found.")

        question_type = payload.type.strip()
        normalized_type = question_type.lower()
        options = list(payload.options)
        correct_count = sum(option.is_correct for option in options)
        if normalized_type in {"multiple choice", "multiple_choice", "multiple"}:
            if len(options) < 2 or correct_count != 1:
                raise QuizVariantMutationError(
                    "A multiple-choice question requires at least two options and exactly one correct answer."
                )
        elif normalized_type in {"true/false", "true_false", "truefalse"}:
            if len(options) != 2 or correct_count != 1:
                raise QuizVariantMutationError(
                    "A true/false question requires two options and exactly one correct answer."
                )
        elif normalized_type in {"short answer", "short_answer", "short"}:
            if not options or correct_count != 1:
                raise QuizVariantMutationError(
                    "A short-answer question requires exactly one correct answer."
                )
        else:
            raise QuizVariantMutationError("Unsupported generated question type.")

        existing_options = {option.id: option for option in question.options}
        incoming_ids = [option.id for option in options if option.id is not None]
        if len(incoming_ids) != len(set(incoming_ids)):
            raise QuizVariantMutationError("Generated option IDs must be unique.")
        if any(option_id not in existing_options for option_id in incoming_ids):
            raise QuizVariantMutationError("A generated option does not belong to this question.")

        question.type = question_type
        question.content = payload.content.strip()
        question.difficulty = payload.difficulty
        question.time_limit = payload.time_limit
        question.media_url = payload.media_url
        question.audio_url = payload.audio_url

        # Move persisted rows out of the final position range first. Without
        # this two-phase reorder, swapping A/B can momentarily violate the
        # unique (question, position) constraint depending on UPDATE order.
        for option in existing_options.values():
            option.position = -(option.id + 1)
        db.flush()

        retained_ids: set[int] = set()
        for position, incoming in enumerate(options):
            option = existing_options.get(incoming.id) if incoming.id is not None else None
            if option is None:
                option = QuizVariantOption(
                    variant_question=question,
                    original_option_id=None,
                )
                db.add(option)
            else:
                retained_ids.add(option.id)
            option.content = incoming.content.strip()
            option.media_url = incoming.media_url
            option.audio_url = incoming.audio_url
            option.is_correct = incoming.is_correct
            option.position = position

        for option_id, option in existing_options.items():
            if option_id not in retained_ids:
                db.delete(option)

        db.flush()
        self._refresh_authoring_status(db, variant_set.id)
        # Editing a published delivery snapshot creates a new authoring
        # revision. It must be explicitly published again after validation.
        quiz.status = "Draft"
        quiz.updated_at = datetime.utcnow()
        db.commit()
        return db.query(QuizVariantQuestion).options(
            selectinload(QuizVariantQuestion.options)
        ).filter(QuizVariantQuestion.id == question.id).first()

    def delete_question(
        self,
        db: Session,
        quiz: Quiz,
        variant_id: int,
        question_id: int,
    ) -> None:
        """Delete one question from a generated version and compact positions."""
        variant_set, variant = self._get_mutable_variant(db, quiz, variant_id)
        question = db.query(QuizVariantQuestion).filter(
            QuizVariantQuestion.id == question_id,
            QuizVariantQuestion.quiz_variant_id == variant.id,
        ).with_for_update().first()
        if not question:
            raise QuizVariantMutationError("Generated question not found.")
        db.delete(question)
        db.flush()
        remaining = db.query(QuizVariantQuestion).filter(
            QuizVariantQuestion.quiz_variant_id == variant.id,
        ).order_by(QuizVariantQuestion.position, QuizVariantQuestion.id).all()
        for position, item in enumerate(remaining):
            item.position = position
        db.flush()
        self._refresh_authoring_status(db, variant_set.id)
        quiz.status = "Draft"
        quiz.updated_at = datetime.utcnow()
        db.commit()

    def sync_deleted_source_questions(
        self,
        db: Session,
        quiz: Quiz,
        question_ids: Iterable[int],
    ) -> int:
        """Remove deleted Original questions from every active authoring version.

        Delivery snapshots are immutable. If the active set has already been
        assigned to a room or exam, fork it first and apply the authoring change
        to the copy while historical deliveries keep referencing the old set.

        The caller owns the transaction and deletes the source questions after
        this method returns.
        """
        source_ids = {int(question_id) for question_id in question_ids}
        if not source_ids or not quiz.active_variant_set_id:
            return 0

        variant_set = self._set_query(db).filter(
            QuizVariantSet.id == quiz.active_variant_set_id,
            QuizVariantSet.quiz_id == quiz.id,
        ).with_for_update().first()
        if variant_set is None:
            quiz.active_variant_set_id = None
            return 0

        is_delivery_snapshot = bool(
            db.query(Room.id).filter(Room.variant_set_id == variant_set.id).first()
            or db.query(Exam.id).filter(Exam.variant_set_id == variant_set.id).first()
        )
        if is_delivery_snapshot:
            variant_set = self._fork_for_authoring(db, quiz, variant_set)

        affected_variants: set[int] = set()
        copies = db.query(QuizVariantQuestion).join(
            QuizVariant,
            QuizVariantQuestion.quiz_variant_id == QuizVariant.id,
        ).filter(
            QuizVariant.variant_set_id == variant_set.id,
            QuizVariantQuestion.original_question_id.in_(source_ids),
        ).all()
        for question in copies:
            affected_variants.add(question.quiz_variant_id)
            db.delete(question)
        if not copies:
            return 0

        db.flush()
        for variant_id in affected_variants:
            remaining = db.query(QuizVariantQuestion).filter(
                QuizVariantQuestion.quiz_variant_id == variant_id,
            ).order_by(
                QuizVariantQuestion.position,
                QuizVariantQuestion.id,
            ).all()
            # Use a temporary range so the unique (variant, position)
            # constraint cannot collide while gaps are compacted.
            for temporary_position, question in enumerate(remaining, start=1):
                question.position = -temporary_position
            db.flush()
            for position, question in enumerate(remaining):
                question.position = position
            db.flush()

        variant_set.source_quiz_version = (quiz.version or 0) + 1
        variant_set.generation_key = (
            f"quiz:{quiz.id}:authoring:{variant_set.source_quiz_version}:"
            f"delete:{uuid4().hex}"
        )
        self._refresh_authoring_status(db, variant_set.id)
        quiz.status = "Draft"
        quiz.updated_at = datetime.utcnow()
        return len(copies)

    @staticmethod
    def _fork_for_authoring(
        db: Session,
        quiz: Quiz,
        source_set: QuizVariantSet,
    ) -> QuizVariantSet:
        """Copy a delivery snapshot before applying an authoring mutation."""
        fork = QuizVariantSet(
            quiz_id=quiz.id,
            source_quiz_version=(quiz.version or 0) + 1,
            requested_count=source_set.requested_count,
            status=source_set.status,
            generation_key=f"quiz:{quiz.id}:authoring-fork:{uuid4().hex}",
            prompt_version=source_set.prompt_version,
            generation_model=source_set.generation_model,
            attempt_count=source_set.attempt_count,
            error_message=source_set.error_message,
            completed_at=source_set.completed_at,
        )
        db.add(fork)
        db.flush()

        for source_variant in sorted(
            source_set.variants,
            key=lambda item: (item.variant_index, item.id),
        ):
            variant = QuizVariant(
                variant_set=fork,
                variant_index=source_variant.variant_index,
                version_code=source_variant.version_code,
                status=source_variant.status,
            )
            db.add(variant)
            db.flush()
            for source_question in sorted(
                source_variant.questions,
                key=lambda item: (item.position, item.id),
            ):
                question = QuizVariantQuestion(
                    variant=variant,
                    original_question_id=source_question.original_question_id,
                    type=source_question.type,
                    content=source_question.content,
                    difficulty=source_question.difficulty,
                    time_limit=source_question.time_limit,
                    media_url=source_question.media_url,
                    audio_url=source_question.audio_url,
                    audio_play_limit=source_question.audio_play_limit,
                    position=source_question.position,
                )
                db.add(question)
                db.flush()
                for source_option in sorted(
                    source_question.options,
                    key=lambda item: (item.position, item.id),
                ):
                    db.add(QuizVariantOption(
                        variant_question=question,
                        original_option_id=source_option.original_option_id,
                        content=source_option.content,
                        media_url=source_option.media_url,
                        audio_url=source_option.audio_url,
                        is_correct=source_option.is_correct,
                        position=source_option.position,
                    ))

        db.flush()
        quiz.active_variant_set_id = fork.id
        return fork

    def _get_mutable_variant(
        self,
        db: Session,
        quiz: Quiz,
        variant_id: int,
    ) -> tuple[QuizVariantSet, QuizVariant]:
        if not quiz.active_variant_set_id:
            raise QuizVariantMutationError("Generate quiz versions before editing them.")
        variant_set = db.query(QuizVariantSet).filter(
            QuizVariantSet.id == quiz.active_variant_set_id,
            QuizVariantSet.quiz_id == quiz.id,
        ).with_for_update().first()
        if not variant_set:
            raise QuizVariantMutationError("The active version set no longer exists.")
        if variant_set.status in {"PENDING", "GENERATING"}:
            raise QuizVariantMutationError("Wait for version generation to finish before editing.")
        if (
            db.query(Room.id).filter(Room.variant_set_id == variant_set.id).first()
            or db.query(Exam.id).filter(Exam.variant_set_id == variant_set.id).first()
        ):
            raise QuizVariantMutationError(
                "This version set has already been used for delivery and is immutable. Generate a new set instead."
            )
        variant = db.query(QuizVariant).filter(
            QuizVariant.id == variant_id,
            QuizVariant.variant_set_id == variant_set.id,
        ).first()
        if not variant:
            raise QuizVariantMutationError("Generated version not found.")
        if variant.variant_index == 0:
            raise QuizVariantMutationError("Edit the original question through the quiz editor.")
        return variant_set, variant

    def retry(self, db: Session, variant_set: QuizVariantSet) -> QuizVariantSet:
        if variant_set.status not in {"FAILED", "PARTIAL"}:
            raise QuizVariantError("Only failed or partial variant sets can be retried.")
        original = next(
            (variant for variant in variant_set.variants if variant.variant_index == 0),
            None,
        )
        if original is None:
            raise QuizVariantError("Original version A is missing.")
        source_questions = {
            question.original_question_id: question for question in original.questions
        }
        for variant in variant_set.variants:
            if variant.variant_index == 0:
                continue
            for question in variant.questions:
                source = source_questions.get(question.original_question_id)
                if source is None:
                    raise QuizVariantError("A quiz version no longer matches original version A.")
                question.content = source.content
                source_options = {
                    option.original_option_id: option for option in source.options
                }
                for option in question.options:
                    source_option = source_options.get(option.original_option_id)
                    if source_option is None:
                        raise QuizVariantError("A quiz version option lost its source mapping.")
                    option.content = source_option.content
                    option.is_correct = source_option.is_correct
        variant_set.status = "PENDING"
        variant_set.error_message = None
        variant_set.completed_at = None
        variant_set.attempt_count = 0
        for variant in variant_set.variants:
            if variant.variant_index > 0:
                variant.status = "PENDING"
        db.commit()
        db.refresh(variant_set)
        return variant_set

    @staticmethod
    def ready_variants(variant_set: Optional[QuizVariantSet]) -> list[QuizVariant]:
        if not variant_set or variant_set.status != "READY":
            return []
        return [
            variant
            for variant in sorted(variant_set.variants, key=lambda item: item.variant_index)
            if variant.status == "READY"
        ]

    def assign_balanced(self, records: Iterable, variants: list[QuizVariant]) -> None:
        """Persist stable, balanced assignments; never remap an assigned user."""
        if not variants:
            raise QuizVariantNotReadyError("No quiz version is ready for assignment.")
        valid_ids = {variant.id for variant in variants}
        counts = Counter(
            record.quiz_variant_id
            for record in records
            if getattr(record, "quiz_variant_id", None) in valid_ids
        )
        ordered = sorted(variants, key=lambda item: item.variant_index)
        for record in sorted(records, key=lambda item: item.id):
            if getattr(record, "quiz_variant_id", None) in valid_ids:
                continue
            selected = min(ordered, key=lambda variant: (counts[variant.id], variant.variant_index))
            record.quiz_variant_id = selected.id
            counts[selected.id] += 1

    async def process_pending_sets(self, limit: int = 1) -> int:
        processed = 0
        for _ in range(limit):
            variant_set_id = await asyncio.to_thread(self._claim_next_set)
            if variant_set_id is None:
                break
            await self._generate_set(variant_set_id)
            processed += 1
        return processed

    def _claim_next_set(self) -> Optional[int]:
        with SessionLocal() as db:
            now = datetime.utcnow()
            stale_before = now - self.STALE_AFTER
            db.query(QuizVariantSet).filter(
                QuizVariantSet.status == "GENERATING",
                QuizVariantSet.updated_at < stale_before,
                QuizVariantSet.attempt_count < self.MAX_ATTEMPTS,
            ).update(
                {
                    QuizVariantSet.status: "PENDING",
                    QuizVariantSet.error_message: "Generation worker stopped before completion; retrying.",
                    QuizVariantSet.updated_at: now,
                },
                synchronize_session=False,
            )
            db.query(QuizVariantSet).filter(
                QuizVariantSet.status == "GENERATING",
                QuizVariantSet.updated_at < stale_before,
                QuizVariantSet.attempt_count >= self.MAX_ATTEMPTS,
            ).update(
                {
                    QuizVariantSet.status: "FAILED",
                    QuizVariantSet.error_message: "Generation did not complete after the maximum number of attempts.",
                    QuizVariantSet.completed_at: now,
                    QuizVariantSet.updated_at: now,
                },
                synchronize_session=False,
            )
            db.commit()

            query = db.query(QuizVariantSet).filter(
                QuizVariantSet.status == "PENDING",
                QuizVariantSet.attempt_count < self.MAX_ATTEMPTS,
            ).order_by(QuizVariantSet.created_at.asc())
            if db.bind and db.bind.dialect.name == "postgresql":
                query = query.with_for_update(skip_locked=True)
            variant_set = query.first()
            if not variant_set:
                return None
            variant_set.status = "GENERATING"
            variant_set.attempt_count += 1
            variant_set.error_message = None
            db.commit()
            return variant_set.id

    async def _generate_set(self, variant_set_id: int) -> None:
        generation_source = await asyncio.to_thread(
            self._load_generation_source,
            variant_set_id,
        )
        if generation_source is None:
            return
        source_questions, target_indices = generation_source

        if not source_questions:
            await asyncio.to_thread(self._finish_empty_set, variant_set_id)
            return

        generated_counts = Counter()
        model_names: list[str] = []
        errors: list[str] = []
        batches = [
            source_questions[start:start + self.BATCH_SIZE]
            for start in range(0, len(source_questions), self.BATCH_SIZE)
        ]
        semaphore = asyncio.Semaphore(self.MAX_CONCURRENT_BATCHES)
        batch_results = await asyncio.gather(*[
            self._generate_batch(variant_set_id, batch, target_indices, semaphore)
            for batch in batches
        ])
        for validated, model, error_message in batch_results:
            if error_message:
                errors.append(error_message)
                continue
            for item in validated:
                generated_counts[item.variant_index] += 1
            if model:
                model_names.append(model)

        await asyncio.to_thread(
            self._finalize_generation,
            variant_set_id,
            expected_questions=len(source_questions),
            generated_counts=generated_counts,
            model_name=", ".join(dict.fromkeys(model_names))[:100] if model_names else None,
            errors=errors,
        )

    async def _generate_batch(
        self,
        variant_set_id: int,
        batch: list[dict],
        target_indices: list[int],
        semaphore: asyncio.Semaphore,
    ) -> tuple[list, Optional[str], Optional[str]]:
        """Generate and persist one bounded batch with an original fallback."""
        async with semaphore:
            try:
                system_prompt, user_prompt = PromptBuilder.build_quiz_variant_prompts(
                    batch,
                    target_indices,
                )
                payload, model = await LLMOrchestrator.invoke_chat_completion(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    num_questions=len(batch) * len(target_indices),
                    timeout_seconds=90.0,
                    response_schema=quiz_variant_payload_validator.OUTPUT_SCHEMA,
                )
                validated = quiz_variant_payload_validator.validate(
                    payload,
                    batch,
                    target_indices,
                )
                await asyncio.to_thread(
                    self._persist_generated_batch,
                    variant_set_id,
                    validated,
                )
                return validated, model, None
            except Exception as error:
                logger.warning(
                    "Quiz variant batch generation failed for set %s (%s)",
                    variant_set_id,
                    type(error).__name__,
                )
                return [], None, "One AI generation batch failed validation or provider delivery."

    def _load_generation_source(
        self,
        variant_set_id: int,
    ) -> Optional[tuple[list[dict], list[int]]]:
        with SessionLocal() as db:
            variant_set = self._set_query(db).filter(QuizVariantSet.id == variant_set_id).first()
            if not variant_set:
                return None
            original = next(
                (variant for variant in variant_set.variants if variant.variant_index == 0),
                None,
            )
            if original is None:
                self._mark_failed(db, variant_set, "Original version A is missing.")
                return None
            source_questions = [self._question_payload(question) for question in original.questions]
            target_indices = list(range(1, variant_set.requested_count))
            return source_questions, target_indices

    @staticmethod
    def _question_payload(question: QuizVariantQuestion) -> dict:
        return {
            "id": question.original_question_id,
            "type": question.type,
            "content": question.content,
            "options": [
                {
                    "id": option.original_option_id,
                    "content": option.content,
                    "is_correct": option.is_correct,
                }
                for option in question.options
            ],
        }

    @staticmethod
    def _canonical_question_type(value: Optional[str]) -> str:
        normalized = (value or "").strip().lower().replace("_", " ")
        if normalized in {"multiple", "multiple choice"}:
            return "multiple"
        if normalized in {"truefalse", "true false", "true/false"}:
            return "truefalse"
        if normalized in {
            "short",
            "short answer",
            "fill in",
            "fill in the blank",
        }:
            return "short"
        return normalized

    def source_matches_quiz(self, variant_set: QuizVariantSet, quiz: Quiz) -> bool:
        """Return whether Version A is an exact snapshot of the current questions.

        Quiz.version also changes for workflow-only draft saves. Comparing the
        persisted source snapshot lets Publish recover from those harmless
        revision bumps without accepting a genuinely outdated version set.
        """
        original = next(
            (variant for variant in variant_set.variants if variant.variant_index == 0),
            None,
        )
        if original is None:
            return False

        source_questions = sorted(
            quiz.questions,
            key=lambda question: (question.position, question.id),
        )
        snapshot_questions = sorted(
            original.questions,
            key=lambda question: (question.position, question.id),
        )
        if len(source_questions) != len(snapshot_questions):
            return False

        for position, (source, snapshot) in enumerate(
            zip(source_questions, snapshot_questions)
        ):
            if (
                source.position != position
                or snapshot.position != position
                or snapshot.original_question_id != source.id
                or self._canonical_question_type(snapshot.type)
                != self._canonical_question_type(source.type)
                or (snapshot.content or "").strip() != (source.content or "").strip()
                or (snapshot.difficulty or "").strip().casefold()
                != (source.difficulty or "").strip().casefold()
                or snapshot.time_limit != source.time_limit
                or snapshot.audio_play_limit != source.audio_play_limit
                or (snapshot.media_url or "") != (source.media_url or "")
                or (snapshot.audio_url or "") != (source.audio_url or "")
            ):
                return False

            source_options = {option.id: option for option in source.options}
            snapshot_options = {
                option.original_option_id: option
                for option in snapshot.options
                if option.original_option_id is not None
            }
            if (
                len(snapshot_options) != len(snapshot.options)
                or set(snapshot_options) != set(source_options)
            ):
                return False
            for option_id, source_option in source_options.items():
                snapshot_option = snapshot_options[option_id]
                if (
                    (snapshot_option.content or "").strip()
                    != (source_option.content or "").strip()
                    or snapshot_option.is_correct != source_option.is_correct
                    or (snapshot_option.media_url or "")
                    != (source_option.media_url or "")
                    or (snapshot_option.audio_url or "")
                    != (source_option.audio_url or "")
                ):
                    return False

        return True

    def integrity_errors(self, variant_set: QuizVariantSet) -> list[str]:
        """Return delivery-blocking differences introduced during authoring.

        AI output is validated before persistence, but generated questions remain
        editable. This second validation boundary prevents a manual edit from
        silently invalidating equivalence while leaving the snapshot READY.
        """
        errors: list[str] = []

        def add(message: str) -> None:
            if message not in errors:
                errors.append(message)

        variants = sorted(variant_set.variants, key=lambda item: item.variant_index)
        expected_indices = list(range(variant_set.requested_count))
        if [variant.variant_index for variant in variants] != expected_indices:
            add("The version set does not contain every requested version exactly once.")
            return errors

        original = variants[0] if variants else None
        if original is None:
            add("Original version is missing.")
            return errors

        original_questions = sorted(
            original.questions,
            key=lambda question: (question.position, question.id),
        )
        if [question.position for question in original_questions] != list(
            range(len(original_questions))
        ):
            add("Original question positions are not contiguous.")

        original_by_id: dict[int, QuizVariantQuestion] = {}
        for question in original_questions:
            if question.original_question_id is None:
                add("An original question lost its source mapping.")
                continue
            if question.original_question_id in original_by_id:
                add("Original version contains a duplicate source question mapping.")
                continue
            original_by_id[question.original_question_id] = question

        generated_payload: list[dict] = []
        structural_error = bool(errors)
        for variant in variants[1:]:
            questions = sorted(
                variant.questions,
                key=lambda question: (question.position, question.id),
            )
            if len(questions) != len(original_questions):
                add(
                    f"Version {variant.variant_index + 1} must contain "
                    f"{len(original_questions)} questions."
                )
                structural_error = True
            if [question.position for question in questions] != list(range(len(questions))):
                add(f"Version {variant.variant_index + 1} question positions are not contiguous.")
                structural_error = True

            seen_question_ids: set[int] = set()
            for question in questions:
                source_id = question.original_question_id
                source = original_by_id.get(source_id) if source_id is not None else None
                if source is None or source_id in seen_question_ids:
                    add(f"Version {variant.variant_index + 1} has an invalid question mapping.")
                    structural_error = True
                    continue
                seen_question_ids.add(source_id)

                if self._canonical_question_type(question.type) != self._canonical_question_type(source.type):
                    add(f"Version {variant.variant_index + 1} changed a question type.")
                    structural_error = True
                if (question.difficulty or "").strip().casefold() != (
                    source.difficulty or ""
                ).strip().casefold():
                    add(f"Version {variant.variant_index + 1} changed a question difficulty.")
                    structural_error = True
                if question.time_limit != source.time_limit:
                    add(f"Version {variant.variant_index + 1} changed a question time limit.")
                    structural_error = True
                if question.audio_play_limit != source.audio_play_limit:
                    add(f"Version {variant.variant_index + 1} changed an audio play limit.")
                    structural_error = True

                source_options = {
                    option.original_option_id: option
                    for option in source.options
                    if option.original_option_id is not None
                }
                generated_options = {
                    option.original_option_id: option
                    for option in question.options
                    if option.original_option_id is not None
                }
                if (
                    len(source_options) != len(source.options)
                    or len(generated_options) != len(question.options)
                    or set(generated_options) != set(source_options)
                ):
                    add(f"Version {variant.variant_index + 1} changed the answer-option mapping.")
                    structural_error = True
                    continue
                if any(
                    generated_options[source_option_id].is_correct
                    != source_option.is_correct
                    for source_option_id, source_option in source_options.items()
                ):
                    add(f"Version {variant.variant_index + 1} changed the correct-answer mapping.")
                    structural_error = True

                generated_payload.append(
                    {
                        "variant_index": variant.variant_index,
                        "original_question_id": source_id,
                        "content": question.content,
                        "options": [
                            {
                                "source_option_id": option.original_option_id,
                                "content": option.content,
                            }
                            for option in question.options
                        ],
                    }
                )

            if seen_question_ids != set(original_by_id):
                add(f"Version {variant.variant_index + 1} is missing a source question mapping.")
                structural_error = True

        if structural_error:
            return errors

        try:
            quiz_variant_payload_validator.validate(
                {"variants": generated_payload},
                [self._question_payload(question) for question in original_questions],
                expected_indices[1:],
            )
        except QuizVariantValidationError as error:
            add(str(error))
        return errors

    def _refresh_authoring_status(self, db: Session, variant_set_id: int) -> str:
        """Recompute READY/DIRTY from persisted manual edits."""
        db.expire_all()
        variant_set = self._set_query(db).filter(
            QuizVariantSet.id == variant_set_id
        ).populate_existing().first()
        if variant_set is None:
            raise QuizVariantMutationError("The active version set no longer exists.")

        errors = self.integrity_errors(variant_set)
        if errors:
            variant_set.status = "DIRTY"
            variant_set.error_message = (
                "Manual edits made this version set unsafe to publish. "
                + " ".join(errors[:3])
            )[:4000]
        else:
            variant_set.status = "READY"
            variant_set.error_message = None
            for variant in variant_set.variants:
                variant.status = "READY"
        variant_set.updated_at = datetime.utcnow()
        db.flush()
        return variant_set.status

    def _persist_generated_batch(self, variant_set_id: int, generated) -> None:
        with SessionLocal() as db:
            variants = {
                variant.variant_index: variant
                for variant in db.query(QuizVariant).filter(
                    QuizVariant.variant_set_id == variant_set_id
                ).all()
            }
            for item in generated:
                variant = variants[item.variant_index]
                question = db.query(QuizVariantQuestion).filter(
                    QuizVariantQuestion.quiz_variant_id == variant.id,
                    QuizVariantQuestion.original_question_id == item.original_question_id,
                ).first()
                if question is None:
                    raise QuizVariantError("Variant snapshot no longer matches its source.")
                question.content = item.content
                option_by_source = {
                    option.original_option_id: option for option in question.options
                }
                for generated_option in item.options:
                    option = option_by_source[generated_option.source_option_id]
                    option.content = generated_option.content
                    # Position is assigned deterministically when the immutable
                    # snapshot is created.  The model may rewrite option text,
                    # but it is never trusted to control ordering/correctness.
            db.commit()

    def _finalize_generation(
        self,
        variant_set_id: int,
        *,
        expected_questions: int,
        generated_counts: Counter,
        model_name: Optional[str],
        errors: list[str],
    ) -> None:
        with SessionLocal() as db:
            variant_set = self._set_query(db).filter(QuizVariantSet.id == variant_set_id).first()
            if not variant_set:
                return
            generated_total = 0
            all_ready = True
            for variant in variant_set.variants:
                if variant.variant_index == 0:
                    variant.status = "READY"
                    continue
                count = generated_counts[variant.variant_index]
                generated_total += count
                if count == expected_questions:
                    variant.status = "READY"
                else:
                    variant.status = "FALLBACK"
                    all_ready = False
            variant_set.status = "READY" if all_ready else ("PARTIAL" if generated_total else "FAILED")
            variant_set.generation_model = model_name
            variant_set.error_message = "; ".join(errors)[:4000] if errors else None
            variant_set.completed_at = datetime.utcnow()
            db.commit()

    def _finish_empty_set(self, variant_set_id: int) -> None:
        with SessionLocal() as db:
            variant_set = self._set_query(db).filter(QuizVariantSet.id == variant_set_id).first()
            if not variant_set:
                return
            for variant in variant_set.variants:
                variant.status = "READY"
            variant_set.status = "READY"
            variant_set.completed_at = datetime.utcnow()
            db.commit()

    @staticmethod
    def _mark_failed(db: Session, variant_set: QuizVariantSet, message: str) -> None:
        variant_set.status = "FAILED"
        variant_set.error_message = message[:4000]
        variant_set.completed_at = datetime.utcnow()
        db.commit()


quiz_variant_service = QuizVariantService()


async def process_pending_quiz_variant_sets() -> int:
    """APScheduler entry point backed by durable database state."""
    return await quiz_variant_service.process_pending_sets(limit=1)

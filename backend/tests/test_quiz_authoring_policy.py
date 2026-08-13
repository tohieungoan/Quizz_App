from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError

from app.schemas.quiz import QuizCreate
from app.services.quiz_authoring_policy import (
    QuizInActiveRoomError,
    ensure_quiz_is_not_in_active_room,
)
from app.services.quiz_draft_service import QuizNotFoundError, quiz_draft_service


def test_quiz_create_only_accepts_draft_status():
    draft = QuizCreate(title="Safe draft", status="draft")
    assert draft.status == "Draft"

    with pytest.raises(ValidationError):
        QuizCreate(title="Bypassed publish", status="Published")


def test_active_room_blocks_quiz_authoring():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = (123,)

    with pytest.raises(QuizInActiveRoomError, match="waiting or running room"):
        ensure_quiz_is_not_in_active_room(db, quiz_id=42)


def test_finished_or_missing_room_does_not_block_quiz_authoring():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None

    ensure_quiz_is_not_in_active_room(db, quiz_id=42)


def test_draft_lookup_does_not_create_missing_draft():
    db = MagicMock()
    db.query.return_value.options.return_value.filter.return_value.first.return_value = None

    with pytest.raises(QuizNotFoundError, match="Draft not found"):
        quiz_draft_service.get_draft_by_client_id(
            db,
            user_id=7,
            client_draft_id="browser-session-id",
        )

    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_publish_validation_allows_quiz_without_questions():
    quiz = MagicMock()
    quiz.title = "Empty but publishable"
    quiz.questions = []
    quiz.draft_builder_state = None

    errors = quiz_draft_service._validate_publishable(quiz)

    assert errors == []

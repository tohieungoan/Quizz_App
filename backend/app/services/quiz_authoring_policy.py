"""Shared guards for mutating quiz authoring data."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.room import Room


ACTIVE_ROOM_STATUSES = ("WAITING", "PLAYING", "RUNNING", "LIVE")


class QuizInActiveRoomError(Exception):
    """Raised when authoring would mutate a quiz used by an active room."""


def ensure_quiz_is_not_in_active_room(db: Session, quiz_id: int) -> None:
    """Reject mutations while a waiting/live room is using the quiz.

    Callers must lock the Quiz row first. Room creation takes the same lock, so
    the check remains valid until the caller commits or rolls back.
    """
    active_room = db.query(Room.id).filter(
        Room.quiz_id == quiz_id,
        func.upper(func.trim(Room.status)).in_(ACTIVE_ROOM_STATUSES),
    ).first()
    if active_room:
        raise QuizInActiveRoomError(
            "This quiz cannot be edited while it is used by a waiting or running room. End the room first."
        )

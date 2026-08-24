"""Owned Cloudinary asset registry and retryable cleanup workflow."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

import cloudinary
import cloudinary.api
import cloudinary.uploader
import cloudinary.utils
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.quiz import Question, QuestionOption, Quiz, UploadFile
from app.models.quiz_variant import QuizVariantOption, QuizVariantQuestion
from app.utils.cloudinary_utils import extract_public_id, is_managed_cloudinary_url

logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME or "",
    api_key=settings.CLOUDINARY_API_KEY or "",
    api_secret=settings.CLOUDINARY_API_SECRET or "",
    secure=True,
)

MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_VIDEO_AUDIO_SIZE = 50 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/webm",
}


class MediaAssetError(Exception):
    pass


class MediaAssetPermissionError(MediaAssetError):
    pass


class MediaAssetService:
    def ensure_configured(self) -> None:
        if not all(
            [
                settings.CLOUDINARY_CLOUD_NAME,
                settings.CLOUDINARY_API_KEY,
                settings.CLOUDINARY_API_SECRET,
            ]
        ):
            raise MediaAssetError("Cloudinary is not configured on the server.")

    @staticmethod
    def validate_file(file_type: str, file_size: int) -> tuple[str, int]:
        if file_type in ALLOWED_IMAGE_TYPES:
            resource_type, maximum = "image", MAX_IMAGE_SIZE
        elif file_type in ALLOWED_VIDEO_TYPES or file_type in ALLOWED_AUDIO_TYPES:
            resource_type, maximum = "video", MAX_VIDEO_AUDIO_SIZE
        else:
            raise MediaAssetError("Unsupported media type.")
        if file_size <= 0 or file_size > maximum:
            raise MediaAssetError(f"File exceeds the {maximum // (1024 * 1024)}MB limit.")
        return resource_type, maximum

    def create_pending_asset(
        self,
        db: Session,
        user_id: int,
        filename: str,
        file_type: str,
        file_size: int,
        quiz_id: int | None,
    ) -> tuple[UploadFile, dict[str, Any]]:
        self.ensure_configured()
        resource_type, _ = self.validate_file(file_type, file_size)

        if quiz_id is not None:
            quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
            if not quiz or quiz.user_id != user_id:
                raise MediaAssetPermissionError("Quiz not found or not owned by the current user.")

        folder = f"quizz_app/users/{user_id}"
        token = uuid4().hex
        full_public_id = f"{folder}/{token}"
        timestamp = int(datetime.utcnow().timestamp())
        params_to_sign = {
            "folder": folder,
            "overwrite": "false",
            "public_id": token,
            "timestamp": timestamp,
            "unique_filename": "false",
        }
        signature = cloudinary.utils.api_sign_request(
            params_to_sign,
            settings.CLOUDINARY_API_SECRET or "",
        )
        asset = UploadFile(
            user_id=user_id,
            quiz_id=quiz_id,
            filename=filename,
            type=file_type,
            public_id=full_public_id,
            resource_type=resource_type,
            bytes=file_size,
            status="PENDING",
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset, {
            "signature": signature,
            "timestamp": timestamp,
            "api_key": settings.CLOUDINARY_API_KEY or "",
            "cloud_name": settings.CLOUDINARY_CLOUD_NAME or "",
            "folder": folder,
            "public_id": token,
            "resource_type": resource_type,
        }

    def complete_asset(
        self,
        db: Session,
        user_id: int,
        asset_id: int,
        public_id: str,
        secure_url: str,
        resource_type: str,
        reported_bytes: int,
    ) -> UploadFile:
        self.ensure_configured()
        asset = db.query(UploadFile).filter(UploadFile.id == asset_id).with_for_update().first()
        if not asset:
            raise MediaAssetError("Upload reservation not found.")
        if asset.user_id != user_id:
            raise MediaAssetPermissionError("Upload reservation belongs to another user.")
        if asset.status != "PENDING":
            if asset.status in {"READY", "ATTACHED"} and asset.secure_url == secure_url:
                return asset
            raise MediaAssetError("Upload reservation is no longer pending.")
        if asset.public_id != public_id or asset.resource_type != resource_type:
            raise MediaAssetError("Cloudinary upload identity does not match its reservation.")
        if not is_managed_cloudinary_url(secure_url) or extract_public_id(secure_url) != public_id:
            raise MediaAssetError("Cloudinary returned an invalid asset URL.")

        try:
            remote = cloudinary.api.resource(public_id, resource_type=resource_type)
        except Exception as exc:
            raise MediaAssetError("Unable to verify the uploaded asset with Cloudinary.") from exc

        remote_bytes = int(remote.get("bytes") or 0)
        remote_url = remote.get("secure_url")
        if remote_url != secure_url or remote_bytes <= 0 or remote_bytes != reported_bytes:
            raise MediaAssetError("Cloudinary asset metadata verification failed.")
        self.validate_file(asset.type or "", remote_bytes)

        asset.path = secure_url
        asset.secure_url = secure_url
        asset.bytes = remote_bytes
        asset.status = "READY"
        asset.last_error = None
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset

    def request_cleanup(self, db: Session, user_id: int, asset_id: int) -> UploadFile:
        asset = db.query(UploadFile).filter(UploadFile.id == asset_id).with_for_update().first()
        if not asset:
            raise MediaAssetError("Media asset not found.")
        if asset.user_id != user_id:
            raise MediaAssetPermissionError("Media asset belongs to another user.")
        if asset.secure_url and self.is_url_referenced(db, asset.secure_url):
            raise MediaAssetError("Media asset is still referenced by a quiz draft.")
        if asset.status != "DELETED":
            asset.status = "DELETE_PENDING"
            asset.last_error = None
            db.add(asset)
            db.commit()
            db.refresh(asset)
        return asset

    def request_cleanup_by_url(self, db: Session, user_id: int, url: str) -> UploadFile:
        asset = db.query(UploadFile).filter(
            UploadFile.user_id == user_id,
            UploadFile.secure_url == url,
        ).first()
        if not asset:
            raise MediaAssetError("Owned media asset not found for this URL.")
        return self.request_cleanup(db, user_id, asset.id)

    @staticmethod
    def schedule_cleanup_by_urls(db: Session, user_id: int, urls: set[str]) -> None:
        """Persist cleanup intent for owned legacy CRUD operations."""
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
        db.commit()

    @staticmethod
    def _contains_url(value: Any, url: str) -> bool:
        if isinstance(value, dict):
            return any(MediaAssetService._contains_url(item, url) for item in value.values())
        if isinstance(value, list):
            return any(MediaAssetService._contains_url(item, url) for item in value)
        return value == url

    def is_url_referenced(self, db: Session, url: str) -> bool:
        if db.query(Question.id).filter(
            or_(Question.media_url == url, Question.audio_url == url)
        ).first():
            return True
        if db.query(QuestionOption.id).filter(
            or_(QuestionOption.media_url == url, QuestionOption.audio_url == url)
        ).first():
            return True
        if db.query(QuizVariantQuestion.id).filter(
            or_(QuizVariantQuestion.media_url == url, QuizVariantQuestion.audio_url == url)
        ).first():
            return True
        if db.query(QuizVariantOption.id).filter(
            or_(QuizVariantOption.media_url == url, QuizVariantOption.audio_url == url)
        ).first():
            return True
        draft_states = db.query(Quiz.draft_builder_state).filter(
            Quiz.draft_builder_state.isnot(None)
        ).all()
        return any(self._contains_url(state, url) for (state,) in draft_states)

    def process_cleanup_batch(self, limit: int = 50) -> int:
        db = SessionLocal()
        processed = 0
        try:
            stale_pending_before = datetime.utcnow() - timedelta(hours=24)
            assets = db.query(UploadFile).filter(
                UploadFile.public_id.isnot(None),
                or_(
                    UploadFile.status == "DELETE_PENDING",
                    (UploadFile.status == "DELETE_FAILED") & (UploadFile.delete_attempts < 5),
                    (UploadFile.status == "PENDING") & (UploadFile.upload_at < stale_pending_before),
                )
            ).order_by(UploadFile.updated_at.asc()).limit(limit).all()

            for asset in assets:
                if asset.secure_url and self.is_url_referenced(db, asset.secure_url):
                    asset.status = "ATTACHED"
                    asset.last_error = None
                    db.commit()
                    continue
                try:
                    result = cloudinary.uploader.destroy(
                        asset.public_id,
                        resource_type=asset.resource_type or "image",
                        invalidate=True,
                    )
                    if result.get("result") not in {"ok", "not found"}:
                        raise RuntimeError(f"Cloudinary deletion returned {result!r}")
                    asset.status = "DELETED"
                    asset.deleted_at = datetime.utcnow()
                    asset.last_error = None
                    processed += 1
                except Exception as exc:
                    asset.delete_attempts += 1
                    asset.status = "DELETE_FAILED"
                    asset.last_error = str(exc)[:2000]
                    logger.exception("Cloudinary cleanup failed for asset %s", asset.id)
                db.commit()
        finally:
            db.close()
        return processed


media_asset_service = MediaAssetService()


def process_media_cleanup_jobs() -> None:
    """Scheduler entry point. Pending rows make cleanup restart-safe."""
    media_asset_service.process_cleanup_batch()

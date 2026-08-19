"""Authenticated Cloudinary upload reservations and owned asset cleanup."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.schemas.upload import (
    UploadAssetResponse,
    UploadCompleteRequest,
    UploadSignatureRequest,
    UploadSignatureResponse,
)
from app.services.media_asset_service import (
    MediaAssetError,
    MediaAssetPermissionError,
    media_asset_service,
)

router = APIRouter()


def _raise_media_error(error: MediaAssetError) -> None:
    if isinstance(error, MediaAssetPermissionError):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    message = str(error)
    code = status.HTTP_503_SERVICE_UNAVAILABLE if "not configured" in message else status.HTTP_400_BAD_REQUEST
    raise HTTPException(status_code=code, detail=message)


@router.post(
    "/request-signature",
    response_model=UploadSignatureResponse,
    summary="Reserve an owned Cloudinary asset and issue a scoped signature",
)
def request_upload_signature(
    request: UploadSignatureRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    try:
        asset, signed = media_asset_service.create_pending_asset(
            db,
            user_id=current_user.id,
            filename=request.fileName,
            file_type=request.fileType,
            file_size=request.fileSize,
            quiz_id=request.quizId,
        )
        return UploadSignatureResponse(asset_id=asset.id, **signed)
    except MediaAssetError as error:
        db.rollback()
        _raise_media_error(error)


@router.post(
    "/complete",
    response_model=UploadAssetResponse,
    summary="Verify Cloudinary metadata and activate an uploaded asset",
)
def complete_upload(
    request: UploadCompleteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    try:
        return media_asset_service.complete_asset(
            db,
            user_id=current_user.id,
            asset_id=request.asset_id,
            public_id=request.public_id,
            secure_url=request.secure_url,
            resource_type=request.resource_type,
            reported_bytes=request.bytes,
        )
    except MediaAssetError as error:
        db.rollback()
        _raise_media_error(error)


@router.delete(
    "/assets/{asset_id}",
    response_model=UploadAssetResponse,
    summary="Schedule deletion of an unreferenced owned asset",
)
def delete_owned_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    try:
        return media_asset_service.request_cleanup(db, current_user.id, asset_id)
    except MediaAssetError as error:
        db.rollback()
        _raise_media_error(error)


@router.delete(
    "/delete-asset",
    response_model=UploadAssetResponse,
    summary="Schedule deletion by URL after resolving server-side ownership",
)
def delete_asset_by_url(
    url: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> Any:
    """Compatibility endpoint; unlike the old API it never deletes arbitrary URLs."""
    try:
        return media_asset_service.request_cleanup_by_url(db, current_user.id, url)
    except MediaAssetError as error:
        db.rollback()
        _raise_media_error(error)

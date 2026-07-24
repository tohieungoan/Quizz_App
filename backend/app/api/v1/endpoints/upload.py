import time
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
import cloudinary
import cloudinary.utils
from app.api.deps import get_current_active_admin
from app.core.config import settings
from app.schemas.upload import UploadSignatureRequest, UploadSignatureResponse
from app.utils.cloudinary_utils import delete_cloudinary_asset_bg

router = APIRouter()

# Initialize Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

# File size limits (in bytes)
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_VIDEO_AUDIO_SIZE = 50 * 1024 * 1024  # 50MB

@router.post("/request-signature", response_model=UploadSignatureResponse, summary="Request a Cloudinary upload signature")
async def request_upload_signature(
    request: UploadSignatureRequest
):
    """
    Generate a secure signature for direct client-to-cloud upload.
    Validates file type and size before granting permission.
    """
    
    # 1. Validate File Type
    if not (request.fileType.startswith("image/") or request.fileType.startswith("video/") or request.fileType.startswith("audio/")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only images, videos, and audio files are allowed."
        )

    # 2. Validate File Size
    if request.fileType.startswith("image/"):
        if request.fileSize > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image file size exceeds the maximum limit of {MAX_IMAGE_SIZE // (1024 * 1024)}MB."
            )
    else:
        if request.fileSize > MAX_VIDEO_AUDIO_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Media file size exceeds the maximum limit of {MAX_VIDEO_AUDIO_SIZE // (1024 * 1024)}MB."
            )

    # 3. Generate Signature
    timestamp = int(time.time())
    folder = "quizz_app"
    
    params_to_sign = {
        "timestamp": timestamp,
        "folder": folder
    }
    
    signature = cloudinary.utils.api_sign_request(
        params_to_sign, 
        settings.CLOUDINARY_API_SECRET
    )

    return UploadSignatureResponse(
        signature=signature,
        timestamp=timestamp,
        api_key=settings.CLOUDINARY_API_KEY,
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        folder=folder
    )

@router.delete("/delete-asset", summary="Delete a Cloudinary asset by URL (for draft cleanup)")
async def delete_asset(
    url: str,
    background_tasks: BackgroundTasks,
    current_admin=Depends(get_current_active_admin)
):
    """
    Safely delete an asset from Cloudinary by its secure URL.
    Used by frontend to clean up orphaned uploads during the draft creation process.
    Requires Admin privileges.
    """
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
        
    background_tasks.add_task(delete_cloudinary_asset_bg, url)
    return {"detail": "Asset deletion scheduled"}

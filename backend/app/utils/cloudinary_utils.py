import logging
import cloudinary
import cloudinary.uploader
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Ensure cloudinary is configured globally when this module is imported
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

def extract_public_id(url: str) -> Optional[str]:
    """
    Extract the Cloudinary public_id from a full secure_url.
    Handles URLs with or without transformations and versions.
    Example: https://res.cloudinary.com/demo/image/upload/c_scale/v1234/quizz_app/file.jpg -> quizz_app/file
    """
    if not url or "cloudinary.com" not in url:
        return None
        
    try:
        # Split to get the path after /upload/
        parts = url.split("/upload/")
        if len(parts) < 2:
            return None
            
        path_after_upload = parts[1]
        
        # By default, all our files are stored in the 'quizz_app' directory.
        # The safest approach is to locate the 'quizz_app' prefix and extract everything after it.
        root_folder = "quizz_app"
        
        if root_folder in path_after_upload:
            # Extract starting from 'quizz_app/...'
            public_id_with_ext = path_after_upload[path_after_upload.find(root_folder):]
        else:
            # Fallback in case quizz_app folder is not in the path
            path_parts = path_after_upload.split("/")
            # Skip transformation properties (often contains comma) or version (e.g. v1234)
            while path_parts and ("," in path_parts[0] or (path_parts[0].startswith("v") and path_parts[0][1:].isdigit())):
                path_parts.pop(0)
            public_id_with_ext = "/".join(path_parts)
        
        # Strip file extension (.jpg, .mp3, etc.)
        public_id = public_id_with_ext.rsplit(".", 1)[0]
        return public_id
    except Exception as e:
        logger.error(f"Error extracting public_id from {url}: {e}")
        return None

def delete_cloudinary_asset_bg(url: str, resource_type: str = None):
    """
    Background task function to safely delete an asset from Cloudinary.
    """
    if not url:
        return
        
    public_id = extract_public_id(url)
    if not public_id:
        return
        
    # Auto-detect resource type if not provided (Cloudinary treats audio as video)
    if not resource_type:
        resource_type = "video" if "/video/upload/" in url else "image"
        
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type, invalidate=True)
        logger.info(f"Deleted Cloudinary asset {public_id}: {result}")
        # Debug log to file to ensure it's running
        with open("cloudinary_debug.log", "a") as f:
            f.write(f"SUCCESS: Deleted {public_id} - Result: {result}\n")
    except Exception as e:
        logger.error(f"Failed to delete Cloudinary asset {public_id}: {e}")
        with open("cloudinary_debug.log", "a") as f:
            f.write(f"ERROR: Failed to delete {public_id} - {e}\n")
import logging
from typing import Optional
from urllib.parse import unquote, urlparse
from app.core.config import settings

logger = logging.getLogger(__name__)

def is_managed_cloudinary_url(url: str) -> bool:
    """Return True only for assets in this app's configured Cloudinary folder."""
    if not url or not settings.CLOUDINARY_CLOUD_NAME:
        return False
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "res.cloudinary.com":
        return False
    path_parts = [unquote(part) for part in parsed.path.split("/") if part]
    return (
        len(path_parts) >= 5
        and path_parts[0] == settings.CLOUDINARY_CLOUD_NAME
        and "upload" in path_parts
        and "quizz_app" in path_parts
    )


def extract_public_id(url: str) -> Optional[str]:
    """
    Extract the Cloudinary public_id from a full secure_url.
    Handles URLs with or without transformations and versions.
    Example: https://res.cloudinary.com/demo/image/upload/c_scale/v1234/quizz_app/file.jpg -> quizz_app/file
    """
    if not is_managed_cloudinary_url(url):
        return None
        
    try:
        parsed = urlparse(url)
        path_parts = [unquote(part) for part in parsed.path.split("/") if part]
        try:
            upload_index = path_parts.index("upload")
            folder_index = path_parts.index("quizz_app", upload_index + 1)
        except ValueError:
            return None
        public_id_with_ext = "/".join(path_parts[folder_index:])
        public_id = public_id_with_ext.rsplit(".", 1)[0]
        return public_id
    except Exception as e:
        logger.error(f"Error extracting public_id from {url}: {e}")
        return None

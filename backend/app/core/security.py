"""
Security, hashing and token processing.
Includes: Password hashing (with bcrypt), password verification, creating and verifying JWT Access Token.
"""
from datetime import datetime, timedelta
from typing import Any, Union
import bcrypt
from jose import jwt
from app.core.config import settings

ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    if not plain_password or not hashed_password:
        return False
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt."""
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """Create JWT Access Token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def generate_refresh_token_string() -> str:
    """Generate a random secure Refresh Token string."""
    import secrets
    return secrets.token_urlsafe(64)


def create_password_reset_token(email: str, password_hash: str, updated_at: Any = None) -> str:
    """Create JWT Token for password reset (only the newest link is valid & one-time use, 15 minutes expiry)."""
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": email, "type": "reset_password"}
    updated_str = str(updated_at) if updated_at else ""
    secret = f"{settings.SECRET_KEY}{password_hash}{updated_str}"
    encoded_jwt = jwt.encode(to_encode, secret, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password_reset_token(token: str, password_hash: str, updated_at: Any = None) -> Union[str, None]:
    """Verify password reset Token. Returns email if valid and token is the newest version."""
    try:
        updated_str = str(updated_at) if updated_at else ""
        secret = f"{settings.SECRET_KEY}{password_hash}{updated_str}"
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        if payload.get("type") != "reset_password":
            return None
        email: str = payload.get("sub")
        return email
    except Exception:
        return None


def create_email_verification_token(email: str) -> str:
    """Create JWT Token for Email verification (expires in 24 hours)."""
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"exp": expire, "sub": email, "type": "verify_email"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_email_verification_token(token: str) -> Union[str, None]:
    """Verify Email verification Token and return email if valid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "verify_email":
            return None
        email: str = payload.get("sub")
        return email
    except Exception:
        return None


def create_notification_email_verification_token(user_id: int, new_email: str) -> str:
    """Generate JWT token to verify notification email (expires in 2 hours)."""
    expire = datetime.utcnow() + timedelta(hours=2)
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "new_email": new_email,
        "type": "verify_notification_email"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_notification_email_verification_token(token: str) -> Union[dict, None]:
    """Verify notification email JWT token. Returns dict with user_id and new_email if valid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "verify_notification_email":
            return None
        return {
            "user_id": int(payload.get("sub")),
            "new_email": payload.get("new_email")
        }
    except Exception:
        return None










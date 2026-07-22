"""
Xử lý bảo mật, mã hóa và token.
Bao gồm: Mã hóa mật khẩu (hashing với bcrypt), kiểm tra mật khẩu, tạo và verify JWT Access Token.
"""
from datetime import datetime, timedelta
from typing import Any, Union
import bcrypt
from jose import jwt
from app.core.config import settings

ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra mật khẩu thô với mật khẩu đã mã hóa."""
    if not plain_password or not hashed_password:
        return False
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Mã hóa mật khẩu bằng bcrypt."""
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """Tạo JWT Access Token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def generate_refresh_token_string() -> str:
    """Tạo chuỗi Refresh Token bảo mật ngẫu nhiên."""
    import secrets
    return secrets.token_urlsafe(64)


def create_password_reset_token(email: str, password_hash: str, updated_at: Any = None) -> str:
    """Tạo JWT Token để khôi phục mật khẩu (chỉ link mới nhất có hiệu lực & dùng 1 lần, hạn 15 phút)."""
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": email, "type": "reset_password"}
    updated_str = str(updated_at) if updated_at else ""
    secret = f"{settings.SECRET_KEY}{password_hash}{updated_str}"
    encoded_jwt = jwt.encode(to_encode, secret, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password_reset_token(token: str, password_hash: str, updated_at: Any = None) -> Union[str, None]:
    """Xác thực Token khôi phục mật khẩu. Trả về email nếu hợp lệ và token là phiên bản mới nhất chưa bị thay thế."""
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
    """Tạo JWT Token để xác minh Email (hạn 24 giờ)."""
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"exp": expire, "sub": email, "type": "verify_email"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_email_verification_token(token: str) -> Union[str, None]:
    """Xác thực Token xác minh Email và trả về email nếu hợp lệ."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "verify_email":
            return None
        email: str = payload.get("sub")
        return email
    except Exception:
        return None









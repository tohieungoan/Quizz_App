"""
Các dependency dùng chung cho API.
Ví dụ: get_db (kết nối database session), get_current_user (xác thực người dùng từ token).
"""
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.crud.crud_user import crud_user
from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.token import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2),
) -> User:
    """Xác thực JWT Token và trả về thông tin User hiện tại."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token không hợp lệ",
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token không hợp lệ hoặc đã hết hạn",
        )
    user = crud_user.get_by_id(db, user_id=int(token_data.sub))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng sở hữu token này",
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Kiểm tra user hiện tại có đang hoạt động (ACTIVE) không."""
    if current_user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản chưa được kích hoạt hoặc đã bị khóa",
        )
    return current_user


def get_current_active_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Kiểm tra user hiện tại có quyền Admin hoặc Super Admin không."""
    if current_user.role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền thực hiện thao tác này (Yêu cầu quyền Admin)",
        )
    return current_user


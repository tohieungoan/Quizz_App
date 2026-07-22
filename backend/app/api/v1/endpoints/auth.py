"""
API Endpoints cho việc xác thực (Authentication).
Bao gồm: Login (lấy JWT & Refresh token), Refresh Token, Register, Logout...
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core import security
from app.crud.crud_user import crud_user
from app.models.user import User
from app.schemas.token import Token, TokenRefreshRequest
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.post("/login", response_model=Token, summary="Đăng nhập nhận Access Token & Refresh Token")
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Đăng nhập bằng **OAuth2 Form Data**.
    Trả về cả `access_token` (ngắn hạn) và `refresh_token` (dài hạn).
    """
    user = crud_user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email hoặc mật khẩu không chính xác",
        )
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt",
        )

    # Sinh Access Token & Refresh Token
    access_token = security.create_access_token(subject=user.id)
    refresh_token_obj = crud_user.create_refresh_token(db, user_id=user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_obj.token,
        "token_type": "bearer",
    }


@router.post("/refresh-token", response_model=Token, summary="Gia hạn Access Token từ Refresh Token")
def refresh_token(
    body: TokenRefreshRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Gửi `refresh_token` hợp lệ để nhận lại `access_token` mới khi token cũ hết hạn.
    """
    db_token = crud_user.get_refresh_token(db, token=body.refresh_token)
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh Token không hợp lệ hoặc đã hết hạn/bị thu hồi",
        )

    user = crud_user.get_by_id(db, user_id=db_token.user_id)
    if not user or user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại hoặc đã bị khóa",
        )

    # Cấp Access Token mới và giữ nguyên Refresh Token cũ
    new_access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": new_access_token,
        "refresh_token": db_token.token,
        "token_type": "bearer",
    }


@router.post("/logout", summary="Đăng xuất (Thu hồi Refresh Token)")
def logout(
    body: TokenRefreshRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Vô hiệu hóa Refresh Token khi người dùng Đăng xuất.
    """
    crud_user.revoke_refresh_token(db, token=body.refresh_token)
    return {"message": "Đăng xuất thành công"}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Đăng ký tài khoản người dùng")
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> Any:
    """
    Đăng ký tài khoản mới cho người dùng.
    """
    existing_user = crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký trước đó.",
        )
    user = crud_user.create(db, obj_in=user_in)
    return user


@router.get("/me", response_model=UserResponse, summary="Lấy thông tin tài khoản đang đăng nhập")
def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Trả về thông tin hồ sơ của người dùng đang đăng nhập thông qua Bearer Token.
    """
    return current_user



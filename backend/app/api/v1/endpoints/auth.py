from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_active_user
from app.core import security
from app.core.email import send_reset_password_email, send_verification_email
from app.crud.crud_user import crud_user
from app.models.user import User
from app.schemas.token import Token, TokenRefreshRequest
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserForgotPassword,
    UserResetPassword,
    UserChangePassword,
    UserVerifyEmail,
    UserResendVerification,
)

router = APIRouter()


@router.post("/login", response_model=Token, summary="Đăng nhập nhận Access Token & Refresh Token")
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Đăng nhập bằng **OAuth2 Form Data**.
    Trả về cả `access_token` (ngắn hạn) và `refresh_token` (dài hạn).
    Yêu cầu: Tài khoản phải được xác minh Email trước khi đăng nhập.
    """
    user = crud_user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email hoặc mật khẩu không chính xác",
        )

    # Kiểm tra xem Email đã được xác minh chưa
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is not verified. Please check your inbox or resend the verification link.",
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Any:
    """
    Đăng ký tài khoản mới cho người dùng.
    Mặc định tạo tài khoản ở trạng thái chưa xác minh Email (`email_verified = False`),
    đồng thời tự động gửi Email xác minh tài khoản qua SMTP.
    """
    existing_user = crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký trước đó.",
        )
    
    # Tạo user mới (với email_verified = False và status = UNVERIFIED)
    user = crud_user.create(db, obj_in=user_in)
    user.email_verified = False
    user.status = "UNVERIFIED"
    db.add(user)
    db.commit()
    db.refresh(user)

    # Sinh token xác minh Email và gửi mail ngầm
    verify_token = security.create_email_verification_token(email=user.email)
    verify_url = f"http://localhost:5173/verify-email?token={verify_token}"
    background_tasks.add_task(send_verification_email, email_to=user.email, verify_url=verify_url)

    return user


@router.post("/verify-email", summary="Xác minh địa chỉ Email qua Token")
def verify_email(
    body: UserVerifyEmail,
    db: Session = Depends(get_db),
) -> Any:
    """
    Kích hoạt tài khoản người dùng khi người dùng click vào liên kết xác minh từ Email.
    """
    email = security.verify_email_verification_token(body.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired email verification token.",
        )

    user = crud_user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.email_verified:
        return {"message": "Email is already verified. You can now log in."}

    user.email_verified = True
    user.status = "ACTIVE"
    db.add(user)
    db.commit()

    return {"message": "Email address verified successfully! You can now log in."}


@router.post("/resend-verification", summary="Gửi lại Email xác minh tài khoản")
def resend_verification(
    body: UserResendVerification,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Any:
    """
    Gửi lại email chứa liên kết kích hoạt tài khoản nếu người dùng chưa nhận được mail.
    """
    user = crud_user.get_by_email(db, email=body.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This email address is not registered in our system.",
        )

    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already verified.",
        )

    verify_token = security.create_email_verification_token(email=user.email)
    verify_url = f"http://localhost:5173/verify-email?token={verify_token}"
    background_tasks.add_task(send_verification_email, email_to=user.email, verify_url=verify_url)

    return {"message": "Verification email has been resent successfully."}



@router.post("/forgot-password", summary="Yêu cầu đặt lại mật khẩu (Tạo Reset Token & Gửi Email)")
def forgot_password(
    body: UserForgotPassword,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Any:
    """
    Gửi yêu cầu Quên mật khẩu.
    Kiểm tra xem email có tồn tại trong CSDL hay không:
    - Nếu không có: Trả về lỗi 404 Email này chưa được đăng ký trong hệ thống.
    - Nếu link cũ vẫn còn thời hạn (trong vòng 15 phút): Tái sử dụng lại link cũ đó.
    - Nếu link cũ đã quá 15 phút: Tạo mốc mới và cấp link mới.
    Đồng thời gửi Email thực tế qua SMTP server bằng BackgroundTask.
    """
    from datetime import datetime, timedelta
    user = crud_user.get_by_email(db, email=body.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This email address is not registered in our system.",
        )

    # Nếu chưa từng tạo hoặc đã quá 15 phút kể từ lần yêu cầu trước đó -> Cập nhật mốc updated_at mới
    now = datetime.utcnow()
    if not user.updated_at or (now - user.updated_at) >= timedelta(minutes=15):
        user.updated_at = now
        db.add(user)
        db.commit()
        db.refresh(user)

    reset_token = security.create_password_reset_token(
        email=user.email,
        password_hash=user.password or "",
        updated_at=user.updated_at,
    )
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"

    # Gửi Email thực tế chạy ngầm bằng Background Tasks
    background_tasks.add_task(send_reset_password_email, email_to=user.email, reset_url=reset_url)

    return {
        "message": "Password reset instructions have been sent to your email.",
    }




@router.post("/reset-password", summary="Đặt lại mật khẩu mới bằng Token khôi phục")
def reset_password(
    body: UserResetPassword,
    db: Session = Depends(get_db),
) -> Any:
    """
    Đặt lại mật khẩu mới thông qua Token khôi phục đã nhận từ API `/forgot-password`.
    Chỉ có duy nhất đường dẫn MỚI NHẤT có hiệu lực và dùng 1 lần trong vòng 15 phút.
    """
    from jose import jwt as jose_jwt

    try:
        unverified_payload = jose_jwt.get_unverified_claims(body.token)
        email = unverified_payload.get("sub")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token khôi phục mật khẩu không hợp lệ",
        )

    user = crud_user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng",
        )

    # Xác thực token với chữ ký số chứa password_hash & updated_at của user hiện tại
    verified_email = security.verify_password_reset_token(
        body.token,
        password_hash=user.password or "",
        updated_at=user.updated_at,
    )
    if not verified_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Liên kết đổi mật khẩu này không hợp lệ, đã bị thay thế bởi liên kết mới hơn hoặc đã hết hạn.",
        )

    # Cập nhật mật khẩu mới
    crud_user.update(db, db_obj=user, obj_in={"password": body.new_password})
    # Xóa sạch các phiên làm việc (Refresh Token) cũ để yêu cầu đăng nhập lại bằng mật khẩu mới
    crud_user.delete_all_user_refresh_tokens(db, user_id=user.id)

    return {"message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới."}




@router.post("/change-password", summary="Đổi mật khẩu (dành cho người dùng đã đăng nhập)")
def change_password(
    body: UserChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Đổi mật khẩu trực tiếp cho tài khoản đang đăng nhập.
    """
    if not security.verify_password(body.old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không chính xác",
        )

    crud_user.update(db, db_obj=current_user, obj_in={"password": body.new_password})
    crud_user.delete_all_user_refresh_tokens(db, user_id=current_user.id)

    return {"message": "Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới."}


@router.get("/me", response_model=UserResponse, summary="Lấy thông tin tài khoản đang đăng nhập")
def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Trả về thông tin hồ sơ của người dùng đang đăng nhập thông qua Bearer Token.
    """
    return current_user




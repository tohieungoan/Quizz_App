from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_active_user
from app.core.config import settings
from app.core import security
from app.core.email import send_reset_password_email, send_verification_email
import secrets
import json
from app.core.redis import set_token, get_token, delete_token
from app.crud.crud_user import crud_user
from app.models.user import User, UserSetting
from app.schemas.token import Token, TokenRefreshRequest, SocialLoginIn
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


@router.post("/login", response_model=Token, summary="Login to receive Access Token & Refresh Token")
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Login using **OAuth2 Form Data**.
    Returns both `access_token` (short-lived) and `refresh_token` (long-lived).
    Requirement: User email must be verified before logging in.
    """
    user = crud_user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password.",
        )

    # Check if Email has been verified
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is not verified. Please check your inbox or resend the verification link.",
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account has been locked or is not activated.",
        )

    # Generate Access Token & Refresh Token
    access_token = security.create_access_token(subject=user.id)
    refresh_token_obj = crud_user.create_refresh_token(db, user_id=user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_obj.token,
        "token_type": "bearer",
    }


@router.post("/refresh-token", response_model=Token, summary="Refresh Access Token using Refresh Token")
def refresh_token(
    body: TokenRefreshRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Submit a valid `refresh_token` to receive a new `access_token` when the old one expires.
    """
    db_token = crud_user.get_refresh_token(db, token=body.refresh_token)
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked refresh token.",
        )

    user = crud_user.get_by_id(db, user_id=db_token.user_id)
    if not user or user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account does not exist or has been locked.",
        )

    # Issue new Access Token and retain existing Refresh Token
    new_access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": new_access_token,
        "refresh_token": db_token.token,
        "token_type": "bearer",
    }


@router.post("/logout", summary="Logout (Revoke Refresh Token)")
def logout(
    body: TokenRefreshRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Revoke Refresh Token when the user logs out.
    """
    crud_user.revoke_refresh_token(db, token=body.refresh_token)
    return {"message": "Logout successful."}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Register user account")
async def register_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Any:
    """
    Register a new user account.
    By default, creates the account in an unverified state (`email_verified = False`),
    and automatically sends a verification email via SMTP in the background.
    """
    existing_user = crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already registered.",
        )
    
    # Create new user
    user = crud_user.create(db, obj_in=user_in)
    
    # If SMTP is not configured, auto-activate user for easier local development
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        user.email_verified = True
        user.status = "ACTIVE"
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.email_verified = False
        user.status = "UNVERIFIED"
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Generate email verification token and send email in background
        verify_token = secrets.token_urlsafe(32)
        await set_token(f"verify_email:{verify_token}", user.email, expire_seconds=86400)
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"
        background_tasks.add_task(send_verification_email, email_to=user.email, verify_url=verify_url)

    return user


@router.post("/verify-email", summary="Verify email address using verification token")
async def verify_email(
    body: UserVerifyEmail,
    db: Session = Depends(get_db),
) -> Any:
    """
    Activate user account when the user clicks the verification link in their email.
    """
    email = await get_token(f"verify_email:{body.token}")
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
        await delete_token(f"verify_email:{body.token}")
        return {"message": "Email is already verified. You can now log in."}

    user.email_verified = True
    user.status = "ACTIVE"
    db.add(user)
    db.commit()

    await delete_token(f"verify_email:{body.token}")
    return {"message": "Email address verified successfully! You can now log in."}


@router.post("/verify-notification-email", summary="Verify and update user notification email using token")
async def verify_notification_email(
    body: UserVerifyEmail,
    db: Session = Depends(get_db),
) -> Any:
    """
    Verify notification email address via verification token.
    Updates the notification email in user_settings table.
    """
    token_data_str = await get_token(f"verify_notification_email:{body.token}")
    if not token_data_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired notification email verification token.",
        )

    try:
        token_data = json.loads(token_data_str)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired notification email verification token.",
        )

    user_id = token_data["user_id"]
    new_email = token_data["new_email"]

    user = crud_user.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Double check if this email is already registered as notification email by another user
    existing_setting = db.query(UserSetting).filter(
        UserSetting.notification_email == new_email,
        UserSetting.user_id != user_id
    ).first()
    if existing_setting:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already in use by another account for notifications."
        )

    settings_obj = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if not settings_obj:
        settings_obj = UserSetting(user_id=user_id, notification_email=new_email)
        db.add(settings_obj)
    else:
        settings_obj.notification_email = new_email
        db.add(settings_obj)
    
    db.commit()
    await delete_token(f"verify_notification_email:{body.token}")
    return {"message": "Notification email verified and updated successfully!"}



@router.post("/resend-verification", summary="Resend account verification email")
async def resend_verification(
    body: UserResendVerification,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Any:
    """
    Resend verification link if user did not receive it.
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

    verify_token = secrets.token_urlsafe(32)
    await set_token(f"verify_email:{verify_token}", user.email, expire_seconds=86400)
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"
    background_tasks.add_task(send_verification_email, email_to=user.email, verify_url=verify_url)

    return {"message": "Verification email has been resent successfully."}


@router.post("/forgot-password", summary="Request password reset (Generate Token & Send Email)")
async def forgot_password(
    body: UserForgotPassword,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Any:
    """
    Request password reset link.
    Verifies if email exists in database:
    - If not found: Returns 404 error.
    - If found, generates a new reset token and saves it in Redis (TTL = 15 minutes).
    Sends the reset link email via SMTP using a BackgroundTask.
    """
    user = crud_user.get_by_email(db, email=body.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This email address is not registered in our system.",
        )

    reset_token = secrets.token_urlsafe(32)
    await set_token(f"reset_password:{reset_token}", user.email, expire_seconds=900)
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    background_tasks.add_task(send_reset_password_email, email_to=user.email, reset_url=reset_url)

    return {
        "message": "Password reset instructions have been sent to your email.",
    }


@router.post("/reset-password", summary="Reset password using recovery token")
async def reset_password(
    body: UserResetPassword,
    db: Session = Depends(get_db),
) -> Any:
    """
    Reset password using verification token from /forgot-password endpoint.
    Only the latest generated token is active and it can only be used once within 15 minutes.
    """
    email = await get_token(f"reset_password:{body.token}")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid, expired, or has been superseded by a newer request.",
        )

    user = crud_user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    crud_user.update(db, db_obj=user, obj_in={"password": body.new_password})
    crud_user.delete_all_user_refresh_tokens(db, user_id=user.id)
    await delete_token(f"reset_password:{body.token}")

    return {"message": "Password reset successfully. Please log in again with your new password."}


@router.post("/change-password", summary="Change password (for logged-in users)")
def change_password(
    body: UserChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Change password for the currently logged-in account.
    """
    if not current_user.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account does not have a local password set.",
        )

    if not security.verify_password(body.old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    crud_user.update(db, db_obj=current_user, obj_in={"password": body.new_password})
    crud_user.delete_all_user_refresh_tokens(db, user_id=current_user.id)

    return {"message": "Password changed successfully. Please log in again with your new password."}


@router.get("/me", response_model=UserResponse, summary="Get profile of currently logged-in user")
def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Return user profile info using Bearer Token.
    """
    return current_user


import urllib.request
import json
import secrets


def get_google_user_info(access_token: str) -> dict:
    url = "https://www.googleapis.com/oauth2/v3/userinfo"
    try:
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"Bearer {access_token}")
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if "error" in data:
                raise ValueError(data.get("error_description") or "Invalid token")
            return {
                "email": data["email"],
                "name": data.get("name") or data.get("given_name") or "Google User",
                "provider_id": data["sub"],
                "avatar": data.get("picture")
            }
    except Exception as e:
        raise ValueError(f"Google token validation failed: {str(e)}")


@router.post("/social", response_model=Token, summary="Login / Register using Google token")
def social_login(
    body: SocialLoginIn,
    db: Session = Depends(get_db)
) -> Any:
    """
    Login or auto-register using social provider token (Google ID Token).
    """
    provider = body.provider.lower()
    token = body.token

    email = None
    name = "Social User"
    provider_id = None
    avatar = None

    try:
        if provider == "google":
            info = get_google_user_info(token)
            email = info["email"]
            name = info["name"]
            provider_id = info["provider_id"]
            avatar = info["avatar"]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported social provider: {body.provider}"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Find user in DB
    user = crud_user.get_by_email(db, email=email)
    from datetime import datetime
    
    if not user:
        # Create a new user with random password
        from app.models.user import User as UserModel
        from app.core.security import get_password_hash
        random_password = secrets.token_urlsafe(16)
        
        user = UserModel(
            email=email,
            fullname=name,
            password=get_password_hash(random_password),
            role="USER",
            status="ACTIVE",
            email_verified=True,
            auth_provider=provider.upper(),
            provider_id=provider_id,
            avatar=avatar,
            last_login=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update existing user metadata and record the last login timestamp
        user.last_login = datetime.utcnow()
        if avatar and not user.avatar:
            user.avatar = avatar
        if not user.provider_id:
            user.provider_id = provider_id
            user.auth_provider = provider.upper()
        db.commit()
        db.refresh(user)

    # Check active status
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account has been deactivated or locked."
        )

    # Issue JWT tokens
    access_token = security.create_access_token(subject=user.id)
    refresh_token_obj = crud_user.create_refresh_token(db, user_id=user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_obj.token,
        "token_type": "bearer"
    }

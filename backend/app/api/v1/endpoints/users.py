"""
API Endpoints for User management.
Includes role-based access control (RBAC) verification before execution.
"""
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_active_admin
from app.crud.crud_user import crud_user
from app.models.user import User, UserSetting
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserSettingResponse,
    UserSettingUpdate,
    NotificationEmailRequest
)
from app.core.email import send_notification_email_verification
from app.core.security import create_notification_email_verification_token

router = APIRouter()


@router.get("/", response_model=List[UserResponse], summary="Get list of users (Admin)")
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_admin),
):
    """
    Retrieve users list with pagination support (`skip`, `limit`).
    **Required Permission**: Super Admin.
    """
    users = crud_user.get_multi(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create new user (Admin)")
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """
    Admin creates a new user in the system.
    **Required Permission**: Super Admin.
    """
    existing_user = crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already registered.",
        )
    user = crud_user.create(db, obj_in=user_in)
    return user


@router.get("/{user_id}", response_model=UserResponse, summary="Get user details")
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve detailed user profile information by ID.
    **Required Permission**: Account owner OR Super Admin.
    """
    if current_user.id != user_id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view other users' information.",
        )

    user = crud_user.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User not found with ID {user_id}",
        )
    return user


@router.put("/{user_id}", response_model=UserResponse, summary="Update user information")
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update user information by ID.
    **Required Permission**: Account owner OR Super Admin.
    *(Regular users are not allowed to update their own role, status, or email verification status)*
    """
    if current_user.id != user_id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit other users' information.",
        )

    # Prevent regular users from updating administrative fields: role, status, or email_verified
    if current_user.role != "SUPER_ADMIN":
        forbidden_fields = {"role", "status", "email_verified"}
        intersect = forbidden_fields.intersection(user_in.model_fields_set)
        if intersect:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You do not have permission to modify the following fields: {', '.join(intersect)}",
            )

    user = crud_user.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User not found with ID {user_id}",
        )
    updated_user = crud_user.update(db, db_obj=user, obj_in=user_in)
    return updated_user


@router.delete("/{user_id}", response_model=UserResponse, summary="Delete user (Admin)")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """
    Permanently delete a user by ID.
    **Required Permission**: Super Admin.
    """
    user = crud_user.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User not found with ID {user_id}",
        )
    deleted_user = crud_user.delete(db, user_id=user_id)
    return deleted_user


@router.get("/me/settings", response_model=UserSettingResponse, summary="Get current user's settings")
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get settings for currently logged-in user.
    If settings don't exist, create default ones.
    """
    settings_obj = db.query(UserSetting).filter(UserSetting.user_id == current_user.id).first()
    if not settings_obj:
        settings_obj = UserSetting(user_id=current_user.id)
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)
    return settings_obj


@router.put("/me/settings", response_model=UserSettingResponse, summary="Update user notification settings")
def update_user_settings(
    settings_in: UserSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update notification preference flags for currently logged-in user.
    Does not allow direct modification of notification_email.
    """
    settings_obj = db.query(UserSetting).filter(UserSetting.user_id == current_user.id).first()
    if not settings_obj:
        settings_obj = UserSetting(user_id=current_user.id)
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)

    update_data = settings_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(settings_obj, field):
            setattr(settings_obj, field, value)

    db.add(settings_obj)
    db.commit()
    db.refresh(settings_obj)
    return settings_obj


@router.post("/me/notification-email/request", summary="Request verification email for a new notification email")
def request_notification_email_verification(
    body: NotificationEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Send a verification token to the requested notification email address.
    Does not update the email address until user confirms via verification token link.
    """
    # Check if this email is already registered as notification email by another user
    existing_setting = db.query(UserSetting).filter(
        UserSetting.notification_email == body.email,
        UserSetting.user_id != current_user.id
    ).first()
    if existing_setting:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already in use by another account for notifications."
        )

    token = create_notification_email_verification_token(
        user_id=current_user.id,
        new_email=body.email
    )
    verify_url = f"http://localhost:5173/verify-notification-email?token={token}"
    background_tasks.add_task(
        send_notification_email_verification,
        email_to=body.email,
        verify_url=verify_url
    )
    return {"message": "Verification email has been sent successfully."}


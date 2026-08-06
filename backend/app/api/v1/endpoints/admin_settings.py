from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_admin
from app.crud.crud_admin_setting import crud_admin_setting
from app.schemas.admin_setting import AdminSettingResponse, AdminSettingUpdate

router = APIRouter()


@router.get(
    "",
    response_model=AdminSettingResponse,
    summary="Get system-wide admin notification settings",
    description="Retrieve the current notification configuration matrix for Super Admins."
)
def get_admin_settings(
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    return crud_admin_setting.get_or_create(db, user_id=current_admin.id)


@router.put(
    "",
    response_model=AdminSettingResponse,
    summary="Update system-wide admin notification settings",
    description="Update the notification channels and matrix toggles."
)
def update_admin_settings(
    settings_in: AdminSettingUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    return crud_admin_setting.update(db, obj_in=settings_in, user_id=current_admin.id)

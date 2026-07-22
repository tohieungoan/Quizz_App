"""
API Endpoints cho quản lý Người dùng.
Bao gồm các kiểm tra phân quyền (RBAC) trước khi thực hiện.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_active_admin
from app.crud.crud_user import crud_user
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter()


@router.get("/", response_model=List[UserResponse], summary="Lấy danh sách người dùng (Admin)")
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_admin),
):
    """
    Lấy danh sách người dùng có hỗ trợ phân trang (`skip`, `limit`).
    **Yêu cầu quyền**: Admin / Super Admin.
    """
    users = crud_user.get_multi(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Tạo người dùng mới (Admin)")
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """
    Admin tạo một người dùng mới trong hệ thống.
    **Yêu cầu quyền**: Admin / Super Admin.
    """
    existing_user = crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được sử dụng trong hệ thống.",
        )
    user = crud_user.create(db, obj_in=user_in)
    return user


@router.get("/{user_id}", response_model=UserResponse, summary="Lấy chi tiết người dùng")
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Lấy thông tin chi tiết của một người dùng theo ID.
    **Yêu cầu quyền**: Chính chủ tài khoản HOẶC Admin.
    """
    if current_user.id != user_id and current_user.role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xem thông tin của người dùng khác",
        )

    user = crud_user.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng với ID {user_id}",
        )
    return user


@router.put("/{user_id}", response_model=UserResponse, summary="Cập nhật thông tin người dùng")
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Cập nhật thông tin người dùng theo ID.
    **Yêu cầu quyền**: Chính chủ tài khoản HOẶC Admin.
    *(User thường không được quyền tự đổi role hoặc status)*
    """
    if current_user.id != user_id and current_user.role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền chỉnh sửa thông tin của người dùng khác",
        )

    # Nếu người dùng không phải Admin, ngăn tự nâng quyền role hoặc đổi status của bản thân
    if current_user.role not in ["ADMIN", "SUPER_ADMIN"]:
        user_in.role = None
        user_in.status = None

    user = crud_user.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng với ID {user_id}",
        )
    updated_user = crud_user.update(db, db_obj=user, obj_in=user_in)
    return updated_user


@router.delete("/{user_id}", response_model=UserResponse, summary="Xóa người dùng (Admin)")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """
    Xóa người dùng khỏi CSDL theo ID.
    **Yêu cầu quyền**: Admin / Super Admin.
    """
    user = crud_user.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng với ID {user_id}",
        )
    deleted_user = crud_user.delete(db, user_id=user_id)
    return deleted_user



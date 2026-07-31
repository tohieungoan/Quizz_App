"""
API Endpoints for Badge management.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_admin
from app.crud.crud_badge import crud_badge
from app.schemas.badge import BadgeCreate, BadgeUpdate, BadgeResponse, BadgePageResponse, BadgeUserResponse

router = APIRouter()


@router.get("", response_model=BadgePageResponse, summary="Get all badges with pagination")
def read_badges(
    db: Session = Depends(get_db),
    pageIndex: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1, le=1000),
    search: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    current_admin=Depends(get_current_active_admin),
):
    """
    Retrieve all badges from the system (Admin only). Returns data and total count.
    """
    skip = (pageIndex - 1) * pageSize
    badges, total = crud_badge.get_multi_with_total(db, skip=skip, limit=pageSize, search=search, tier=tier)
    return {
        "data": badges,
        "total": total,
        "pageIndex": pageIndex,
        "pageSize": pageSize
    }


@router.get("/{badge_id}", response_model=BadgeResponse, summary="Get badge details")
def read_badge(
    badge_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_active_admin),
):
    """
    Retrieve details of a specific badge by ID.
    """
    badge = crud_badge.get_by_id(db, badge_id=badge_id)
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found",
        )
    return badge


@router.post("", response_model=BadgeResponse, status_code=status.HTTP_201_CREATED, summary="Create new badge")
def create_badge(
    *,
    db: Session = Depends(get_db),
    badge_in: BadgeCreate,
    current_admin=Depends(get_current_active_admin),
):
    """
    Create a new badge. Prevents duplicate badge names.
    """
    existing_badge = crud_badge.get_by_name(db, name=badge_in.name)
    if existing_badge:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A badge with this name already exists",
        )
    badge = crud_badge.create(db, obj_in=badge_in)
    return badge


@router.put("/{badge_id}", response_model=BadgeResponse, summary="Update badge")
def update_badge(
    *,
    db: Session = Depends(get_db),
    badge_id: int,
    badge_in: BadgeUpdate,
    current_admin=Depends(get_current_active_admin),
):
    """
    Update badge information.
    """
    badge = crud_badge.get_by_id(db, badge_id=badge_id)
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found",
        )
        
    if badge_in.name and badge_in.name != badge.name:
        existing_badge = crud_badge.get_by_name(db, name=badge_in.name)
        if existing_badge:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A badge with this name already exists",
            )
            
    badge = crud_badge.update(db, db_obj=badge, obj_in=badge_in)
    return badge


@router.delete("/{badge_id}", response_model=BadgeResponse, summary="Delete badge")
def delete_badge(
    *,
    db: Session = Depends(get_db),
    badge_id: int,
    current_admin=Depends(get_current_active_admin),
):
    """
    Delete a badge from the system.
    """
    badge = crud_badge.get_by_id(db, badge_id=badge_id)
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found",
        )
    badge = crud_badge.delete(db, badge_id=badge_id)
    return badge


@router.get("/{badge_id}/users", response_model=List[BadgeUserResponse], summary="Get users who unlocked a badge")
def read_badge_users(
    badge_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_active_admin),
):
    """
    Get a list of users who have unlocked this badge.
    """
    results = crud_badge.get_badge_users(db, badge_id=badge_id)
    response_list = []
    for user_badge, user in results:
        response_list.append(BadgeUserResponse(
            id=user_badge.id,
            user_id=user_badge.user_id,
            badge_id=user_badge.badge_id,
            current_progress=user_badge.current_progress,
            is_unlocked=user_badge.is_unlocked,
            is_equipped=user_badge.is_equipped,
            unlocked_at=user_badge.unlocked_at,
            user_name=user.fullname or user.username,
            user_email=user.email
        ))
    return response_list


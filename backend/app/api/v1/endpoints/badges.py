"""
API Endpoints for Badge management.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_admin
from app.crud.crud_badge import crud_badge
from app.schemas.badge import BadgeCreate, BadgeUpdate, BadgeResponse, BadgePageResponse, BadgeUserResponse

router = APIRouter()


@router.get("", response_model=BadgePageResponse, summary="Get all badges with pagination")
def read_badges(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_admin=Depends(get_current_active_admin),
):
    """
    Retrieve all badges from the system (Admin only). Returns data and total count.
    """
    badges, total = crud_badge.get_multi_with_total(db, skip=skip, limit=limit)
    return {
        "data": badges,
        "total": total,
        "skip": skip,
        "limit": limit
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


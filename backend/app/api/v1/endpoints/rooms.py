from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_db, get_current_active_admin
from app.crud.crud_room import crud_room
from app.schemas.room import RoomAdminPageResponse

router = APIRouter()

@router.get("/", response_model=RoomAdminPageResponse, summary="Get list of all rooms (Admin)")
def get_all_rooms(
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(10, description="Number of records to return"),
    search: Optional[str] = Query(None, description="Search by room code, host name, or quiz title"),
    status: Optional[str] = Query("ALL", description="Filter by status (ALL, RUNNING, WAITING, FINISHED)"),
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    """
    Retrieve all rooms in the system with pagination, search, and status filtering.
    Requires Super Admin privileges.
    """
    return crud_room.get_admin_rooms(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status=status
    )

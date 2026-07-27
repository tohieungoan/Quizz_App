from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_admin
from app.crud.crud_dashboard import crud_dashboard
from app.schemas.dashboard import DashboardOverviewResponse

router = APIRouter()

@router.get(
    "/overview", 
    response_model=DashboardOverviewResponse, 
    summary="Get dashboard overview data",
    responses={
        200: {"description": "Successful request. Returns dashboard data."},
        400: {"description": "Bad Request. User account is not active or locked."},
        401: {"description": "Unauthorized. Missing Authentication Token."},
        403: {"description": "Forbidden. Invalid token, expired, or User is not a Super Admin."},
        404: {"description": "Not Found. User from token no longer exists."}
    }
)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    """
    Retrieve real-time aggregated metrics for the admin dashboard.
    Only accessible by Admins.
    """
    return crud_dashboard.get_overview(db)

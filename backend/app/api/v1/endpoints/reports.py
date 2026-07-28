from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.api.deps import get_db, get_current_active_admin
from app.crud.crud_report import crud_report
from app.schemas.report import ReportMetrics, ReportPageResponse

router = APIRouter()

@router.get("/metrics", response_model=ReportMetrics, summary="Get global report metrics")
def get_report_metrics(
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    """
    Retrieve aggregated metrics for the reports tab.
    """
    return crud_report.get_metrics(db)

@router.get("", response_model=ReportPageResponse, summary="Get list of reports")
def get_reports(
    db: Session = Depends(get_db),
    pageIndex: int = Query(1, ge=1),
    pageSize: int = Query(5, ge=1, le=100),
    search: str = Query(""),
    reportType: str = Query("ALL"),
    current_admin = Depends(get_current_active_admin)
):
    """
    Retrieve paginated list of completed rooms and exams.
    """
    skip = (pageIndex - 1) * pageSize
    return crud_report.get_reports_paginated(
        db=db, 
        search=search, 
        report_type=reportType.upper(), 
        skip=skip, 
        limit=pageSize
    )

@router.get("/{session_id}/export", summary="Export report to ZIP containing CSVs")
def export_report(
    session_id: int,
    type: str = Query(..., description="Type of session: 'ROOM' or 'EXAM'"),
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    """
    Export detailed report for a specific room or exam as a ZIP file containing participants and questions accuracy data.
    """
    zip_content = crud_report.export_report_zip(db, session_id=session_id, session_type=type)
    
    # Create a StreamingResponse to serve the ZIP file
    response = StreamingResponse(
        iter([zip_content]),
        media_type="application/zip"
    )
    # Set headers so the browser downloads it as a file
    filename = f"Report_{type.upper()}_{session_id}.zip"
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    
    return response

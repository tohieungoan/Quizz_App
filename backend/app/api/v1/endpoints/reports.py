from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from typing import List
from app.api.deps import get_db, get_current_active_admin
from app.crud.crud_report import crud_report
from app.schemas.report import ReportMetrics, ReportPageResponse, ReportParticipant, ReportQuestionAnalysis, ReportParticipantPageResponse, ReportQuestionPageResponse

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

@router.get("/{session_id}/export", summary="Export participant and question reports as ZIP")
def export_report(
    session_id: int,
    type: str = Query(..., description="Type of session: 'ROOM' or 'EXAM'"),
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    """
    Export a ZIP with one participant workbook and one versioned question workbook.
    """
    try:
        zip_content = crud_report.export_report_zip(
            db, session_id=session_id, session_type=type
        )
    except ValueError as error:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(error)) from error

    response = StreamingResponse(
        iter([zip_content]),
        media_type="application/zip",
    )
    filename = f"Report_{type.upper()}_{session_id}.zip"
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    return response

@router.get("/{session_id}/participants", response_model=ReportParticipantPageResponse, summary="Get participants for a report")
def get_report_participants(
    session_id: int,
    type: str = Query(..., description="Type of session: 'ROOM' or 'EXAM'"),
    pageIndex: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    """
    Retrieve list of participants and their scores for a specific room or exam.
    """
    skip = (pageIndex - 1) * pageSize
    return crud_report.get_report_participants(db, session_id=session_id, session_type=type, skip=skip, limit=pageSize)

@router.get("/{session_id}/questions", response_model=ReportQuestionPageResponse, summary="Get question analysis for a report")
def get_report_questions(
    session_id: int,
    type: str = Query(..., description="Type of session: 'ROOM' or 'EXAM'"),
    pageIndex: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_active_admin)
):
    """
    Retrieve question accuracy analysis for a specific room or exam.
    """
    skip = (pageIndex - 1) * pageSize
    return crud_report.get_report_questions(db, session_id=session_id, session_type=type, skip=skip, limit=pageSize)

import logging
import asyncio
import uuid
from typing import Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_active_admin
from app.models.user import User
from app.models.notification import Notification
from app.models.broadcast import BroadcastLog
from app.schemas.notification import NotificationListResponse
from app.schemas.broadcast import BroadcastRequest, BroadcastResponse, BroadcastHistoryResponse
from app.crud.crud_notification import crud_notification
from app.api.v1.websockets.manager import manager
from app.db.session import SessionLocal
from app.core.scheduler import scheduler

router = APIRouter()
logger = logging.getLogger(__name__)

# -----------------------------------------
# USER NOTIFICATION ENDPOINTS
# -----------------------------------------

@router.get("/", response_model=NotificationListResponse, summary="Get current user notifications")
def get_notifications(
    skip: int = Query(0, description="Skip N records"),
    limit: int = Query(20, description="Limit records"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the list of notifications for the currently logged-in user, 
    ordered by newest first, and the total unread count for the bell icon.
    """
    notifications, unread_count = crud_notification.get_user_notifications(db, current_user.id, skip, limit)
    
    return NotificationListResponse(
        data=notifications,
        unread_count=unread_count
    )

@router.put("/{notification_id}/read", summary="Mark a notification as read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a specific notification as read."""
    success = crud_notification.mark_as_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

@router.put("/read-all", summary="Mark all notifications as read")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all unread notifications as read."""
    count = crud_notification.mark_all_as_read(db, current_user.id)
    return {"success": True, "marked_count": count}

@router.delete("/all", summary="Delete all notifications")
def delete_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete/hide all notifications (read and unread) for the current user."""
    count = crud_notification.delete_all(db, current_user.id)
    return {"success": True, "deleted_count": count}

@router.delete("/read", summary="Clear all read notifications")
@router.delete("/", summary="Clear all read notifications")
def clear_all_read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete all read notifications for the current user."""
    count = crud_notification.clear_all_read(db, current_user.id)
    return {"success": True, "cleared_count": count}

@router.delete("/{notification_id}", summary="Delete a notification")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete (hide) a specific notification for the current user."""
    success = crud_notification.delete_notification(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}


# -----------------------------------------
# ADMIN BROADCAST ENDPOINTS
# -----------------------------------------

def save_broadcast_to_db(job_id: Optional[str], admin_id: int, request_data: dict):
    """
    Sync function to insert global notification and update scheduled job status.
    Safe to use with FastAPI BackgroundTasks and APScheduler.
    """
    db = SessionLocal()
    try:
        if job_id:
            log = db.query(BroadcastLog).filter(BroadcastLog.job_id == job_id).first()
            if log:
                log.status = "SENT"
                
        parsed_scheduled_at = None
        if request_data.get("scheduledAt"):
            try:
                parsed_scheduled_at = datetime.fromisoformat(request_data["scheduledAt"].replace('Z', '+00:00'))
                parsed_scheduled_at = parsed_scheduled_at.astimezone(timezone.utc).replace(tzinfo=None)
            except ValueError:
                pass

        new_notif = Notification(
            sender_id=admin_id,
            user_id=None,
            target_type="ALL_USERS",
            title=request_data["title"],
            content=request_data["content"],
            type=request_data["type"],
            action_url=request_data.get("actionUrl"),
            scheduled_at=parsed_scheduled_at
        )
        db.add(new_notif)
        db.commit()
            
    except Exception as e:
        logger.error(f"Error saving broadcast to DB: {e}", exc_info=True)
        db.rollback()
        if job_id:
            try:
                log = db.query(BroadcastLog).filter(BroadcastLog.job_id == job_id).first()
                if log:
                    log.status = "FAILED"
                    db.commit()
            except Exception:
                pass
    finally:
        db.close()


async def push_scheduled_broadcast(job_id: Optional[str], admin_id: int, ws_payload: dict, request_data: dict):
    """
    Async function for APScheduler scheduled jobs.
    Inserts notification into DB and pushes real-time WebSocket to all users.
    """
    save_broadcast_to_db(job_id, admin_id, request_data)
    try:
        await manager.broadcast(ws_payload)
    except Exception as e:
        logger.error(f"Error pushing WS broadcast: {e}", exc_info=True)


@router.post("/broadcast", response_model=BroadcastResponse, summary="Send System Broadcast (Admin)")
async def send_broadcast(
    request: BroadcastRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    # 1. Validation for isScheduled & scheduledAt
    parsed_scheduled_at_aware = None
    parsed_scheduled_at_naive = None
    if request.isScheduled:
        if not request.scheduledAt or not request.scheduledAt.strip():
            raise HTTPException(status_code=400, detail="scheduledAt is required when isScheduled is True.")
        try:
            parsed_scheduled_at_aware = datetime.fromisoformat(request.scheduledAt.replace('Z', '+00:00'))
            if parsed_scheduled_at_aware.tzinfo is None:
                parsed_scheduled_at_aware = parsed_scheduled_at_aware.replace(tzinfo=timezone.utc)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid scheduledAt ISO datetime format.")

        now_utc = datetime.now(timezone.utc)
        min_allowed_time = now_utc + timedelta(seconds=45) # Must be at least ~1 minute into future
        if parsed_scheduled_at_aware < min_allowed_time:
            raise HTTPException(
                status_code=400,
                detail="Scheduled time must be at least 1 minute in the future. Past or immediate times are not permitted for scheduled broadcasts."
            )
        max_allowed_time = now_utc + timedelta(days=365)
        if parsed_scheduled_at_aware > max_allowed_time:
            raise HTTPException(
                status_code=400,
                detail="Scheduled time cannot exceed 1 year in the future."
            )
        parsed_scheduled_at_naive = parsed_scheduled_at_aware.astimezone(timezone.utc).replace(tzinfo=None)
    else:
        request.scheduledAt = None

    # 2. Create Broadcast Log
    job_id = None
    status = "SENT"
    if request.isScheduled and parsed_scheduled_at_aware:
        job_id = f"job_{uuid.uuid4().hex}"
        status = "PENDING"
        
    broadcast_log = BroadcastLog(
        admin_id=current_admin.id,
        title=request.title,
        content=request.content,
        type=request.type,
        target_type="ALL_USERS",
        action_url=request.actionUrl,
        is_scheduled=request.isScheduled,
        scheduled_at=parsed_scheduled_at_naive,
        status=status,
        job_id=job_id
    )
    db.add(broadcast_log)
    db.commit()
    db.refresh(broadcast_log)

    ws_payload = {
        "event": "NEW_BROADCAST",
        "data": {
            "title": request.title,
            "desc": request.content,
            "type": request.type,
            "actionUrl": request.actionUrl,
            "isScheduled": request.isScheduled,
            "scheduledAt": request.scheduledAt
        }
    }
    
    request_data = {
        "title": request.title,
        "content": request.content,
        "type": request.type,
        "actionUrl": request.actionUrl,
        "scheduledAt": request.scheduledAt
    }

    # 3. If scheduled, add APScheduler job
    if status == "PENDING":
        scheduler.add_job(
            push_scheduled_broadcast,
            'date',
            run_date=parsed_scheduled_at_aware,
            id=job_id,
            args=[job_id, current_admin.id, ws_payload, request_data]
        )
        return BroadcastResponse(
            success=True,
            message=f"Broadcast scheduled successfully for {request.scheduledAt}!",
            job_id=job_id
        )

    # 4. Instant Broadcast: Push WS immediately & save to DB via background task
    try:
        await manager.broadcast(ws_payload)
    except Exception as e:
        logger.error(f"Error pushing instant WS broadcast: {e}", exc_info=True)

    background_tasks.add_task(
        save_broadcast_to_db,
        None,
        current_admin.id,
        request_data
    )

    return BroadcastResponse(
        success=True,
        message="Broadcast sent successfully!",
        job_id=job_id
    )

@router.delete("/broadcast/{job_id}", summary="Cancel/Delete a scheduled broadcast")
def cancel_broadcast(
    job_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    log = db.query(BroadcastLog).filter(BroadcastLog.job_id == job_id).first()
    if not log and job_id.isdigit():
        log = db.query(BroadcastLog).filter(BroadcastLog.id == int(job_id)).first()
        
    if not log:
        raise HTTPException(status_code=404, detail="Scheduled broadcast not found.")
        
    # Remove from APScheduler if job exists
    target_job_id = log.job_id or job_id
    try:
        scheduler.remove_job(target_job_id)
    except Exception:
        pass # Ignore if job is not in memory or already fired
        
    db.delete(log)
    db.commit()
    
    return {
        "success": True, 
        "message": "Scheduled broadcast cancelled and deleted successfully."
    }

@router.get("/broadcast/history", response_model=BroadcastHistoryResponse, summary="Get broadcast history")
def get_broadcast_history(
    skip: int = Query(0, description="Skip N records"),
    limit: int = Query(20, description="Limit records"),
    status: Optional[str] = Query(None, description="Filter by status (PENDING, SENT, CANCELLED)"),
    is_scheduled: Optional[bool] = Query(None, description="Filter by is_scheduled"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    query = db.query(BroadcastLog)
    if status:
        query = query.filter(BroadcastLog.status == status)
    if is_scheduled is not None:
        query = query.filter(BroadcastLog.is_scheduled == is_scheduled)
        
    if status == "PENDING":
        query = query.order_by(BroadcastLog.scheduled_at.asc(), BroadcastLog.created_at.desc())
    else:
        query = query.order_by(BroadcastLog.created_at.desc())
        
    total = query.count()
    data = query.offset(skip).limit(limit).all()
    
    return BroadcastHistoryResponse(
        data=data,
        total=total,
        pageIndex=(skip // limit) + 1,
        pageSize=limit
    )

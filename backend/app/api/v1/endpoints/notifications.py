import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_active_admin
from app.models.user import User
from app.models.notification import Notification
from app.models.broadcast import BroadcastLog
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.schemas.broadcast import (
    BroadcastHistoryResponse,
    BroadcastLogSchema,
    BroadcastRequest,
    BroadcastResponse,
)
from app.crud.crud_notification import crud_notification
from app.api.v1.websockets.notification_manager import notification_manager
from app.db.session import SessionLocal
from app.core.scheduler import scheduler

router = APIRouter()
logger = logging.getLogger(__name__)

BroadcastStatus = Literal["PENDING", "SENT", "CANCELLED", "FAILED"]
MIN_SCHEDULE_DELAY = timedelta(minutes=1)
MAX_SCHEDULE_DELAY = timedelta(days=365)


@router.get("/", response_model=NotificationListResponse, summary="Get current user notifications")
def get_notifications(
    skip: int = Query(0, ge=0, description="Skip N records"),
    limit: int = Query(20, ge=1, le=100, description="Limit records"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the list of notifications for the currently logged-in user, 
    ordered by newest first, and the total unread count for the bell icon.
    """
    notifications, unread_count = crud_notification.get_user_notifications(db, current_user.id, skip, limit)
    
    return NotificationListResponse(
        data=[NotificationResponse.model_validate(n) for n in notifications],
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

def _build_global_notification(admin_id: int, request_data: dict) -> Notification:
    """Build the durable notification record for a broadcast."""
    parsed_scheduled_at = None
    if request_data.get("scheduledAt"):
        try:
            parsed_scheduled_at = datetime.fromisoformat(
                request_data["scheduledAt"].replace("Z", "+00:00")
            )
            parsed_scheduled_at = parsed_scheduled_at.astimezone(timezone.utc).replace(tzinfo=None)
        except ValueError:
            # scheduledAt is validated before scheduling; keep this helper defensive
            # for jobs restored from older payloads.
            parsed_scheduled_at = None

    return Notification(
        sender_id=admin_id,
        user_id=None,
        target_type="ALL_USERS",
        title=request_data["title"],
        content=request_data["content"],
        type=request_data["type"],
        action_url=request_data.get("actionUrl"),
        scheduled_at=parsed_scheduled_at,
    )


def save_broadcast_to_db(
    job_id: Optional[str],
    admin_id: int,
    request_data: dict,
) -> bool:
    """Persist a scheduled notification and its status transition atomically."""
    db = SessionLocal()
    try:
        if not job_id:
            logger.error("Scheduled broadcast delivery requires a job_id.")
            return False

        # Serialize scheduled delivery against cancellation. Only one transaction
        # may perform the PENDING -> terminal-state transition.
        broadcast_log = (
            db.query(BroadcastLog)
            .filter(BroadcastLog.job_id == job_id)
            .with_for_update()
            .first()
        )
        if not broadcast_log:
            logger.warning("Scheduled broadcast job %s does not exist.", job_id)
            return False
        if broadcast_log.status != "PENDING":
            logger.info(
                "Skipping scheduled broadcast %s because its status is %s.",
                job_id,
                broadcast_log.status,
            )
            return False

        broadcast_log.status = "SENT"
        db.add(_build_global_notification(admin_id, request_data))
        db.commit()
        return True
    except Exception as exc:
        logger.error(
            "Failed to persist scheduled broadcast %s: %s",
            job_id,
            exc,
            exc_info=True,
        )
        db.rollback()

        # Use a separate transaction after rollback and never overwrite a
        # concurrent CANCELLED or SENT terminal state.
        if job_id:
            try:
                failure_log = (
                    db.query(BroadcastLog)
                    .filter(BroadcastLog.job_id == job_id)
                    .with_for_update()
                    .first()
                )
                if failure_log and failure_log.status == "PENDING":
                    failure_log.status = "FAILED"
                    db.commit()
            except Exception as status_exc:
                db.rollback()
                logger.error(
                    "Failed to mark scheduled broadcast %s as FAILED: %s",
                    job_id,
                    status_exc,
                    exc_info=True,
                )
        return False
    finally:
        db.close()


async def push_scheduled_broadcast(
    job_id: Optional[str],
    admin_id: int,
    ws_payload: dict,
    request_data: dict,
) -> None:
    """
    Async function for APScheduler scheduled jobs.
    Inserts notification into DB and pushes real-time WebSocket to all users.
    """
    if not save_broadcast_to_db(job_id, admin_id, request_data):
        logger.info(
            "Scheduled broadcast %s was not published because persistence "
            "failed or it was no longer PENDING.",
            job_id,
        )
        return

    try:
        await notification_manager.broadcast(ws_payload)
    except Exception as exc:
        logger.error(
            "Failed to publish scheduled broadcast %s: %s",
            job_id,
            exc,
            exc_info=True,
        )


@router.post("/broadcast", response_model=BroadcastResponse, summary="Send System Broadcast (Admin)")
async def send_broadcast(
    request: BroadcastRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
) -> BroadcastResponse:
    # 1. Validation for isScheduled & scheduledAt
    parsed_scheduled_at_aware = None
    parsed_scheduled_at_naive = None
    if request.isScheduled:
        if not request.scheduledAt or not request.scheduledAt.strip():
            raise HTTPException(status_code=400, detail="scheduledAt is required when isScheduled is True.")
        try:
            parsed_scheduled_at_aware = datetime.fromisoformat(
                request.scheduledAt.replace("Z", "+00:00")
            )
            if parsed_scheduled_at_aware.tzinfo is None:
                parsed_scheduled_at_aware = parsed_scheduled_at_aware.replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduledAt ISO datetime format.")

        now_utc = datetime.now(timezone.utc)
        min_allowed_time = now_utc + MIN_SCHEDULE_DELAY
        if parsed_scheduled_at_aware < min_allowed_time:
            raise HTTPException(
                status_code=400,
                detail="Scheduled time must be at least 1 minute in the future. Past or immediate times are not permitted for scheduled broadcasts."
            )
        max_allowed_time = now_utc + MAX_SCHEDULE_DELAY
        if parsed_scheduled_at_aware > max_allowed_time:
            raise HTTPException(
                status_code=400,
                detail="Scheduled time cannot exceed 1 year in the future."
            )
        parsed_scheduled_at_naive = parsed_scheduled_at_aware.astimezone(timezone.utc).replace(tzinfo=None)
    scheduled_at_value = request.scheduledAt if request.isScheduled else None

    # 2. Create Broadcast Log
    job_id = None
    status = "SENT"
    if request.isScheduled and parsed_scheduled_at_aware:
        job_id = f"job_{uuid.uuid4().hex}"
        status = "PENDING"
        
    request_data = {
        "title": request.title,
        "content": request.content,
        "type": request.type,
        "actionUrl": request.actionUrl,
        "scheduledAt": scheduled_at_value,
    }

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

    # Instant notification and audit log are committed in one transaction.
    # WebSocket is best-effort and must only run after durable persistence.
    if status == "SENT":
        db.add(_build_global_notification(current_admin.id, request_data))

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error(
            "Failed to commit broadcast before realtime publish: %s",
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="Broadcast could not be saved and was not published.",
        ) from exc

    ws_payload = {
        "event": "NEW_BROADCAST",
        "data": {
            "title": request.title,
            "desc": request.content,
            "type": request.type,
            "actionUrl": request.actionUrl,
            "isScheduled": request.isScheduled,
            "scheduledAt": scheduled_at_value,
        }
    }

    # 3. If scheduled, add APScheduler job
    if status == "PENDING":
        try:
            scheduler.add_job(
                push_scheduled_broadcast,
                "date",
                run_date=parsed_scheduled_at_aware,
                id=job_id,
                args=[job_id, current_admin.id, ws_payload, request_data],
            )
        except Exception as exc:
            logger.error(
                "Failed to register scheduled broadcast %s: %s",
                job_id,
                exc,
                exc_info=True,
            )
            try:
                broadcast_log.status = "FAILED"
                db.commit()
            except Exception as status_exc:
                db.rollback()
                logger.error(
                    "Failed to mark unscheduled broadcast %s as FAILED: %s",
                    job_id,
                    status_exc,
                    exc_info=True,
                )
            raise HTTPException(
                status_code=500,
                detail="Broadcast was saved but could not be scheduled.",
            ) from exc

        return BroadcastResponse(
            success=True,
            message=f"Broadcast scheduled successfully for {scheduled_at_value}!",
            job_id=job_id
        )

    # 4. Instant broadcast: persistence succeeded, so realtime publish is safe.
    try:
        await notification_manager.broadcast(ws_payload)
    except Exception as exc:
        logger.error("Failed to publish instant broadcast: %s", exc, exc_info=True)

    return BroadcastResponse(
        success=True,
        message="Broadcast sent successfully!",
        job_id=job_id
    )

@router.delete("/broadcast/{job_id}", summary="Cancel a pending scheduled broadcast")
def cancel_broadcast(
    job_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
) -> dict:
    log = (
        db.query(BroadcastLog)
        .filter(BroadcastLog.job_id == job_id)
        .with_for_update()
        .first()
    )
    if not log and job_id.isdigit():
        log = (
            db.query(BroadcastLog)
            .filter(BroadcastLog.id == int(job_id))
            .with_for_update()
            .first()
        )

    if not log:
        raise HTTPException(status_code=404, detail="Scheduled broadcast not found.")

    if not log.is_scheduled:
        raise HTTPException(
            status_code=409,
            detail="Instant broadcasts cannot be cancelled.",
        )
    if log.status != "PENDING":
        raise HTTPException(
            status_code=409,
            detail=f"Only PENDING broadcasts can be cancelled; current status is {log.status}.",
        )

    target_job_id = log.job_id
    log.status = "CANCELLED"
    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to cancel broadcast %s: %s", job_id, exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Broadcast cancellation could not be saved.",
        ) from exc

    # Database state is authoritative. Even if an in-memory job cannot be
    # removed, the worker refuses to deliver a non-PENDING broadcast.
    if target_job_id:
        try:
            scheduler.remove_job(target_job_id)
        except Exception as exc:
            logger.info(
                "Scheduled job %s was already absent during cancellation: %s",
                target_job_id,
                exc,
            )

    return {
        "success": True,
        "message": "Scheduled broadcast cancelled successfully.",
        "status": "CANCELLED",
    }

@router.get("/broadcast/history", response_model=BroadcastHistoryResponse, summary="Get broadcast history")
def get_broadcast_history(
    skip: int = Query(0, ge=0, description="Skip N records"),
    limit: int = Query(20, ge=1, le=100, description="Limit records"),
    status: Optional[BroadcastStatus] = Query(
        None,
        description="Filter by status (PENDING, SENT, CANCELLED, FAILED)",
    ),
    is_scheduled: Optional[bool] = Query(None, description="Filter by is_scheduled"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
) -> BroadcastHistoryResponse:
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
        data=[BroadcastLogSchema.model_validate(item) for item in data],
        total=total,
        pageIndex=(skip // limit) + 1,
        pageSize=limit
    )

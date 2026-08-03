import logging
import asyncio
import uuid
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import insert, select, literal

from app.api.deps import get_db, get_current_active_user, get_current_active_admin
from app.models.user import User
from app.models.group import GroupMember
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

@router.delete("/", summary="Clear all read notifications")
def clear_all_read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete all read notifications for the current user."""
    count = crud_notification.clear_all_read(db, current_user.id)
    return {"success": True, "cleared_count": count}


# -----------------------------------------
# ADMIN BROADCAST ENDPOINTS
# -----------------------------------------

def save_broadcast_to_db(job_id: Optional[str], admin_id: int, target_type: str, target_group_id: Optional[int], request_data: dict):
    """
    Sync function for DB fan-out insertion.
    Safe to use with FastAPI BackgroundTasks.
    """
    db = SessionLocal()
    try:
        # 1. Update BroadcastLog status to SENT if it was a scheduled job
        if job_id:
            log = db.query(BroadcastLog).filter(BroadcastLog.job_id == job_id).first()
            if log:
                log.status = "SENT"
                
        # 2. Insert into DB (fan-out)
        parsed_scheduled_at = None
        if request_data.get("scheduledAt"):
            try:
                parsed_scheduled_at = datetime.fromisoformat(request_data["scheduledAt"].replace('Z', '+00:00'))
                parsed_scheduled_at = parsed_scheduled_at.astimezone(timezone.utc).replace(tzinfo=None)
            except ValueError:
                pass

        if target_type == "ALL_USERS":
            new_notif = Notification(
                sender_id=admin_id,
                user_id=None,
                target_type="ALL_USERS",
                target_group_id=None,
                title=request_data["title"],
                content=request_data["content"],
                type=request_data["type"],
                action_url=request_data.get("actionUrl"),
                scheduled_at=parsed_scheduled_at
            )
            db.add(new_notif)

        elif target_type == "GROUP" and target_group_id:
            select_stmt = select(
                literal(admin_id).label("sender_id"),
                GroupMember.user_id.label("user_id"),
                literal(target_type).label("target_type"),
                literal(target_group_id).label("target_group_id"),
                literal(request_data["title"]).label("title"),
                literal(request_data["content"]).label("content"),
                literal(request_data["type"]).label("type"),
                literal(request_data.get("actionUrl")).label("action_url"),
                literal(parsed_scheduled_at).label("scheduled_at")
            ).where(GroupMember.group_id == target_group_id, GroupMember.user_id.isnot(None))
            
            insert_stmt = insert(Notification).from_select(
                ["sender_id", "user_id", "target_type", "target_group_id", "title", "content", "type", "action_url", "scheduled_at"],
                select_stmt
            )
            db.execute(insert_stmt)

        db.commit()
            
    except Exception as e:
        logger.error(f"Error saving broadcast to DB: {e}", exc_info=True)
        db.rollback()
        if job_id and 'log' in locals() and log:
            log.status = "FAILED"
            db.commit()
    finally:
        db.close()


async def push_scheduled_broadcast(job_id: Optional[str], admin_id: int, ws_payload: dict, target_type: str, target_group_id: Optional[int], request_data: dict):
    """
    Async function for APScheduler scheduled jobs.
    Handles both WS push and DB save (since APScheduler runs on the main event loop).
    """
    # 1. Save to DB (sync call is fine here since APScheduler runs in its own thread)
    save_broadcast_to_db(job_id, admin_id, target_type, target_group_id, request_data)

    # 2. Push WS
    try:
        if target_type == "ALL_USERS":
            await manager.broadcast(ws_payload)
        elif target_type == "GROUP" and target_group_id:
            db = SessionLocal()
            try:
                group_members = db.query(GroupMember.user_id).filter(GroupMember.group_id == target_group_id).all()
                user_ids = [m.user_id for m in group_members if m.user_id is not None]
                await manager.send_group_message(ws_payload, user_ids)
            finally:
                db.close()
    except Exception as e:
        logger.error(f"Error pushing WS broadcast: {e}", exc_info=True)


@router.post("/broadcast", response_model=BroadcastResponse, summary="Send System Broadcast (Admin)")
async def send_broadcast(
    request: BroadcastRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    if request.targetType == "GROUP" and not request.targetGroupId:
        raise HTTPException(status_code=400, detail="Target Group ID is required when targetType is GROUP")
        
    if request.targetType == "ALL_USERS" or request.targetGroupId == 0:
        request.targetGroupId = None

    parsed_scheduled_at_aware = None
    parsed_scheduled_at_naive = None
    if request.isScheduled and request.scheduledAt:
        try:
            parsed_scheduled_at_aware = datetime.fromisoformat(request.scheduledAt.replace('Z', '+00:00'))
            parsed_scheduled_at_naive = parsed_scheduled_at_aware.astimezone(timezone.utc).replace(tzinfo=None)
        except ValueError:
            pass

    # 1. Create Broadcast Log
    job_id = None
    status = "SENT"
    if request.isScheduled and parsed_scheduled_at_aware and parsed_scheduled_at_aware > datetime.now(timezone.utc):
        job_id = f"job_{uuid.uuid4().hex}"
        status = "PENDING"
        
    broadcast_log = BroadcastLog(
        admin_id=current_admin.id,
        title=request.title,
        content=request.content,
        type=request.type,
        target_type=request.targetType,
        target_group_id=request.targetGroupId,
        action_url=request.actionUrl,
        is_scheduled=request.isScheduled,
        scheduled_at=parsed_scheduled_at_naive,
        status=status,
        job_id=job_id
    )
    db.add(broadcast_log)
    db.commit()

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

    # 2. If scheduled, add APScheduler job (async function is OK here)
    if status == "PENDING":
        scheduler.add_job(
            push_scheduled_broadcast,
            'date',
            run_date=parsed_scheduled_at_aware,
            id=job_id,
            args=[job_id, current_admin.id, ws_payload, request.targetType, request.targetGroupId, request_data]
        )
        return BroadcastResponse(
            success=True,
            message=f"Broadcast scheduled successfully for {request.scheduledAt}!",
            job_id=job_id
        )

    # 3. Instant Push
    # Step A: Push WS immediately on the main event loop (await = guaranteed delivery)
    try:
        if request.targetType == "ALL_USERS":
            await manager.broadcast(ws_payload)
        elif request.targetType == "GROUP" and request.targetGroupId:
            group_members = db.query(GroupMember.user_id).filter(GroupMember.group_id == request.targetGroupId).all()
            user_ids = [m.user_id for m in group_members if m.user_id is not None]
            await manager.send_group_message(ws_payload, user_ids)
    except Exception as e:
        logger.error(f"Error pushing instant WS broadcast: {e}", exc_info=True)

    # Step B: Dispatch DB fan-out to background (sync function = safe with BackgroundTasks)
    background_tasks.add_task(
        save_broadcast_to_db,
        None,
        current_admin.id,
        request.targetType,
        request.targetGroupId,
        request_data
    )

    return BroadcastResponse(
        success=True,
        message="Broadcast sent successfully!",
        job_id=job_id
    )

@router.delete("/broadcast/{job_id}", summary="Cancel a scheduled broadcast")
def cancel_broadcast(
    job_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    log = db.query(BroadcastLog).filter(BroadcastLog.job_id == job_id, BroadcastLog.status == "PENDING").first()
    if not log:
        raise HTTPException(status_code=404, detail="Scheduled broadcast not found or already executed")
        
    try:
        scheduler.remove_job(job_id)
    except Exception:
        pass # Ignore if job is not found in scheduler, we still update DB

    log.status = "CANCELLED"
    db.commit()
    
    return {"success": True, "message": "Scheduled broadcast cancelled successfully."}

@router.get("/broadcast/history", response_model=BroadcastHistoryResponse, summary="Get broadcast history")
def get_broadcast_history(
    skip: int = Query(0, description="Skip N records"),
    limit: int = Query(20, description="Limit records"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    query = db.query(BroadcastLog).order_by(BroadcastLog.created_at.desc())
    total = query.count()
    data = query.offset(skip).limit(limit).all()
    
    return BroadcastHistoryResponse(
        data=data,
        total=total,
        pageIndex=(skip // limit) + 1,
        pageSize=limit
    )

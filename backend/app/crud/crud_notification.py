from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.notification import Notification

class CRUDNotification:
    def get_user_notifications(self, db: Session, user_id: int, skip: int = 0, limit: int = 20) -> Tuple[List[Notification], int]:
        """Get notifications for a specific user and unread count"""
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        # Calculate unread count
        unread_count = db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id, 
            Notification.is_read == False
        ).scalar() or 0

        # Get latest notifications
        notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
        
        return notifications, unread_count

    def mark_as_read(self, db: Session, notification_id: int, user_id: int) -> bool:
        """Mark a single notification as read"""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.is_read = True
            db.commit()
            return True
        return False

    def mark_all_as_read(self, db: Session, user_id: int) -> int:
        """Mark all unread notifications as read for a user"""
        unread_notifications = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).all()
        
        count = len(unread_notifications)
        for n in unread_notifications:
            n.is_read = True
            
        db.commit()
        return count

crud_notification = CRUDNotification()

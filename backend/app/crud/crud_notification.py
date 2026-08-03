from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, not_, select
from app.models.notification import Notification, NotificationRead

class CRUDNotification:
    def get_user_notifications(self, db: Session, user_id: int, skip: int = 0, limit: int = 20) -> Tuple[List[Notification], int]:
        """Get notifications for a specific user (both personal and global system-wide) and unread count"""
        
        # Select statement to find system notifications that this user has deleted
        deleted_notif_ids_stmt = select(NotificationRead.notification_id).where(
            NotificationRead.user_id == user_id,
            NotificationRead.is_deleted == True
        )

        # Query all matching notifications with left outer join on NotificationRead to resolve is_read state dynamically
        results = db.query(Notification, NotificationRead.is_read).outerjoin(
            NotificationRead,
            and_(
                NotificationRead.notification_id == Notification.id,
                NotificationRead.user_id == user_id
            )
        ).filter(
            or_(
                Notification.user_id == user_id,
                and_(
                    Notification.target_type == "ALL_USERS",
                    Notification.user_id.is_(None)
                )
            )
        ).filter(
            not_(Notification.id.in_(deleted_notif_ids_stmt))
        ).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

        # Map dynamic is_read state onto Notification models in-memory
        mapped_notifications = []
        for notif, user_is_read in results:
            if notif.user_id is None:
                notif.is_read = user_is_read if user_is_read is not None else False
            mapped_notifications.append(notif)
        
        # Calculate unread count:
        # 1. Unread personal notifications
        personal_unread = db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id, 
            Notification.is_read == False
        ).scalar() or 0

        # 2. Unread global notifications (no NotificationRead entry with is_read=True)
        read_global_ids_stmt = select(NotificationRead.notification_id).where(
            NotificationRead.user_id == user_id,
            NotificationRead.is_read == True
        )

        global_unread = db.query(func.count(Notification.id)).filter(
            Notification.target_type == "ALL_USERS",
            Notification.user_id.is_(None),
            not_(Notification.id.in_(read_global_ids_stmt)),
            not_(Notification.id.in_(deleted_notif_ids_stmt))
        ).scalar() or 0

        unread_count = personal_unread + global_unread
        
        return mapped_notifications, unread_count

    def mark_as_read(self, db: Session, notification_id: int, user_id: int) -> bool:
        """Mark a single notification (personal or global) as read"""
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return False
            
        if notification.user_id == user_id:
            notification.is_read = True
            db.add(notification)
            db.commit()
            return True
            
        elif notification.user_id is None and notification.target_type == "ALL_USERS":
            notif_read = db.query(NotificationRead).filter(
                NotificationRead.user_id == user_id,
                NotificationRead.notification_id == notification_id
            ).first()
            if not notif_read:
                notif_read = NotificationRead(
                    user_id=user_id,
                    notification_id=notification_id,
                    is_read=True,
                    is_deleted=False
                )
            else:
                notif_read.is_read = True
            db.add(notif_read)
            db.commit()
            return True
            
        return False

    def mark_all_as_read(self, db: Session, user_id: int) -> int:
        """Mark all unread notifications (personal and global) as read for a user"""
        # 1. Personal notifications
        unread_personal = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).all()
        count = len(unread_personal)
        for n in unread_personal:
            n.is_read = True
            db.add(n)
            
        # 2. Global notifications
        read_global_ids_stmt = select(NotificationRead.notification_id).where(
            NotificationRead.user_id == user_id,
            NotificationRead.is_read == True
        )
        
        deleted_global_ids_stmt = select(NotificationRead.notification_id).where(
            NotificationRead.user_id == user_id,
            NotificationRead.is_deleted == True
        )

        unread_global = db.query(Notification).filter(
            Notification.target_type == "ALL_USERS",
            Notification.user_id.is_(None),
            not_(Notification.id.in_(read_global_ids_stmt)),
            not_(Notification.id.in_(deleted_global_ids_stmt))
        ).all()
        
        count += len(unread_global)
        for n in unread_global:
            notif_read = db.query(NotificationRead).filter(
                NotificationRead.user_id == user_id,
                NotificationRead.notification_id == n.id
            ).first()
            if not notif_read:
                notif_read = NotificationRead(
                    user_id=user_id,
                    notification_id=n.id,
                    is_read=True,
                    is_deleted=False
                )
            else:
                notif_read.is_read = True
            db.add(notif_read)
            
        db.commit()
        return count

    def delete_notification(self, db: Session, notification_id: int, user_id: int) -> bool:
        """Delete or hide a notification for a user"""
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return False
            
        if notification.user_id == user_id:
            db.delete(notification)
            db.commit()
            return True
            
        elif notification.user_id is None and notification.target_type == "ALL_USERS":
            notif_read = db.query(NotificationRead).filter(
                NotificationRead.user_id == user_id,
                NotificationRead.notification_id == notification_id
            ).first()
            if not notif_read:
                notif_read = NotificationRead(
                    user_id=user_id,
                    notification_id=notification_id,
                    is_read=True,
                    is_deleted=True
                )
            else:
                notif_read.is_deleted = True
            db.add(notif_read)
            db.commit()
            return True
            
        return False

    def clear_all_read(self, db: Session, user_id: int) -> int:
        """Delete all read notifications for a user"""
        count = 0
        
        # 1. Delete personal notifications that are read
        personal_read = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.id.in_(
                db.query(NotificationRead.notification_id).filter(
                    NotificationRead.user_id == user_id,
                    NotificationRead.is_read == True
                )
            )
        ).all()
        for n in personal_read:
            db.delete(n)
            count += 1
        
        # 2. Mark global broadcast notifications as deleted
        global_read = db.query(NotificationRead).filter(
            NotificationRead.user_id == user_id,
            NotificationRead.is_read == True,
            NotificationRead.is_deleted == False
        ).all()
        for nr in global_read:
            nr.is_deleted = True
            count += 1
        
        db.commit()
        return count

crud_notification = CRUDNotification()

from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, not_, select
from app.models.notification import Notification, NotificationRead

class CRUDNotification:
    def get_user_notifications(self, db: Session, user_id: int, skip: int = 0, limit: int = 20) -> Tuple[List[Notification], int]:
        """Get notifications for a specific user (both personal and global system-wide) and unread count, respecting UserSetting preferences."""
        from app.models.user import UserSetting

        # Fetch user's notification preferences
        user_setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
        if user_setting and not user_setting.in_app_notifications_enabled:
            return [], 0

        def is_topic_enabled(notif_type: str) -> bool:
            if not user_setting:
                return True
            t = (notif_type or "").upper()
            if t in ["QUIZ_ASSIGNED", "EXAM_ASSIGNED"]:
                return user_setting.notify_quiz_assigned
            elif t in ["EXAM_REMINDER", "DEADLINE_REMINDER"]:
                return user_setting.notify_exam_reminder
            elif t in ["RESULTS_PUBLISHED", "EXAM_RESULTS", "GRADE_FEEDBACK"]:
                return user_setting.notify_results_published
            elif t in ["ROOM_INVITE", "LIVE_ROOM_INVITE", "GROUP_INVITE"]:
                return user_setting.notify_room_invite
            elif t in ["SYSTEM", "ANNOUNCEMENT", "MAINTENANCE"]:
                return user_setting.notify_system
            return True
        
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
        ).order_by(Notification.created_at.desc()).all()

        # Map dynamic is_read state onto Notification models in-memory & filter enabled topics
        mapped_notifications = []
        for notif, user_is_read in results:
            if not is_topic_enabled(notif.type):
                continue
            if notif.user_id is None:
                notif.is_read = user_is_read if user_is_read is not None else False
            mapped_notifications.append(notif)
        
        # Calculate unread count for enabled notifications
        unread_count = sum(1 for n in mapped_notifications if not n.is_read)
        
        # Apply pagination
        paginated_notifications = mapped_notifications[skip:skip + limit]
        
        return paginated_notifications, unread_count

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
            Notification.is_read == True
        ).all()
        for n in personal_read:
            db.delete(n)
            count += 1
        
        # 2. Mark global broadcast notifications as deleted if they were read
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

    def delete_all(self, db: Session, user_id: int) -> int:
        """Delete/hide all notifications (personal and global, read and unread) for a user"""
        count = 0
        
        # 1. Delete all personal notifications
        personal_notifs = db.query(Notification).filter(
            Notification.user_id == user_id
        ).all()
        for n in personal_notifs:
            db.delete(n)
            count += 1
            
        # 2. Mark all global broadcast notifications as deleted for this user
        global_notifs = db.query(Notification).filter(
            Notification.target_type == "ALL_USERS",
            Notification.user_id.is_(None)
        ).all()
        
        for gn in global_notifs:
            notif_read = db.query(NotificationRead).filter(
                NotificationRead.user_id == user_id,
                NotificationRead.notification_id == gn.id
            ).first()
            if not notif_read:
                notif_read = NotificationRead(
                    user_id=user_id,
                    notification_id=gn.id,
                    is_read=True,
                    is_deleted=True
                )
            else:
                notif_read.is_deleted = True
            db.add(notif_read)
            count += 1
            
        db.commit()
        return count

crud_notification = CRUDNotification()

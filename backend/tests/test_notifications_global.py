import unittest
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.notification import Notification, NotificationRead
from app.crud.crud_notification import crud_notification

class TestNotificationsGlobal(unittest.TestCase):
    def setUp(self):
        db_gen = get_db()
        self.db = next(db_gen)

        # Clean up any leftover database records from previous failed runs
        leftover_user_ids = select(User.id).where(User.email.in_(["test_notify_usera@example.com", "test_notify_userb@example.com"]))
        self.db.query(NotificationRead).filter(
            NotificationRead.user_id.in_(leftover_user_ids)
        ).delete(synchronize_session=False)

        # Get all notifications created in this test and delete them
        self.db.query(Notification).filter(
            Notification.target_type == "ALL_USERS",
            Notification.user_id.is_(None)
        ).delete(synchronize_session=False)

        self.db.query(User).filter(
            User.email.in_(["test_notify_usera@example.com", "test_notify_userb@example.com"])
        ).delete(synchronize_session=False)
        self.db.commit()

        # Create mock users
        self.user_a = User(
            email="test_notify_usera@example.com",
            password=get_password_hash("testpassword"),
            fullname="Test Notify User A",
            role="USER",
            status="ACTIVE"
        )
        self.user_b = User(
            email="test_notify_userb@example.com",
            password=get_password_hash("testpassword"),
            fullname="Test Notify User B",
            role="USER",
            status="ACTIVE"
        )
        self.db.add_all([self.user_a, self.user_b])
        self.db.commit()
        self.db.refresh(self.user_a)
        self.db.refresh(self.user_b)

    def tearDown(self):
        # Rollback any pending dirty state in session first
        self.db.rollback()

        # Clean up database
        self.db.query(NotificationRead).filter(
            NotificationRead.user_id.in_([self.user_a.id, self.user_b.id])
        ).delete(synchronize_session=False)

        # Get all notifications created in this test and delete them
        self.db.query(Notification).filter(
            Notification.target_type == "ALL_USERS",
            Notification.user_id.is_(None)
        ).delete(synchronize_session=False)

        self.db.query(User).filter(
            User.id.in_([self.user_a.id, self.user_b.id])
        ).delete(synchronize_session=False)
        
        self.db.commit()
        self.db.close()

    def test_global_notification_lifecycle(self):
        # 1. Create a single global notification
        global_notif = Notification(
            sender_id=None,
            user_id=None,  # None means all users
            target_type="ALL_USERS",
            title="System Maintenance Notice",
            content="The system will be down for maintenance tonight.",
            type="SYSTEM"
        )
        self.db.add(global_notif)
        self.db.commit()
        self.db.refresh(global_notif)

        # 2. Verify that both User A and User B receive this notification and it is UNREAD
        self.db.expire_all()
        notifs_a, unread_a = crud_notification.get_user_notifications(self.db, self.user_a.id)
        self.assertTrue(any(n.id == global_notif.id for n in notifs_a))
        global_in_a = next(n for n in notifs_a if n.id == global_notif.id)
        self.assertFalse(global_in_a.is_read)
        self.assertEqual(unread_a, 1)
        
        self.db.expire_all()
        notifs_b, unread_b = crud_notification.get_user_notifications(self.db, self.user_b.id)
        self.assertTrue(any(n.id == global_notif.id for n in notifs_b))
        global_in_b = next(n for n in notifs_b if n.id == global_notif.id)
        self.assertFalse(global_in_b.is_read)
        self.assertEqual(unread_b, 1)

        # 3. User A marks the global notification as READ
        success = crud_notification.mark_as_read(self.db, global_notif.id, self.user_a.id)
        self.assertTrue(success)

        # 4. Check if User A sees it as READ, but User B still sees it as UNREAD
        self.db.expire_all()
        notifs_a, unread_a = crud_notification.get_user_notifications(self.db, self.user_a.id)
        global_in_a = next(n for n in notifs_a if n.id == global_notif.id)
        self.assertTrue(global_in_a.is_read)
        self.assertEqual(unread_a, 0)
        
        self.db.expire_all()
        notifs_b, unread_b = crud_notification.get_user_notifications(self.db, self.user_b.id)
        global_in_b = next(n for n in notifs_b if n.id == global_notif.id)
        self.assertFalse(global_in_b.is_read)
        self.assertEqual(unread_b, 1)

        # 5. User A DELETES the global notification
        success_del = crud_notification.delete_notification(self.db, global_notif.id, self.user_a.id)
        self.assertTrue(success_del)

        # 6. Verify User A no longer receives the notification, but User B still does
        self.db.expire_all()
        notifs_a, unread_a = crud_notification.get_user_notifications(self.db, self.user_a.id)
        self.assertFalse(any(n.id == global_notif.id for n in notifs_a))
        self.assertEqual(unread_a, 0)
        
        self.db.expire_all()
        notifs_b, unread_b = crud_notification.get_user_notifications(self.db, self.user_b.id)
        self.assertTrue(any(n.id == global_notif.id for n in notifs_b))
        global_in_b = next(n for n in notifs_b if n.id == global_notif.id)
        self.assertFalse(global_in_b.is_read)
        self.assertEqual(unread_b, 1)

        # 7. User B marks all as read
        count_marked = crud_notification.mark_all_as_read(self.db, self.user_b.id)
        self.assertEqual(count_marked, 1)

        self.db.expire_all()
        notifs_b, unread_b = crud_notification.get_user_notifications(self.db, self.user_b.id)
        global_in_b = next(n for n in notifs_b if n.id == global_notif.id)
        self.assertTrue(global_in_b.is_read)
        self.assertEqual(unread_b, 0)

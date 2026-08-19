import logging
import threading
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.notification import Notification
from app.crud.crud_admin_setting import crud_admin_setting
from app.core.email import send_email
from app.core.config import settings

logger = logging.getLogger(__name__)


def _dispatch_email_async(to_email: str, subject: str, html_body: str) -> None:
    """Send email asynchronously in a daemon thread so it never blocks the request flow."""
    def _worker():
        try:
            send_email(email_to=to_email, subject=subject, html_content=html_body)
        except Exception as e:
            logger.warning(f"[AdminNotificationService] Failed to send email to {to_email}: {e}")

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()


def _push_ws_notification(user_id: int, title: str, content: str, action_url: Optional[str] = None) -> None:
    """Push real-time WebSocket notification to an active Admin connection."""
    try:
        import asyncio
        from app.api.v1.websockets.notification_manager import notification_manager

        payload = {
            "type": "NOTIFICATION",
            "title": title,
            "content": content,
            "action_url": action_url,
        }

        loop = None
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            try:
                loop = asyncio.get_event_loop_policy().get_event_loop()
            except Exception:
                loop = None

        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(notification_manager.send_personal_message(payload, user_id), loop)
        else:
            try:
                asyncio.run(notification_manager.send_personal_message(payload, user_id))
            except Exception:
                pass
    except Exception as e:
        logger.debug(f"[AdminNotificationService] WS push suppressed: {e}")


def _build_admin_email_template(title: str, badge_text: str, badge_color: str, details_html: str) -> str:
    """Generate a responsive HTML email for Admin alerts."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0; overflow: hidden; padding: 36px 32px;">
            <!-- Brand & Badge Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
                <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                    🎓 QuizzApp <span style="font-size: 13px; font-weight: 600; color: #64748b; margin-left: 6px;">System Alert</span>
                </div>
                <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background-color: {badge_color}15; color: {badge_color}; border: 1px solid {badge_color}30;">
                    {badge_text}
                </span>
            </div>

            <!-- Title -->
            <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">
                {title}
            </h2>

            <!-- Details Container -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                {details_html}
            </div>

            <!-- Timestamp & Context -->
            <div style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px;">
                Generated automatically by QuizzApp Notification Engine at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}.
            </div>

            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 12px; color: #94a3b8;">
                <p style="margin: 0;">© 2026 QuizzApp Administration. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


class AdminNotificationService:
    """Enterprise-grade service to filter and dispatch system events to Super Admins based on admin_settings."""

    def _get_active_admins(self, db: Session) -> List[User]:
        """Fetch all active super admin accounts."""
        try:
            return db.query(User).filter(User.role == "SUPER_ADMIN", User.status == "ACTIVE").all()
        except Exception as e:
            logger.error(f"[AdminNotificationService] Error querying admins: {e}")
            return []

    def notify_user_registered(self, db: Session, registered_user: User) -> None:
        """Triggered when a new user registers an account."""
        try:
            setting = crud_admin_setting.get_or_create(db)
            inapp_enabled = setting.lifecycle_user_registered_inapp
            email_enabled = setting.lifecycle_user_registered_email and setting.email_alerts_enabled

            if not inapp_enabled and not email_enabled:
                return

            admins = self._get_active_admins(db)
            if not admins:
                return

            title = "New User Registered"
            content = f"User '{registered_user.fullname or registered_user.email}' ({registered_user.email}) has just registered on the platform."

            # Dispatch In-App
            if inapp_enabled:
                for admin in admins:
                    notif = Notification(
                        user_id=admin.id,
                        title=title,
                        content=content,
                        type="SYSTEM",
                    )
                    db.add(notif)
                    _push_ws_notification(admin.id, title, content)
                db.commit()

            # Dispatch Email
            if email_enabled:
                details = f"""
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Full Name:</strong> {registered_user.fullname or 'N/A'}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Email:</strong> {registered_user.email}</p>
                <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Initial Role:</strong> {registered_user.role}</p>
                """
                html_body = _build_admin_email_template(
                    title="A new user account was registered",
                    badge_text="Account Lifecycle",
                    badge_color="#4f46e5",
                    details_html=details
                )
                for admin in admins:
                    if admin.email:
                        _dispatch_email_async(admin.email, f"[QuizzApp Alert] {title}", html_body)

        except Exception as e:
            logger.error(f"[AdminNotificationService] Error in notify_user_registered: {e}")

    def notify_user_deleted(self, db: Session, user_email: str, user_id: int, deleted_by: User) -> None:
        """Triggered when an account is permanently deleted by an admin."""
        try:
            setting = crud_admin_setting.get_or_create(db)
            inapp_enabled = setting.lifecycle_user_deleted_inapp
            email_enabled = setting.lifecycle_user_deleted_email and setting.email_alerts_enabled

            if not inapp_enabled and not email_enabled:
                return

            admins = self._get_active_admins(db)
            if not admins:
                return

            title = "User Account Deleted"
            content = f"User account '{user_email}' (ID: {user_id}) was permanently removed by admin '{deleted_by.email}'."

            # Dispatch In-App
            if inapp_enabled:
                for admin in admins:
                    if admin.id != deleted_by.id:  # Optionally notify other admins or all
                        notif = Notification(
                            user_id=admin.id,
                            title=title,
                            content=content,
                            type="SYSTEM",
                        )
                        db.add(notif)
                        _push_ws_notification(admin.id, title, content)
                db.commit()

            # Dispatch Email
            if email_enabled:
                details = f"""
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Deleted Email:</strong> {user_email}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>User ID:</strong> {user_id}</p>
                <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Action Performed By:</strong> {deleted_by.email}</p>
                """
                html_body = _build_admin_email_template(
                    title="User account permanently deleted",
                    badge_text="User Removed",
                    badge_color="#ef4444",
                    details_html=details
                )
                for admin in admins:
                    if admin.email:
                        _dispatch_email_async(admin.email, f"[QuizzApp Alert] {title}", html_body)

        except Exception as e:
            logger.error(f"[AdminNotificationService] Error in notify_user_deleted: {e}")

    def notify_user_status_changed(self, db: Session, target_user: User, old_status: str, new_status: str, modified_by: User) -> None:
        """Triggered when a user status is locked/unlocked or changed."""
        try:
            setting = crud_admin_setting.get_or_create(db)
            inapp_enabled = setting.lifecycle_user_status_inapp
            email_enabled = setting.lifecycle_user_status_email and setting.email_alerts_enabled

            if not inapp_enabled and not email_enabled:
                return

            admins = self._get_active_admins(db)
            if not admins:
                return

            title = f"User Status Changed: {new_status}"
            content = f"User '{target_user.email}' status was changed from {old_status} to {new_status} by '{modified_by.email}'."

            if inapp_enabled:
                for admin in admins:
                    if admin.id != modified_by.id:
                        notif = Notification(
                            user_id=admin.id,
                            title=title,
                            content=content,
                            type="SYSTEM",
                        )
                        db.add(notif)
                        _push_ws_notification(admin.id, title, content)
                db.commit()

            if email_enabled:
                details = f"""
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Target User:</strong> {target_user.email}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Previous Status:</strong> {old_status}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>New Status:</strong> {new_status}</p>
                <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Changed By:</strong> {modified_by.email}</p>
                """
                html_body = _build_admin_email_template(
                    title=f"User Status Modified ({new_status})",
                    badge_text="Account Lifecycle",
                    badge_color="#f59e0b",
                    details_html=details
                )
                for admin in admins:
                    if admin.email:
                        _dispatch_email_async(admin.email, f"[QuizzApp Alert] {title}", html_body)

        except Exception as e:
            logger.error(f"[AdminNotificationService] Error in notify_user_status_changed: {e}")

    def notify_permission_changed(self, db: Session, target_user: User, old_role: str, new_role: str, modified_by: User) -> None:
        """Triggered when high-privilege roles (SUPER_ADMIN / TEACHER) are assigned."""
        try:
            setting = crud_admin_setting.get_or_create(db)
            inapp_enabled = setting.security_permission_changes_inapp
            email_enabled = setting.security_permission_changes_email and setting.email_alerts_enabled

            if not inapp_enabled and not email_enabled:
                return

            admins = self._get_active_admins(db)
            if not admins:
                return

            title = f"Role Escalation: {new_role}"
            content = f"User '{target_user.email}' was granted role '{new_role}' (formerly '{old_role}') by '{modified_by.email}'."

            if inapp_enabled:
                for admin in admins:
                    notif = Notification(
                        user_id=admin.id,
                        title=title,
                        content=content,
                        type="SYSTEM",
                    )
                    db.add(notif)
                    _push_ws_notification(admin.id, title, content)
                db.commit()

            if email_enabled:
                details = f"""
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Target Account:</strong> {target_user.email}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Old Role:</strong> {old_role}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>New Granted Role:</strong> <span style="color: #4f46e5; font-weight: 700;">{new_role}</span></p>
                <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Action By:</strong> {modified_by.email}</p>
                """
                html_body = _build_admin_email_template(
                    title="Important Permission & Role Change Detected",
                    badge_text="Security Audit",
                    badge_color="#4f46e5",
                    details_html=details
                )
                for admin in admins:
                    if admin.email:
                        _dispatch_email_async(admin.email, f"[QuizzApp Security] {title}", html_body)

        except Exception as e:
            logger.error(f"[AdminNotificationService] Error in notify_permission_changed: {e}")

    def notify_critical_data_deletion(self, db: Session, item_type: str, item_title: str, item_id: int, deleted_by: User) -> None:
        """Triggered when an Exam or Group is permanently deleted."""
        try:
            setting = crud_admin_setting.get_or_create(db)
            inapp_enabled = setting.security_critical_data_deletion_inapp
            email_enabled = setting.security_critical_data_deletion_email and setting.email_alerts_enabled

            if not inapp_enabled and not email_enabled:
                return

            admins = self._get_active_admins(db)
            if not admins:
                return

            title = f"Critical Data Deleted: {item_type}"
            content = f"{item_type} '{item_title}' (ID: {item_id}) was permanently deleted by '{deleted_by.email}'."

            if inapp_enabled:
                for admin in admins:
                    notif = Notification(
                        user_id=admin.id,
                        title=title,
                        content=content,
                        type="SYSTEM",
                    )
                    db.add(notif)
                    _push_ws_notification(admin.id, title, content)
                db.commit()

            if email_enabled:
                details = f"""
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Resource Type:</strong> {item_type}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Item Title / Name:</strong> {item_title}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Resource ID:</strong> {item_id}</p>
                <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Deleted By:</strong> {deleted_by.email}</p>
                """
                html_body = _build_admin_email_template(
                    title=f"Critical Data Deletion: {item_type}",
                    badge_text="Critical Deletion",
                    badge_color="#e11d48",
                    details_html=details
                )
                for admin in admins:
                    if admin.email:
                        _dispatch_email_async(admin.email, f"[QuizzApp Security] {title}", html_body)

        except Exception as e:
            logger.error(f"[AdminNotificationService] Error in notify_critical_data_deletion: {e}")

    def notify_user_imported(self, db: Session, admin_id: int, job_id: str, imported_count: int, total_count: int) -> None:
        """Triggered when a bulk user file import is finished."""
        try:
            setting = crud_admin_setting.get_or_create(db)
            inapp_enabled = setting.lifecycle_user_imported_inapp
            email_enabled = setting.lifecycle_user_imported_email and setting.email_alerts_enabled

            if not inapp_enabled and not email_enabled:
                return

            admin = db.query(User).filter(User.id == admin_id).first()
            if not admin:
                return

            title = "Bulk Users Imported"
            content = f"Import job completed: Successfully imported {imported_count}/{total_count} users into the system."

            if inapp_enabled:
                notif = Notification(
                    user_id=admin.id,
                    title=title,
                    content=content,
                    type="SYSTEM",
                )
                db.add(notif)
                db.commit()
                _push_ws_notification(admin.id, title, content)

            if email_enabled and admin.email:
                details = f"""
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Job ID:</strong> {job_id}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Total Valid Rows:</strong> {total_count}</p>
                <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Imported Accounts:</strong> <span style="color: #059669; font-weight: 700;">{imported_count}</span></p>
                """
                html_body = _build_admin_email_template(
                    title="Bulk Users Import Completed",
                    badge_text="Account Lifecycle",
                    badge_color="#059669",
                    details_html=details
                )
                _dispatch_email_async(admin.email, f"[QuizzApp Alert] {title}", html_body)

        except Exception as e:
            logger.error(f"[AdminNotificationService] Error in notify_user_imported: {e}")


admin_notification_service = AdminNotificationService()

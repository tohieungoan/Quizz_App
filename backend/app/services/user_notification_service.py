import logging
import threading
from typing import Optional
from sqlalchemy.orm import Session

from app.models.user import User, UserSetting
from app.models.notification import Notification
from app.core.email import send_email
from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_sync_ws_notification(user_id: int, title: str, content: str, action_url: Optional[str] = None) -> None:
    """
    Safely dispatch a WebSocket notification from a synchronous thread worker in FastAPI.
    """
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
            except Exception as inner_e:
                logger.warning(f"[UserNotificationService] WS dispatch warning: {inner_e}")
    except Exception as e:
        logger.warning(f"[UserNotificationService] Failed to push WS notification to user {user_id}: {e}")


def _dispatch_user_email_async(email_to: str, title: str, content: str, action_url: Optional[str] = None) -> None:
    """
    Asynchronously send notification email via background daemon thread.
    """
    def _worker():
        try:
            full_action_link = ""
            if action_url:
                if action_url.startswith("http"):
                    full_action_link = action_url
                else:
                    full_action_link = f"{settings.FRONTEND_URL.rstrip('/')}/{action_url.lstrip('/')}"

            action_button_html = ""
            if full_action_link:
                action_button_html = f"""
                <div style="text-align: center; margin: 28px 0;">
                    <a href="{full_action_link}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);">View Details</a>
                </div>
                """

            subject = f"[QuizzApp] {title}"
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{title}</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
                <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0; overflow: hidden; padding: 36px 32px;">
                    <!-- Brand Header -->
                    <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
                        <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                            🎓 QuizzApp <span style="font-size: 12px; font-weight: 600; color: #64748b; margin-left: 4px;">Notification</span>
                        </div>
                    </div>

                    <!-- Notification Title -->
                    <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; text-align: center;">
                        {title}
                    </h2>

                    <!-- Notification Content -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                        {content}
                    </div>

                    {action_button_html}

                    <!-- Footer -->
                    <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8;">
                        <p style="margin: 0 0 4px 0;">You received this email based on your QuizzApp notification preferences.</p>
                        <p style="margin: 0;">© 2026 QuizzApp. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            res = send_email(email_to=email_to, subject=subject, html_content=html_body)
            logger.info(f"[UserNotificationService] SMTP send_email to {email_to} result: {res}")
            print(f"[UserNotificationService] SMTP send_email to {email_to} result: {res}")
        except Exception as e:
            logger.warning(f"[UserNotificationService] Email dispatch failed for {email_to}: {e}")
            print(f"[UserNotificationService] Email dispatch failed for {email_to}: {e}")

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()


class UserNotificationService:
    def send_notification(
        self,
        db: Session,
        user_id: int,
        title: str,
        content: str,
        type: str,
        sender_id: Optional[int] = None,
        action_url: Optional[str] = None,
        target_group_id: Optional[int] = None,
    ) -> Optional[Notification]:
        """
        Dispatches in-app badge notifications and/or email notifications based on user_settings.
        """
        # Fetch or initialize user settings
        user_setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
        if not user_setting:
            user_setting = UserSetting(
                user_id=user_id,
                email_notifications_enabled=True,
                in_app_notifications_enabled=True,
                notify_system=True,
                notify_quiz_assigned=True,
                notify_exam_reminder=True,
                notify_results_published=True,
                notify_room_invite=True,
            )
            db.add(user_setting)
            db.flush()

        # Safe boolean evaluation helper
        def get_bool_setting(attr_name: str) -> bool:
            val = getattr(user_setting, attr_name, True)
            return True if val is None else bool(val)

        in_app_enabled = get_bool_setting('in_app_notifications_enabled')
        email_enabled = get_bool_setting('email_notifications_enabled')

        # Map type to user_settings topic flag
        upper_type = (type or "").upper()
        topic_enabled = True

        if upper_type in ["QUIZ_ASSIGNED", "EXAM_ASSIGNED"]:
            topic_enabled = get_bool_setting('notify_quiz_assigned')
        elif upper_type in ["EXAM_REMINDER", "DEADLINE_REMINDER"]:
            topic_enabled = get_bool_setting('notify_exam_reminder')
        elif upper_type in ["RESULTS_PUBLISHED", "EXAM_RESULTS", "GRADE_FEEDBACK"]:
            topic_enabled = get_bool_setting('notify_results_published')
        elif upper_type in ["ROOM_INVITE", "LIVE_ROOM_INVITE", "GROUP_INVITE"]:
            topic_enabled = get_bool_setting('notify_room_invite')
        elif upper_type in ["SYSTEM", "ANNOUNCEMENT", "MAINTENANCE"]:
            topic_enabled = get_bool_setting('notify_system')

        created_notification = None

        # 1. In-App Notification Dispatch
        if in_app_enabled and topic_enabled:
            created_notification = Notification(
                sender_id=sender_id,
                user_id=user_id,
                target_type="PERSONAL",
                target_group_id=target_group_id,
                title=title,
                content=content,
                type=type,
                action_url=action_url,
                is_read=False,
            )
            db.add(created_notification)
            db.flush()

            # Send real-time WebSocket badge update
            _send_sync_ws_notification(
                user_id=user_id,
                title=title,
                content=content,
                action_url=action_url,
            )

        # 2. Email Notification Dispatch
        if email_enabled and topic_enabled:
            recipient_user = db.query(User).filter(User.id == user_id).first()
            if recipient_user:
                target_email = user_setting.notification_email or recipient_user.email
                if target_email:
                    logger.info(f"[UserNotificationService] Dispatching email to {target_email} (User ID {user_id}) for topic '{type}'")
                    print(f"[UserNotificationService] Dispatching email to {target_email} (User ID {user_id}) for topic '{type}'")
                    _dispatch_user_email_async(
                        email_to=target_email,
                        title=title,
                        content=content,
                        action_url=action_url,
                    )
        else:
            logger.info(f"[UserNotificationService] Email notification skipped for User ID {user_id} (email_enabled={email_enabled}, topic_enabled={topic_enabled})")

        return created_notification


user_notification_service = UserNotificationService()

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    email_to: str,
    subject: str,
    html_content: str,
) -> bool:
    """
    Gửi Email qua SMTP Server được cấu hình trong settings.
    """
    if not settings.SMTP_USER or settings.SMTP_USER == "your_email@gmail.com":
        logger.warning(
            f"[SMTP] Chưa cấu hình SMTP_USER thực tế trong file .env. Bỏ qua bước gửi email tới: {email_to}"
        )
        return False

    if not settings.SMTP_PASSWORD or settings.SMTP_PASSWORD == "your_app_password":
        logger.warning(
            f"[SMTP] Chưa cấu hình SMTP_PASSWORD thực tế trong file .env. Bỏ qua bước gửi email tới: {email_to}"
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
        msg["To"] = email_to

        html_part = MIMEText(html_content, "html", "utf-8")
        msg.attach(html_part)

        # Kết nối tới SMTP Server
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        if settings.SMTP_TLS:
            server.starttls()
        
        # Tự động loại bỏ khoảng trắng trong Mật khẩu ứng dụng
        smtp_pass = settings.SMTP_PASSWORD.replace(" ", "")
        server.login(settings.SMTP_USER, smtp_pass)
        server.sendmail(settings.EMAILS_FROM_EMAIL or settings.SMTP_USER, email_to, msg.as_string())
        server.quit()


        logger.info(f"[SMTP] Đã gửi email thành công tới: {email_to}")
        return True
    except Exception as e:
        logger.error(f"[SMTP] Lỗi khi gửi email tới {email_to}: {str(e)}")
        return False


def send_reset_password_email(email_to: str, reset_url: str) -> bool:
    """
    Tạo Email HTML mẫu và gửi đường dẫn khôi phục mật khẩu.
    """
    subject = "QuizzApp - Password Reset Request"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; overflow: hidden; padding: 40px;">
            <!-- Brand Logo Header -->
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); margin-bottom: 12px; box-shadow: 0 8px 16px rgba(79, 70, 229, 0.2); text-align: center; vertical-align: middle;">
                    <span style="font-size: 28px; line-height: 60px; display: block; text-align: center; margin: 0; padding: 0;">🎓</span>
                </div>
                <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;">QuizzApp</h1>
            </div>

            <!-- Email Body Content -->
            <div style="color: #334155; line-height: 1.6;">
                <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; text-align: center;">Reset your password</h2>
                <p style="font-size: 15px; color: #475569; margin: 0 0 16px 0; text-align: center;">We received a request to reset the password for your QuizzApp account associated with <strong style="color: #0f172a;">{email_to}</strong>.</p>
                <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0; text-align: center;">Click the button below to create a secure new password. This link will expire in <strong>15 minutes</strong>.</p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{reset_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 6px 20px rgba(79, 70, 229, 0.25); text-align: center;">Reset Password</a>
                </div>

                <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; text-align: center;">If you didn't request a password reset, you can safely ignore this email.</p>
                
                <!-- Link Box Fallback -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-top: 32px;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Having trouble? Copy this link:</p>
                    <a href="{reset_url}" target="_blank" style="display: block; font-size: 12px; color: #4f46e5; text-decoration: none; word-break: break-all; font-family: monospace;">{reset_url}</a>
                </div>
            </div>

            <!-- Footer Section -->
            <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
                <p style="margin: 0 0 4px 0;">© 2026 QuizzApp. All rights reserved.</p>
                <p style="margin: 0;">Made with ❤️ for engaging learning experiences.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(email_to=email_to, subject=subject, html_content=html_content)


def send_verification_email(email_to: str, verify_url: str) -> bool:
    """
    Gửi Email chứa liên kết xác minh tài khoản mới đăng ký.
    """
    subject = "QuizzApp - Please Verify Your Email Address"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email address</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; overflow: hidden; padding: 40px;">
            <!-- Brand Logo Header -->
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); margin-bottom: 12px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2); text-align: center; vertical-align: middle;">
                    <span style="font-size: 28px; line-height: 60px; display: block; text-align: center; margin: 0; padding: 0;">🎓</span>
                </div>
                <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;">QuizzApp</h1>
            </div>

            <!-- Email Body Content -->
            <div style="color: #334155; line-height: 1.6;">
                <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; text-align: center;">Welcome to QuizzApp!</h2>
                <p style="font-size: 15px; color: #475569; margin: 0 0 16px 0; text-align: center;">Thank you for registering. Please confirm your email address <strong style="color: #0f172a;">{email_to}</strong> to activate your account and start exploring quizzes.</p>
                <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0; text-align: center;">Click the button below to verify your email. This link is valid for <strong>24 hours</strong>.</p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{verify_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25); text-align: center;">Verify Email Address</a>
                </div>

                <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; text-align: center;">If you did not sign up for this account, you can safely ignore this email.</p>
                
                <!-- Link Box Fallback -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-top: 32px;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Having trouble? Copy this link:</p>
                    <a href="{verify_url}" target="_blank" style="display: block; font-size: 12px; color: #4f46e5; text-decoration: none; word-break: break-all; font-family: monospace;">{verify_url}</a>
                </div>
            </div>

            <!-- Footer Section -->
            <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
                <p style="margin: 0 0 4px 0;">© 2026 QuizzApp. All rights reserved.</p>
                <p style="margin: 0;">Made with ❤️ for engaging learning experiences.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(email_to=email_to, subject=subject, html_content=html_content)


def send_notification_email_verification(email_to: str, verify_url: str):
    subject = "Verify your Notification Email - QuizzApp"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Notification Email</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); padding: 40px; border: 1px solid #e2e8f0; border-top: 5px solid #4f46e5;">
            <!-- Header Section -->
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; background-color: #e0e7ff; color: #4f46e5; font-size: 32px; font-weight: bold; text-align: center; margin: 0 auto 16px auto;">
                    🎓
                </div>
                <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;">QuizzApp</h1>
            </div>

            <!-- Body Section -->
            <div style="line-height: 1.6;">
                <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; text-align: center;">Verify Notification Email</h2>
                <p style="font-size: 15px; color: #475569; margin: 0 0 16px 0; text-align: center;">We received a request to set <strong style="color: #0f172a;">{email_to}</strong> as your active notification email address for QuizzApp.</p>
                <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0; text-align: center;">Click the button below to confirm and activate this email. This link is valid for <strong>2 hours</strong>.</p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{verify_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 6px 20px rgba(79, 70, 229, 0.25); text-align: center;">Confirm & Verify Email</a>
                </div>

                <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; text-align: center;">If you did not request this change, you can safely ignore this email.</p>
                
                <!-- Link Box Fallback -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-top: 32px;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Having trouble? Copy this link:</p>
                    <a href="{verify_url}" target="_blank" style="display: block; font-size: 12px; color: #4f46e5; text-decoration: none; word-break: break-all; font-family: monospace;">{verify_url}</a>
                </div>
            </div>

            <!-- Footer Section -->
            <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
                <p style="margin: 0 0 4px 0;">© 2026 QuizzApp. All rights reserved.</p>
                <p style="margin: 0;">Made with ❤️ for engaging learning experiences.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(email_to=email_to, subject=subject, html_content=html_content)



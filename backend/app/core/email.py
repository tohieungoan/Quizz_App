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
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #f4f6f9;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 580px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }}
            .header {{
                background: linear-[#6366f1], #4f46e5);
                background-color: #4f46e5;
                padding: 32px;
                text-align: center;
                color: #ffffff;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }}
            .content {{
                padding: 36px 32px;
                color: #334155;
                line-height: 1.6;
            }}
            .content h2 {{
                font-size: 20px;
                color: #0f172a;
                margin-top: 0;
            }}
            .btn-container {{
                text-align: center;
                margin: 32px 0;
            }}
            .btn {{
                display: inline-block;
                background-color: #4f46e5;
                color: #ffffff !important;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 15px;
                box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 20px 32px;
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
            }}
            .link-box {{
                background: #f1f5f9;
                padding: 12px;
                border-radius: 8px;
                word-break: break-all;
                font-size: 12px;
                color: #64748b;
                margin-top: 16px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎮 QuizzApp</h1>
            </div>
            <div class="content">
                <h2>Hello,</h2>
                <p>We received a request to reset the password for your QuizzApp account associated with <strong>{email_to}</strong>.</p>
                <p>Click the button below to reset your password. This link is valid for <strong>15 minutes</strong> and can only be used once.</p>
                
                <div class="btn-container">
                    <a href="{reset_url}" class="btn" target="_blank">Reset Password</a>
                </div>

                <p style="font-size: 13px; color: #64748b;">If the button above doesn't work, copy and paste the following link into your browser:</p>
                <div class="link-box">{reset_url}</div>

                <p style="margin-top: 24px; font-size: 13px; color: #64748b;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
                © 2026 QuizzApp. All rights reserved.
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
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #f4f6f9;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 580px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }}
            .header {{
                background-color: #4f46e5;
                padding: 32px;
                text-align: center;
                color: #ffffff;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 700;
            }}
            .content {{
                padding: 36px 32px;
                color: #334155;
                line-height: 1.6;
            }}
            .content h2 {{
                font-size: 20px;
                color: #0f172a;
                margin-top: 0;
            }}
            .btn-container {{
                text-align: center;
                margin: 32px 0;
            }}
            .btn {{
                display: inline-block;
                background-color: #10b981;
                color: #ffffff !important;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 15px;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 20px 32px;
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
            }}
            .link-box {{
                background: #f1f5f9;
                padding: 12px;
                border-radius: 8px;
                word-break: break-all;
                font-size: 12px;
                color: #64748b;
                margin-top: 16px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎮 Welcome to QuizzApp</h1>
            </div>
            <div class="content">
                <h2>Welcome aboard! 🎉</h2>
                <p>Thank you for signing up for QuizzApp. Please confirm your email address <strong>{email_to}</strong> to activate your account and start exploring quizzes.</p>
                
                <div class="btn-container">
                    <a href="{verify_url}" class="btn" target="_blank">Verify Email Address</a>
                </div>

                <p style="font-size: 13px; color: #64748b;">If the button above doesn't work, copy and paste the following link into your browser:</p>
                <div class="link-box">{verify_url}</div>

                <p style="margin-top: 24px; font-size: 13px; color: #64748b;">This verification link will expire in 24 hours. If you didn't create an account, please disregard this email.</p>
            </div>
            <div class="footer">
                © 2026 QuizzApp. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(email_to=email_to, subject=subject, html_content=html_content)


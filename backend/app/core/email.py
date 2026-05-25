import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_email(to: str, subject: str, html: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print(f"\n[EMAIL] To: {to}\n[EMAIL] Subject: {subject}\n[EMAIL] Body:\n{html}\n")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.FROM_EMAIL, to, msg.as_string())


def send_password_reset(to: str, token: str) -> None:
    url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_email(
        to=to,
        subject="Reset your Desiface password",
        html=f"""
        <p>Hi,</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="{url}">{url}</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
        """,
    )


def send_verification_email(to: str, token: str) -> None:
    url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_email(
        to=to,
        subject="Verify your Desiface email",
        html=f"""
        <p>Welcome to Desiface!</p>
        <p>Click the link below to verify your email address.</p>
        <p><a href="{url}">{url}</a></p>
        """,
    )

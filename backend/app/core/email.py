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


def send_otp_email(to: str, code: str) -> None:
    send_email(
        to=to,
        subject="Your Desiface sign-in code",
        html=f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <div style="margin-bottom:24px;">
            <span style="background:#0A66C2;color:#fff;font-weight:900;font-style:italic;
                         padding:6px 10px;border-radius:4px;font-size:18px;">df</span>
            <span style="margin-left:8px;font-size:18px;font-weight:600;color:#0A66C2;">Desiface</span>
          </div>
          <h2 style="font-size:22px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">Your sign-in code</h2>
          <p style="color:#555;margin-bottom:24px;">Use the code below to sign in to Desiface. It expires in 10 minutes.</p>
          <div style="background:#f3f7fc;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#0A66C2;">{code}</span>
          </div>
          <p style="color:#999;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        """,
    )

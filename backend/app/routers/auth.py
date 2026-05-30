import random
import re
import string
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.email import send_otp_email
from app.core.security import create_access_token, decode_access_token
from app.models.otp_token import OTPToken
from app.models.user import User
from app.schemas.user import Token, UserPublic
from app.services.news_scraper import auto_connect_to_news_bot

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/request-otp")

_OTP_REQUEST_LIMIT = "1000/minute" if settings.DEV_MODE else "5/minute"
_OTP_VERIFY_LIMIT = "1000/minute" if settings.DEV_MODE else "10/minute"

OTP_EXPIRY_MINUTES = 10


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _generate_username(email: str, db: Session) -> str:
    base = re.sub(r"[^a-z0-9_]", "", email.split("@")[0].lower())[:20] or "user"
    if len(base) < 3:
        base = base + "user"
    username = base
    count = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base}{count}"
        count += 1
    return username


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerify(BaseModel):
    email: EmailStr
    code: str


@router.post("/request-otp")
@limiter.limit(_OTP_REQUEST_LIMIT)
def request_otp(request: Request, payload: OTPRequest, db: Session = Depends(get_db)):
    # Invalidate any existing unused OTPs for this email
    db.query(OTPToken).filter(
        OTPToken.email == payload.email,
        OTPToken.used == False,  # noqa: E712
    ).update({"used": True})

    code = _generate_otp()
    otp = OTPToken(
        email=payload.email,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )
    db.add(otp)
    db.commit()

    send_otp_email(payload.email, code)

    resp: dict = {"message": "OTP sent to your email"}
    if settings.DEV_MODE:
        resp["dev_otp"] = code
    return resp


@router.post("/verify-otp", response_model=Token)
@limiter.limit(_OTP_VERIFY_LIMIT)
def verify_otp(request: Request, payload: OTPVerify, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    otp = db.query(OTPToken).filter(
        OTPToken.email == payload.email,
        OTPToken.code == payload.code,
        OTPToken.used == False,  # noqa: E712
        OTPToken.expires_at > now,
    ).first()

    if not otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code")

    otp.used = True

    user = db.query(User).filter(User.email == payload.email).first()
    is_new_user = user is None
    if is_new_user:
        username = _generate_username(payload.email, db)
        user = User(
            id=uuid.uuid4(),
            email=payload.email,
            username=username,
            hashed_password=None,
            is_verified=True,
        )
        db.add(user)

    db.commit()
    db.refresh(user)

    if is_new_user:
        auto_connect_to_news_bot(user.id, db)
        db.commit()

    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserPublic.model_validate(user))


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return current_user

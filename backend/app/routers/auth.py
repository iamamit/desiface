import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.email import send_password_reset, send_verification_email
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.models.token import EmailVerificationToken, PasswordResetToken
from app.models.user import User
from app.schemas.user import Token, UserPublic, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# In dev/test mode use very high limits so automated tests aren't throttled
_REGISTER_LIMIT = "1000/minute" if settings.DEV_MODE else "10/minute"
_LOGIN_LIMIT = "1000/minute" if settings.DEV_MODE else "20/minute"
_FORGOT_LIMIT = "1000/minute" if settings.DEV_MODE else "5/minute"


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit(_REGISTER_LIMIT)
def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send verification email
    token_str = secrets.token_urlsafe(32)
    ev_token = EmailVerificationToken(
        user_id=user.id,
        token=token_str,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=48),
    )
    db.add(ev_token)
    db.commit()
    send_verification_email(user.email, token_str)

    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserPublic.model_validate(user))


@router.post("/login", response_model=Token)
@limiter.limit(_LOGIN_LIMIT)
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserPublic.model_validate(user))


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return current_user


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
@limiter.limit(_FORGOT_LIMIT)
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # Always return 200 to not leak whether email exists
    if not user:
        resp = {"message": "If that email exists, a reset link has been sent."}
        if settings.DEV_MODE:
            resp["dev_token"] = None
        return resp

    # Invalidate old tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,  # noqa: E712
    ).update({"used": True})

    token_str = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token_str,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db.add(reset_token)
    db.commit()

    send_password_reset(user.email, token_str)

    resp: dict = {"message": "If that email exists, a reset link has been sent."}
    if settings.DEV_MODE:
        resp["dev_token"] = token_str
    return resp


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    now = datetime.now(timezone.utc)
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token,
        PasswordResetToken.used == False,  # noqa: E712
        PasswordResetToken.expires_at > now,
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = reset_token.user
    user.hashed_password = hash_password(payload.new_password)
    reset_token.used = True
    db.commit()

    return {"message": "Password reset successfully"}


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    ev_token = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token == token,
        EmailVerificationToken.expires_at > now,
    ).first()

    if not ev_token:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user = ev_token.user
    user.is_verified = True
    db.delete(ev_token)
    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
def resend_verification(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.is_verified:
        return {"message": "Email already verified"}

    db.query(EmailVerificationToken).filter(EmailVerificationToken.user_id == current_user.id).delete()

    token_str = secrets.token_urlsafe(32)
    ev_token = EmailVerificationToken(
        user_id=current_user.id,
        token=token_str,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=48),
    )
    db.add(ev_token)
    db.commit()

    send_verification_email(current_user.email, token_str)

    resp: dict = {"message": "Verification email sent"}
    if settings.DEV_MODE:
        resp["dev_token"] = token_str
    return resp

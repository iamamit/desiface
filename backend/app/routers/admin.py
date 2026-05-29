import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.comment import Comment
from app.models.connection import Connection
from app.models.error_log import ErrorLog
from app.models.group import Group, GroupMember
from app.models.job import Job
from app.models.like import Like
from app.models.message import Message
from app.models.post import Post
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


# ── Bootstrap: promote first admin via secret ──────────────────────────────

class BootstrapPayload(BaseModel):
    email: str
    secret: str


@router.post("/bootstrap", summary="Promote a user to admin using the bootstrap secret")
def bootstrap_admin(payload: BootstrapPayload, db: Session = Depends(get_db)):
    """Call once (or as needed) with ADMIN_BOOTSTRAP_SECRET to grant admin to any email."""
    expected = getattr(settings, "ADMIN_BOOTSTRAP_SECRET", None)
    if not expected or payload.secret != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid secret")
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_admin = True
    db.commit()
    return {"message": f"{user.email} is now an admin"}


# ── Role management (admin only) ───────────────────────────────────────────

class RolePayload(BaseModel):
    is_admin: bool


@router.patch("/users/{user_id}/role", summary="Set or revoke admin role")
def set_user_role(
    user_id: uuid.UUID,
    payload: RolePayload,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    target.is_admin = payload.is_admin
    db.commit()
    return {"user_id": str(target.id), "email": target.email, "is_admin": target.is_admin}


# ── KPI metrics ────────────────────────────────────────────────────────────

def _count(db: Session, model, since: datetime | None = None):
    q = db.query(func.count(model.id))
    if since:
        q = q.filter(model.created_at >= since)
    return q.scalar() or 0


@router.get("/metrics", summary="Dashboard KPIs")
def get_metrics(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    # Active users last 7 days: anyone who posted, liked, or messaged
    active_users = db.execute(text("""
        SELECT COUNT(DISTINCT uid) FROM (
            SELECT user_id AS uid FROM posts WHERE created_at >= :since
            UNION
            SELECT user_id AS uid FROM likes WHERE created_at >= :since
            UNION
            SELECT sender_id AS uid FROM messages WHERE created_at >= :since
        ) sub
    """), {"since": week_ago}).scalar() or 0

    errors_today = db.query(func.count(ErrorLog.id)).filter(ErrorLog.timestamp >= today).scalar() or 0
    errors_4xx_today = db.query(func.count(ErrorLog.id)).filter(ErrorLog.timestamp >= today, ErrorLog.status_code >= 400, ErrorLog.status_code < 500).scalar() or 0
    errors_5xx_today = db.query(func.count(ErrorLog.id)).filter(ErrorLog.timestamp >= today, ErrorLog.status_code >= 500).scalar() or 0

    return {
        "users": {
            "total": _count(db, User),
            "new_today": _count(db, User, today),
            "new_this_week": _count(db, User, week_ago),
            "active_last_7d": active_users,
        },
        "posts": {
            "total": _count(db, Post),
            "new_today": _count(db, Post, today),
            "new_this_week": _count(db, Post, week_ago),
        },
        "comments": {
            "total": _count(db, Comment),
            "new_today": _count(db, Comment, today),
        },
        "likes": {
            "total": _count(db, Like),
        },
        "messages": {
            "total": _count(db, Message),
            "new_today": _count(db, Message, today),
        },
        "connections": {
            "total": db.query(func.count(Connection.id)).filter(Connection.status == "accepted").scalar() or 0,
        },
        "groups": {
            "total": _count(db, Group),
            "members_total": db.query(func.count(GroupMember.id)).scalar() or 0,
        },
        "jobs": {
            "total": _count(db, Job),
        },
        "errors": {
            "today_total": errors_today,
            "today_4xx": errors_4xx_today,
            "today_5xx": errors_5xx_today,
        },
    }


# ── Error log ──────────────────────────────────────────────────────────────

@router.get("/errors", summary="Recent error log")
def get_errors(
    status_code: Optional[int] = Query(None, description="Filter by status code"),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(ErrorLog).order_by(ErrorLog.timestamp.desc())
    if status_code:
        q = q.filter(ErrorLog.status_code == status_code)
    total = q.count()
    rows = q.offset(offset).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": str(r.id),
                "timestamp": r.timestamp.isoformat(),
                "method": r.method,
                "path": r.path,
                "status_code": r.status_code,
                "detail": r.detail,
                "user_id": r.user_id,
                "ip_address": r.ip_address,
                "query_params": r.query_params,
            }
            for r in rows
        ],
    }


@router.delete("/errors", summary="Clear all error logs")
def clear_errors(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    deleted = db.query(ErrorLog).delete()
    db.commit()
    return {"deleted": deleted}


# ── User list ──────────────────────────────────────────────────────────────

@router.get("/users", summary="List all users")
def list_users(
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total = db.query(func.count(User.id)).scalar() or 0
    users = db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "is_admin": u.is_admin,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
    }

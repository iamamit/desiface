from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

from app.core.database import get_db
from app.models.post import Post
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.user import UserPublic

router = APIRouter(prefix="/search", tags=["search"])


class PostSearchOut(BaseModel):
    id: uuid.UUID
    content: str
    image_url: str | None = None
    tag: str | None = None
    created_at: datetime
    author: UserPublic

    model_config = {"from_attributes": True}


@router.get("/users", response_model=list[UserPublic])
def search_users(
    q: str = Query(..., min_length=1),
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    term = f"%{q.lower()}%"
    return (
        db.query(User)
        .filter(
            User.id != current_user.id,
            User.is_active == True,  # noqa: E712
            (User.username.ilike(term) | User.full_name.ilike(term)),
        )
        .limit(limit)
        .all()
    )


@router.get("/posts", response_model=list[PostSearchOut])
def search_posts(
    q: str = Query(..., min_length=1),
    limit: int = 20,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    term = f"%{q}%"
    return (
        db.query(Post)
        .filter(Post.visibility == "public", Post.content.ilike(term))
        .order_by(Post.created_at.desc())
        .limit(limit)
        .all()
    )

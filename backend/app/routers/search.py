from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.user import UserPublic

router = APIRouter(prefix="/search", tags=["search"])


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

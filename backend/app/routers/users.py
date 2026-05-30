import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from sqlalchemy import or_

from app.models.connection import Connection
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.user import UserPublic, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/app/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ", 1)[1]
    user_id = decode_access_token(token)
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()


@router.get("/{username}", response_model=UserPublic)
def get_profile(
    username: str,
    db: Session = Depends(get_db),
    viewer: Optional[User] = Depends(get_optional_user),
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.profile_visibility == "friends_only":
        is_owner = viewer and viewer.id == user.id
        if not is_owner:
            is_connected = viewer and db.query(Connection).filter(
                Connection.status == "accepted",
                ((Connection.requester_id == viewer.id) & (Connection.addressee_id == user.id)) |
                ((Connection.requester_id == user.id) & (Connection.addressee_id == viewer.id))
            ).first()
            if not is_connected:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This profile is private")

    return user


@router.patch("/me", response_model=UserPublic)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserPublic)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, and WebP images are allowed")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"avatar_{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(contents)
    current_user.avatar_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user



@router.post("/me/cover", response_model=UserPublic)
async def upload_cover(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, and WebP images are allowed")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"cover_{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(contents)
    current_user.cover_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/suggestions", response_model=list[UserPublic])
def get_suggestions(
    limit: int = 8,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """People you may know: friends-of-friends not yet connected."""
    accepted = db.query(Connection).filter(
        Connection.status == "accepted",
        or_(Connection.requester_id == current_user.id, Connection.addressee_id == current_user.id),
    ).all()

    connected_ids: set[uuid.UUID] = set()
    for c in accepted:
        other = c.requester_id if c.addressee_id == current_user.id else c.addressee_id
        connected_ids.add(other)
    connected_ids.add(current_user.id)

    # pending requests (don't suggest users we already sent/received request from)
    pending = db.query(Connection).filter(
        or_(Connection.requester_id == current_user.id, Connection.addressee_id == current_user.id),
    ).all()
    for c in pending:
        other = c.requester_id if c.addressee_id == current_user.id else c.addressee_id
        connected_ids.add(other)

    # friends-of-friends
    friend_of_friend_ids: set[uuid.UUID] = set()
    fof_connections = db.query(Connection).filter(
        Connection.status == "accepted",
        or_(
            Connection.requester_id.in_(connected_ids - {current_user.id}),
            Connection.addressee_id.in_(connected_ids - {current_user.id}),
        ),
    ).all()
    for c in fof_connections:
        for uid in (c.requester_id, c.addressee_id):
            if uid not in connected_ids:
                friend_of_friend_ids.add(uid)

    if friend_of_friend_ids:
        users = (
            db.query(User)
            .filter(User.id.in_(friend_of_friend_ids), User.is_active == True)  # noqa: E712
            .limit(limit)
            .all()
        )
    else:
        # fallback: any active users not connected
        users = (
            db.query(User)
            .filter(User.id.notin_(connected_ids), User.is_active == True)  # noqa: E712
            .limit(limit)
            .all()
        )
    return users


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.delete(current_user)
    db.commit()

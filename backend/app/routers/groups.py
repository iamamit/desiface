import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.group import Group, GroupMember, GroupPost
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.user import UserPublic

router = APIRouter(prefix="/groups", tags=["groups"])

VALID_CATEGORIES = {
    "general", "tech", "career", "visa", "language",
    "cultural", "finance", "housing", "networking", "other",
}


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "general"
    is_private: bool = False


class GroupMemberOut(BaseModel):
    user: UserPublic
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class GroupOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    category: str
    is_private: bool
    cover_url: Optional[str] = None
    created_at: datetime
    owner: UserPublic
    member_count: int = 0
    is_member: bool = False

    model_config = {"from_attributes": True}


class GroupPostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None


class GroupPostOut(BaseModel):
    id: uuid.UUID
    content: str
    image_url: Optional[str] = None
    created_at: datetime
    author: UserPublic

    model_config = {"from_attributes": True}


def _serialize_group(group: Group, me: User) -> GroupOut:
    is_member = any(m.user_id == me.id for m in group.members)
    return GroupOut(
        id=group.id,
        name=group.name,
        description=group.description,
        category=group.category,
        is_private=group.is_private,
        cover_url=group.cover_url,
        created_at=group.created_at,
        owner=group.owner,
        member_count=len(group.members),
        is_member=is_member,
    )


@router.get("", response_model=list[GroupOut])
def list_groups(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    groups = db.query(Group).order_by(Group.created_at.desc()).offset(skip).limit(limit).all()
    return [_serialize_group(g, current_user) for g in groups]


@router.get("/mine", response_model=list[GroupOut])
def my_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = db.query(GroupMember).filter(GroupMember.user_id == current_user.id).all()
    group_ids = [m.group_id for m in memberships]
    groups = db.query(Group).filter(Group.id.in_(group_ids)).all()
    return [_serialize_group(g, current_user) for g in groups]


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(
    payload: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = Group(
        owner_id=current_user.id,
        name=payload.name.strip(),
        description=payload.description,
        category=payload.category if payload.category in VALID_CATEGORIES else "general",
        is_private=payload.is_private,
    )
    db.add(group)
    db.flush()
    # auto-join owner as admin
    db.add(GroupMember(group_id=group.id, user_id=current_user.id, role="admin"))
    db.commit()
    db.refresh(group)
    return _serialize_group(group, current_user)


@router.get("/{group_id}", response_model=GroupOut)
def get_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return _serialize_group(group, current_user)


@router.post("/{group_id}/join", response_model=dict)
def join_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    existing = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id).first()
    if existing:
        return {"joined": True}
    db.add(GroupMember(group_id=group_id, user_id=current_user.id, role="member"))
    db.commit()
    return {"joined": True}


@router.delete("/{group_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Not a member")
    if member.role == "admin":
        raise HTTPException(status_code=400, detail="Owner cannot leave. Delete the group instead.")
    db.delete(member)
    db.commit()


@router.get("/{group_id}/members", response_model=list[GroupMemberOut])
def list_members(
    group_id: uuid.UUID,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(GroupMember).filter(GroupMember.group_id == group_id).all()


@router.get("/{group_id}/posts", response_model=list[GroupPostOut])
def list_group_posts(
    group_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    is_member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id).first()
    if group.is_private and not is_member:
        raise HTTPException(status_code=403, detail="Join the group to see posts")
    return (
        db.query(GroupPost)
        .filter(GroupPost.group_id == group_id)
        .order_by(GroupPost.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/{group_id}/posts", response_model=GroupPostOut, status_code=status.HTTP_201_CREATED)
def create_group_post(
    group_id: uuid.UUID,
    payload: GroupPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Join the group to post")
    post = GroupPost(
        group_id=group_id,
        user_id=current_user.id,
        content=payload.content.strip(),
        image_url=payload.image_url,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter(Group.id == group_id, Group.owner_id == current_user.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()

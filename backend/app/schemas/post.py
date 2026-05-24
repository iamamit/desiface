import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserPublic


class PostCreate(BaseModel):
    content: str


class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: uuid.UUID
    content: str
    created_at: datetime
    author: UserPublic

    model_config = {"from_attributes": True}


class PostOut(BaseModel):
    id: uuid.UUID
    content: str
    created_at: datetime
    author: UserPublic
    like_count: int = 0
    comment_count: int = 0
    liked_by_me: bool = False

    model_config = {"from_attributes": True}

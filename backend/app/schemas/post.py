import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserPublic


class SharedPostOut(BaseModel):
    id: uuid.UUID
    content: str
    image_url: str | None = None
    author: UserPublic
    created_at: datetime

    model_config = {"from_attributes": True}


class PostCreate(BaseModel):
    content: str = ""
    image_url: str | None = None
    shared_post_id: str | None = None
    visibility: str = "public"


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
    image_url: str | None = None
    visibility: str = "public"
    shared_post: SharedPostOut | None = None
    created_at: datetime
    author: UserPublic
    like_count: int = 0
    comment_count: int = 0
    liked_by_me: bool = False

    model_config = {"from_attributes": True}

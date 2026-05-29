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
    tag: str | None = None


class PostEdit(BaseModel):
    content: str
    tag: str | None = None


class CommentCreate(BaseModel):
    content: str
    parent_id: uuid.UUID | None = None


class ReactionCreate(BaseModel):
    reaction_type: str = "like"


class CommentOut(BaseModel):
    id: uuid.UUID
    content: str
    created_at: datetime
    author: UserPublic
    parent_id: uuid.UUID | None = None
    replies: list["CommentOut"] = []

    model_config = {"from_attributes": True}


CommentOut.model_rebuild()


class ReactionSummary(BaseModel):
    type: str
    count: int


class PostOut(BaseModel):
    id: uuid.UUID
    content: str
    image_url: str | None = None
    visibility: str = "public"
    tag: str | None = None
    shared_post: SharedPostOut | None = None
    created_at: datetime
    author: UserPublic
    like_count: int = 0
    comment_count: int = 0
    liked_by_me: bool = False
    my_reaction: str | None = None
    reactions: list[ReactionSummary] = []
    saved_by_me: bool = False

    model_config = {"from_attributes": True}

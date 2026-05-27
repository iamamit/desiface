import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class UserUpdate(BaseModel):
    full_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    cover_url: str | None = None
    headline: str | None = None
    location: str | None = None
    work_experience: list[Any] | None = None
    education: list[Any] | None = None
    skills: list[str] | None = None
    profile_visibility: str | None = None


class UserPublic(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    full_name: str | None
    bio: str | None
    avatar_url: str | None
    cover_url: str | None = None
    headline: str | None = None
    location: str | None = None
    work_experience: list[Any] | None = None
    education: list[Any] | None = None
    skills: list[str] | None = None
    is_verified: bool
    profile_visibility: str = "public"
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

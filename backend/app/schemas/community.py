import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserPublic


class ServiceCreate(BaseModel):
    category: str
    title: str
    description: str
    is_paid: bool = False
    price_info: str | None = None
    mode: str = "remote"
    location: str | None = None


class ServiceOut(BaseModel):
    id: uuid.UUID
    category: str
    title: str
    description: str
    is_paid: bool
    price_info: str | None
    mode: str
    location: str | None
    is_active: bool
    created_at: datetime
    provider: UserPublic

    model_config = {"from_attributes": True}


class ProgramCreate(BaseModel):
    category: str
    title: str
    description: str
    event_date: datetime
    is_online: bool = True
    location: str | None = None
    capacity: int | None = None
    is_free: bool = True
    price_info: str | None = None


class ProgramOut(BaseModel):
    id: uuid.UUID
    category: str
    title: str
    description: str
    event_date: datetime
    is_online: bool
    location: str | None
    capacity: int | None
    is_free: bool
    price_info: str | None
    created_at: datetime
    organizer: UserPublic
    rsvp_count: int
    rsvped_by_me: bool

    model_config = {"from_attributes": True}

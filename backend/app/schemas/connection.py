import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserPublic


class ConnectionOut(BaseModel):
    id: uuid.UUID
    status: str
    created_at: datetime
    requester: UserPublic
    addressee: UserPublic

    model_config = {"from_attributes": True}


class ConnectionStatus(BaseModel):
    connected: bool
    pending_sent: bool
    pending_received: bool
    connection_id: uuid.UUID | None = None

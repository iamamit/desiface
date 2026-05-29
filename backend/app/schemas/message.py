import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import UserPublic


class MessageCreate(BaseModel):
    content: str = Field(..., max_length=2000)


class MessageOut(BaseModel):
    id: uuid.UUID
    content: str
    is_read: bool
    created_at: datetime
    sender: UserPublic
    receiver: UserPublic

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    user: UserPublic
    last_message: str
    last_message_at: datetime
    unread_count: int

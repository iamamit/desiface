import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserPublic


class NotificationOut(BaseModel):
    id: uuid.UUID
    type: str
    entity_id: uuid.UUID | None
    is_read: bool
    created_at: datetime
    actor: UserPublic

    model_config = {"from_attributes": True}

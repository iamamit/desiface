import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.message import Message
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.message import ConversationOut, MessageCreate, MessageOut
from app.schemas.user import UserPublic

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("", response_model=list[ConversationOut])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msgs = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id)
    ).order_by(Message.created_at.desc()).all()

    seen: dict[uuid.UUID, ConversationOut] = {}
    for m in msgs:
        other_id = m.receiver_id if m.sender_id == current_user.id else m.sender_id
        if other_id not in seen:
            other_user = m.receiver if m.sender_id == current_user.id else m.sender
            unread = db.query(Message).filter(
                Message.sender_id == other_id,
                Message.receiver_id == current_user.id,
                Message.is_read == False,  # noqa: E712
            ).count()
            seen[other_id] = ConversationOut(
                user=UserPublic.model_validate(other_user),
                last_message=m.content,
                last_message_at=m.created_at,
                unread_count=unread,
            )
    return list(seen.values())


@router.get("/{user_id}", response_model=list[MessageOut])
def get_conversation(user_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    other = db.query(User).filter(User.id == user_id).first()
    if not other:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.query(Message).filter(
        Message.sender_id == user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False,  # noqa: E712
    ).update({"is_read": True})
    db.commit()

    return db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id),
        )
    ).order_by(Message.created_at).all()


@router.post("/{user_id}", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    user_id: uuid.UUID,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    other = db.query(User).filter(User.id == user_id).first()
    if not other:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    msg = Message(sender_id=current_user.id, receiver_id=user_id, content=payload.content.strip())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

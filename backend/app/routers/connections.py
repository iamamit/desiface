import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.email import send_connection_accepted_email, send_connection_request_email
from app.models.connection import Connection
from app.models.notification import Notification
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.connection import ConnectionOut, ConnectionStatus

router = APIRouter(prefix="/connections", tags=["connections"])


@router.get("", response_model=list[ConnectionOut])
def list_connections(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Connection).filter(
        Connection.status == "accepted",
        or_(Connection.requester_id == current_user.id, Connection.addressee_id == current_user.id),
    ).all()


@router.get("/requests", response_model=list[ConnectionOut])
def list_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Connection).filter(
        Connection.addressee_id == current_user.id,
        Connection.status == "pending",
    ).all()


@router.get("/sent", response_model=list[ConnectionOut])
def list_sent_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Connection).filter(
        Connection.requester_id == current_user.id,
        Connection.status == "pending",
    ).all()


@router.get("/status/{user_id}", response_model=ConnectionStatus)
def connection_status(user_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.query(Connection).filter(
        or_(
            (Connection.requester_id == current_user.id) & (Connection.addressee_id == user_id),
            (Connection.requester_id == user_id) & (Connection.addressee_id == current_user.id),
        )
    ).first()

    if not conn:
        return ConnectionStatus(connected=False, pending_sent=False, pending_received=False)
    if conn.status == "accepted":
        return ConnectionStatus(connected=True, pending_sent=False, pending_received=False, connection_id=conn.id)
    if conn.status == "pending" and conn.requester_id == current_user.id:
        return ConnectionStatus(connected=False, pending_sent=True, pending_received=False, connection_id=conn.id)
    return ConnectionStatus(connected=False, pending_sent=False, pending_received=True, connection_id=conn.id)


@router.post("/{user_id}", response_model=ConnectionOut, status_code=status.HTTP_201_CREATED)
def send_request(user_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot connect with yourself")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = db.query(Connection).filter(
        or_(
            (Connection.requester_id == current_user.id) & (Connection.addressee_id == user_id),
            (Connection.requester_id == user_id) & (Connection.addressee_id == current_user.id),
        )
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Connection already exists")

    conn = Connection(requester_id=current_user.id, addressee_id=user_id, status="pending")
    db.add(conn)

    notif = Notification(user_id=user_id, actor_id=current_user.id, type="connection_request", entity_id=conn.id)
    db.add(notif)
    db.commit()
    db.refresh(conn)

    try:
        send_connection_request_email(
            to=target.email,
            requester_name=current_user.full_name or current_user.username,
            requester_username=current_user.username,
        )
    except Exception:
        pass

    return conn


@router.patch("/{connection_id}/accept", response_model=ConnectionOut)
def accept_request(connection_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.addressee_id == current_user.id,
        Connection.status == "pending",
    ).first()
    if not conn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    requester = db.query(User).filter(User.id == conn.requester_id).first()
    conn.status = "accepted"
    notif = Notification(user_id=conn.requester_id, actor_id=current_user.id, type="connection_accepted", entity_id=conn.id)
    db.add(notif)
    db.commit()
    db.refresh(conn)

    if requester:
        try:
            send_connection_accepted_email(
                to=requester.email,
                acceptor_name=current_user.full_name or current_user.username,
                acceptor_username=current_user.username,
            )
        except Exception:
            pass

    return conn


@router.patch("/{connection_id}/decline", response_model=ConnectionOut)
def decline_request(connection_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.addressee_id == current_user.id,
        Connection.status == "pending",
    ).first()
    if not conn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    conn.status = "declined"
    db.commit()
    db.refresh(conn)
    return conn


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_connection(connection_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.query(Connection).filter(
        Connection.id == connection_id,
        or_(Connection.requester_id == current_user.id, Connection.addressee_id == current_user.id),
    ).first()
    if not conn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    db.delete(conn)
    db.commit()

import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.feedback import Feedback
from app.models.user import User
from app.routers.auth import get_current_user

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/app/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackCreate(BaseModel):
    type: str = "feedback"
    message: str


class FeedbackOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    message: str
    screenshot_url: str | None
    is_resolved: bool
    created_at: str
    user_username: str
    user_full_name: str | None

    model_config = {"from_attributes": True}


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if payload.type not in ("feedback", "bug"):
        raise HTTPException(status_code=400, detail="Invalid type")
    fb = Feedback(
        user_id=current_user.id,
        type=payload.type,
        message=payload.message.strip(),
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {"id": str(fb.id)}


@router.post("/screenshot", response_model=dict)
async def upload_screenshot(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    allowed = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"fb_{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    with open(path, "wb") as f:
        f.write(contents)
    return {"url": f"/uploads/{filename}"}


@router.patch("/{feedback_id}/screenshot")
def attach_screenshot(
    feedback_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id, Feedback.user_id == current_user.id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    fb.screenshot_url = payload.get("url")
    db.commit()
    return {"ok": True}


@router.get("", response_model=dict)
def list_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    type: str | None = Query(None),
    is_resolved: bool | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    q = db.query(Feedback)
    if type:
        q = q.filter(Feedback.type == type)
    if is_resolved is not None:
        q = q.filter(Feedback.is_resolved == is_resolved)
    total = q.count()
    items = q.order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": str(fb.id),
                "user_id": str(fb.user_id),
                "type": fb.type,
                "message": fb.message,
                "screenshot_url": fb.screenshot_url,
                "is_resolved": fb.is_resolved,
                "created_at": fb.created_at.isoformat(),
                "user_username": fb.user.username,
                "user_full_name": fb.user.full_name,
            }
            for fb in items
        ],
    }


@router.patch("/{feedback_id}/resolve")
def resolve_feedback(
    feedback_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Not found")
    fb.is_resolved = not fb.is_resolved
    db.commit()
    return {"is_resolved": fb.is_resolved}

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.service import Service
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.community import ServiceCreate, ServiceOut

router = APIRouter(prefix="/services", tags=["services"])

SERVICE_CATEGORIES = {
    "visa", "legal", "finance", "tax", "career",
    "teaching", "language", "housing", "tech", "other",
}


@router.get("", response_model=list[ServiceOut])
def list_services(
    category: str | None = None,
    user_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Service).filter(Service.is_active == True)
    if category:
        q = q.filter(Service.category == category)
    if user_id:
        q = q.filter(Service.user_id == user_id)
    return q.order_by(Service.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(
    body: ServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.category not in SERVICE_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    svc = Service(
        id=uuid.uuid4(),
        user_id=current_user.id,
        **body.model_dump(),
    )
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    if svc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your service")
    db.delete(svc)
    db.commit()

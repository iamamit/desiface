import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.job import Job
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.user import UserPublic

router = APIRouter(prefix="/jobs", tags=["jobs"])

VALID_TYPES = {"full_time", "part_time", "contract", "internship", "freelance"}


class JobCreate(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    employment_type: str = "full_time"
    description: str
    requirements: Optional[str] = None
    is_remote: bool = False
    salary_range: Optional[str] = None
    apply_url: Optional[str] = None


class JobOut(BaseModel):
    id: uuid.UUID
    title: str
    company: str
    location: Optional[str] = None
    employment_type: str
    description: str
    requirements: Optional[str] = None
    is_remote: bool
    salary_range: Optional[str] = None
    apply_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    poster: UserPublic

    model_config = {"from_attributes": True}


@router.get("", response_model=list[JobOut])
def list_jobs(
    skip: int = 0,
    limit: int = 20,
    employment_type: Optional[str] = Query(None),
    is_remote: Optional[bool] = Query(None),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Job).filter(Job.is_active == True)  # noqa: E712
    if employment_type and employment_type in VALID_TYPES:
        q = q.filter(Job.employment_type == employment_type)
    if is_remote is not None:
        q = q.filter(Job.is_remote == is_remote)
    return q.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = Job(
        user_id=current_user.id,
        title=payload.title.strip(),
        company=payload.company.strip(),
        location=payload.location,
        employment_type=payload.employment_type if payload.employment_type in VALID_TYPES else "full_time",
        description=payload.description.strip(),
        requirements=payload.requirements,
        is_remote=payload.is_remote,
        salary_range=payload.salary_range,
        apply_url=payload.apply_url,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    db.delete(job)
    db.commit()

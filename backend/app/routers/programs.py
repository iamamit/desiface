import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.program import Program, ProgramRSVP
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.community import ProgramCreate, ProgramOut

router = APIRouter(prefix="/programs", tags=["programs"])

PROGRAM_CATEGORIES = {
    "workshop", "meetup", "study_group", "networking",
    "cultural", "language", "webinar", "other",
}


def _serialize(program: Program, me: User) -> ProgramOut:
    rsvp_count = len(program.rsvps)
    rsvped_by_me = any(r.user_id == me.id for r in program.rsvps)
    return ProgramOut(
        id=program.id,
        category=program.category,
        title=program.title,
        description=program.description,
        event_date=program.event_date,
        is_online=program.is_online,
        location=program.location,
        capacity=program.capacity,
        is_free=program.is_free,
        price_info=program.price_info,
        created_at=program.created_at,
        organizer=program.organizer,
        rsvp_count=rsvp_count,
        rsvped_by_me=rsvped_by_me,
    )


@router.get("", response_model=list[ProgramOut])
def list_programs(
    category: str | None = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Program)
    if category:
        q = q.filter(Program.category == category)
    programs = q.order_by(Program.event_date.asc()).offset(skip).limit(limit).all()
    return [_serialize(p, current_user) for p in programs]


@router.post("", response_model=ProgramOut, status_code=status.HTTP_201_CREATED)
def create_program(
    body: ProgramCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.category not in PROGRAM_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    prog = Program(
        id=uuid.uuid4(),
        user_id=current_user.id,
        **body.model_dump(),
    )
    db.add(prog)
    db.commit()
    db.refresh(prog)
    return _serialize(prog, current_user)


@router.post("/{program_id}/rsvp", status_code=status.HTTP_201_CREATED)
def rsvp_program(
    program_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prog = db.query(Program).filter(Program.id == program_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    if prog.capacity and len(prog.rsvps) >= prog.capacity:
        raise HTTPException(status_code=400, detail="Program is full")
    existing = db.query(ProgramRSVP).filter(
        ProgramRSVP.program_id == program_id,
        ProgramRSVP.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already RSVPed")
    rsvp = ProgramRSVP(id=uuid.uuid4(), program_id=program_id, user_id=current_user.id)
    db.add(rsvp)
    db.commit()
    return {"rsvped": True}


@router.delete("/{program_id}/rsvp", status_code=status.HTTP_204_NO_CONTENT)
def cancel_rsvp(
    program_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rsvp = db.query(ProgramRSVP).filter(
        ProgramRSVP.program_id == program_id,
        ProgramRSVP.user_id == current_user.id,
    ).first()
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")
    db.delete(rsvp)
    db.commit()


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program(
    program_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prog = db.query(Program).filter(Program.id == program_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    if prog.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your program")
    db.delete(prog)
    db.commit()

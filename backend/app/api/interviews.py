from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_hr_role
from app.models.models import Interview, Application, Candidate, Job, User, AuditLog
from app.schemas.schemas import InterviewCreate, InterviewUpdate, InterviewResponse

router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.post("", response_model=InterviewResponse)
def schedule_interview(
    item_in: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    app = db.query(Application).filter(Application.id == item_in.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found.")

    cand = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
    job = db.query(Job).filter(Job.id == app.job_id).first()

    interview = Interview(
        application_id=app.id,
        interviewer_name=item_in.interviewer_name,
        interview_date=item_in.interview_date,
        interview_time=item_in.interview_time,
        interview_type=item_in.interview_type,
        status="Scheduled",
        notes=item_in.notes
    )
    db.add(interview)

    # Automatically advance application status to interview stage if not already
    if "Interview" not in app.status:
        app.status = "Technical Interview" if item_in.interview_type == "Technical" else "HR Interview"

    audit = AuditLog(
        user_id=current_user.id,
        action="SCHEDULE_INTERVIEW",
        target_type="interview",
        target_id=app.id,
        details={
            "candidate": f"{cand.first_name} {cand.last_name}" if cand else "Unknown",
            "date": item_in.interview_date,
            "type": item_in.interview_type
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(interview)

    return InterviewResponse(
        id=interview.id,
        application_id=app.id,
        candidate_name=f"{cand.first_name} {cand.last_name}" if cand else "Applicant",
        job_title=job.title if job else "Position",
        interviewer_name=interview.interviewer_name,
        interview_date=interview.interview_date,
        interview_time=interview.interview_time,
        interview_type=interview.interview_type,
        status=interview.status,
        feedback=interview.feedback,
        notes=interview.notes,
        rating=interview.rating,
        created_at=interview.created_at
    )

@router.get("", response_model=List[InterviewResponse])
def list_interviews(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    query = db.query(Interview)
    if status_filter and status_filter != "All":
        query = query.filter(Interview.status == status_filter)

    interviews = query.order_by(Interview.created_at.desc()).all()
    results = []
    for iv in interviews:
        app = db.query(Application).filter(Application.id == iv.application_id).first()
        cand = db.query(Candidate).filter(Candidate.id == app.candidate_id).first() if app else None
        job = db.query(Job).filter(Job.id == app.job_id).first() if app else None

        results.append(InterviewResponse(
            id=iv.id,
            application_id=iv.application_id,
            candidate_name=f"{cand.first_name} {cand.last_name}" if cand else "Applicant",
            job_title=job.title if job else "Position",
            interviewer_name=iv.interviewer_name,
            interview_date=iv.interview_date,
            interview_time=iv.interview_time,
            interview_type=iv.interview_type,
            status=iv.status,
            feedback=iv.feedback,
            notes=iv.notes,
            rating=iv.rating,
            created_at=iv.created_at
        ))
    return results

@router.put("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: int,
    item_in: InterviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    iv = db.query(Interview).filter(Interview.id == interview_id).first()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found.")

    update_data = item_in.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(iv, k, v)

    # If completed and rating high, update application
    app = db.query(Application).filter(Application.id == iv.application_id).first()
    if iv.status == "Completed" and app:
        if iv.rating and iv.rating >= 4:
            app.status = "HR Interview" if iv.interview_type == "Technical" else "Selected"

    db.commit()
    db.refresh(iv)

    cand = db.query(Candidate).filter(Candidate.id == app.candidate_id).first() if app else None
    job = db.query(Job).filter(Job.id == app.job_id).first() if app else None

    return InterviewResponse(
        id=iv.id,
        application_id=iv.application_id,
        candidate_name=f"{cand.first_name} {cand.last_name}" if cand else "Applicant",
        job_title=job.title if job else "Position",
        interviewer_name=iv.interviewer_name,
        interview_date=iv.interview_date,
        interview_time=iv.interview_time,
        interview_type=iv.interview_type,
        status=iv.status,
        feedback=iv.feedback,
        notes=iv.notes,
        rating=iv.rating,
        created_at=iv.created_at
    )


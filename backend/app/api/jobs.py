from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_hr_role
from app.models.models import Job, JobRequirement, User, Application, AuditLog
from app.schemas.schemas import (
    JobCreate, JobUpdate, JobResponse,
    JobRequirementAnalysisRequest, JobRequirementAnalysisResponse
)
from app.services.nlp_engine import analyze_job_requirements

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/extract-requirements", response_model=JobRequirementAnalysisResponse)
def extract_requirements(
    req: JobRequirementAnalysisRequest,
    current_user: User = Depends(require_hr_role)
):
    """AI Job Requirement Analyzer: Extracts technical & soft skills, mandatory/preferred, experience, and education."""
    extracted = analyze_job_requirements(req.title, req.description)
    return extracted

@router.get("", response_model=List[JobResponse])
def list_jobs(
    search: Optional[str] = None,
    department: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    if search:
        query = query.filter(Job.title.ilike(f"%{search}%") | Job.description.ilike(f"%{search}%"))
    if department and department != "All":
        query = query.filter(Job.department == department)
    if status_filter and status_filter != "All":
        query = query.filter(Job.status == status_filter)
        
    jobs = query.order_by(Job.created_at.desc()).all()
    results = []
    for job in jobs:
        app_count = db.query(Application).filter(Application.job_id == job.id).count()
        job_dict = {
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "location": job.location,
            "employment_type": job.employment_type,
            "description": job.description,
            "mandatory_skills": job.mandatory_skills or [],
            "preferred_skills": job.preferred_skills or [],
            "required_experience": job.required_experience or 0.0,
            "educational_requirements": job.educational_requirements or "Bachelor's Degree",
            "vacancies": job.vacancies or 1,
            "deadline": job.deadline,
            "status": job.status,
            "scoring_weights": job.scoring_weights,
            "created_at": job.created_at,
            "application_count": app_count
        }
        results.append(job_dict)
    return results

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")
    app_count = db.query(Application).filter(Application.job_id == job.id).count()
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "location": job.location,
        "employment_type": job.employment_type,
        "description": job.description,
        "mandatory_skills": job.mandatory_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "required_experience": job.required_experience or 0.0,
        "educational_requirements": job.educational_requirements or "Bachelor's Degree",
        "vacancies": job.vacancies or 1,
        "deadline": job.deadline,
        "status": job.status,
        "scoring_weights": job.scoring_weights,
        "created_at": job.created_at,
        "application_count": app_count
    }

@router.post("", response_model=JobResponse)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    # Extract AI requirements if not explicitly provided
    if not job_in.mandatory_skills and not job_in.preferred_skills:
        ai_reqs = analyze_job_requirements(job_in.title, job_in.description)
        mandatory_skills = ai_reqs["mandatory_skills"]
        preferred_skills = ai_reqs["preferred_skills"]
        req_exp = ai_reqs["experience_years"] if job_in.required_experience == 0 else job_in.required_experience
        edu_req = ai_reqs["education_level"]
    else:
        mandatory_skills = job_in.mandatory_skills
        preferred_skills = job_in.preferred_skills
        req_exp = job_in.required_experience
        edu_req = job_in.educational_requirements

    scoring_weights = job_in.scoring_weights.dict() if job_in.scoring_weights else None

    job = Job(
        org_id=current_user.org_id,
        created_by_id=current_user.id,
        title=job_in.title,
        department=job_in.department,
        location=job_in.location,
        employment_type=job_in.employment_type,
        description=job_in.description,
        mandatory_skills=mandatory_skills,
        preferred_skills=preferred_skills,
        required_experience=req_exp,
        educational_requirements=edu_req,
        vacancies=job_in.vacancies,
        deadline=job_in.deadline,
        status="active",
        scoring_weights=scoring_weights
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Save detailed JobRequirement record
    job_req = JobRequirement(
        job_id=job.id,
        technical_skills=mandatory_skills + preferred_skills,
        soft_skills=[],
        mandatory_quals=mandatory_skills,
        preferred_quals=preferred_skills,
        experience_years=req_exp,
        education_level=edu_req,
        tools_technologies=mandatory_skills + preferred_skills
    )
    db.add(job_req)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE_JOB",
        target_type="job",
        target_id=job.id,
        details={"title": job.title, "department": job.department}
    )
    db.add(audit)
    db.commit()

    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "location": job.location,
        "employment_type": job.employment_type,
        "description": job.description,
        "mandatory_skills": job.mandatory_skills,
        "preferred_skills": job.preferred_skills,
        "required_experience": job.required_experience,
        "educational_requirements": job.educational_requirements,
        "vacancies": job.vacancies,
        "deadline": job.deadline,
        "status": job.status,
        "scoring_weights": job.scoring_weights,
        "created_at": job.created_at,
        "application_count": 0
    }

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    update_data = job_in.dict(exclude_unset=True)
    if "scoring_weights" in update_data and update_data["scoring_weights"] is not None:
        if hasattr(update_data["scoring_weights"], "dict"):
            update_data["scoring_weights"] = update_data["scoring_weights"].dict()

    for field, val in update_data.items():
        setattr(job, field, val)

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_JOB",
        target_type="job",
        target_id=job.id,
        details={"updated_fields": list(update_data.keys())}
    )
    db.add(audit)
    db.commit()
    db.refresh(job)

    app_count = db.query(Application).filter(Application.job_id == job.id).count()
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "location": job.location,
        "employment_type": job.employment_type,
        "description": job.description,
        "mandatory_skills": job.mandatory_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "required_experience": job.required_experience or 0.0,
        "educational_requirements": job.educational_requirements or "Bachelor's Degree",
        "vacancies": job.vacancies or 1,
        "deadline": job.deadline,
        "status": job.status,
        "scoring_weights": job.scoring_weights,
        "created_at": job.created_at,
        "application_count": app_count
    }

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")
    
    db.delete(job)
    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE_JOB",
        target_type="job",
        target_id=job_id,
        details={"title": job.title}
    )
    db.add(audit)
    db.commit()
    return {"message": "Job deleted successfully."}


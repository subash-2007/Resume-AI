from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_hr_role
from app.models.models import Candidate, CandidateSkill, Application, Job, Resume, AnalysisResult, User, AuditLog
from app.schemas.schemas import CandidateResponse, CandidateDetailResponse, ApplicationStatusUpdate

router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.get("")
def list_candidates(
    search: Optional[str] = None,
    job_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    query = db.query(Candidate)

    if search:
        query = query.filter(
            (Candidate.first_name.ilike(f"%{search}%")) |
            (Candidate.last_name.ilike(f"%{search}%")) |
            (Candidate.email.ilike(f"%{search}%")) |
            (Candidate.current_title.ilike(f"%{search}%"))
        )

    candidates = query.order_by(Candidate.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    total = query.count()

    results = []
    for c in candidates:
        # Fetch applications
        apps = db.query(Application).filter(Application.candidate_id == c.id).all()
        app_list = []
        latest_score = None
        for a in apps:
            job = db.query(Job).filter(Job.id == a.job_id).first()
            analysis = db.query(AnalysisResult).filter(AnalysisResult.application_id == a.id).order_by(AnalysisResult.analyzed_at.desc()).first()
            score = analysis.overall_score if analysis else None
            if score is not None and (latest_score is None or score > latest_score):
                latest_score = score
            app_list.append({
                "application_id": a.id,
                "job_id": a.job_id,
                "job_title": job.title if job else "General Application",
                "status": a.status,
                "match_score": score,
                "applied_at": a.applied_at
            })

        # Fetch skills
        skills = db.query(CandidateSkill).filter(CandidateSkill.candidate_id == c.id).all()
        skill_names = sorted(list(set(s.standardized_skill for s in skills)))

        results.append({
            "id": c.id,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "email": c.email,
            "phone": c.phone or "Not detected",
            "current_title": c.current_title or "Software Professional",
            "total_years_experience": c.total_years_experience or 0.0,
            "skills": skill_names,
            "applications": app_list,
            "latest_score": latest_score,
            "created_at": c.created_at
        })

    return {
        "items": results,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/{candidate_id}")
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    apps = db.query(Application).filter(Application.candidate_id == c.id).all()
    app_list = []
    latest_analysis = None
    for a in apps:
        job = db.query(Job).filter(Job.id == a.job_id).first()
        analysis = db.query(AnalysisResult).filter(AnalysisResult.application_id == a.id).order_by(AnalysisResult.analyzed_at.desc()).first()
        if analysis and not latest_analysis:
            latest_analysis = {
                "id": analysis.id,
                "overall_score": analysis.overall_score,
                "skill_score": analysis.skill_score,
                "semantic_score": analysis.semantic_score,
                "experience_score": analysis.experience_score,
                "education_score": analysis.education_score,
                "technology_score": analysis.technology_score,
                "domain_score": analysis.domain_score,
                "matched_skills": analysis.matched_skills,
                "missing_mandatory_skills": analysis.missing_mandatory_skills,
                "missing_preferred_skills": analysis.missing_preferred_skills,
                "explanation": analysis.explanation
            }
        app_list.append({
            "application_id": a.id,
            "job_id": a.job_id,
            "job_title": job.title if job else "General Application",
            "status": a.status,
            "applied_at": a.applied_at,
            "analysis": {
                "overall_score": analysis.overall_score if analysis else None,
                "matched_skills": analysis.matched_skills if analysis else [],
                "missing_mandatory_skills": analysis.missing_mandatory_skills if analysis else []
            } if analysis else None
        })

    skills = db.query(CandidateSkill).filter(CandidateSkill.candidate_id == c.id).all()
    skill_names = sorted(list(set(s.standardized_skill for s in skills)))

    return {
        "id": c.id,
        "first_name": c.first_name,
        "last_name": c.last_name,
        "email": c.email,
        "phone": c.phone or "Not detected",
        "current_title": c.current_title or "Software Professional",
        "total_years_experience": c.total_years_experience or 0.0,
        "skills": skill_names,
        "applications": app_list,
        "latest_analysis": latest_analysis,
        "created_at": c.created_at
    }

@router.put("/application/{application_id}/status")
def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found.")

    old_status = app.status
    app.status = status_update.status
    
    # Store in audit logs
    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_CANDIDATE_STATUS",
        target_type="application",
        target_id=application_id,
        details={"old_status": old_status, "new_status": status_update.status}
    )
    db.add(audit)
    db.commit()
    db.refresh(app)

    return {"message": "Status updated successfully", "new_status": app.status}


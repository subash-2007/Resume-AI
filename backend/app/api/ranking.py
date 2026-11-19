from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import require_hr_role
from app.models.models import Job, Application, Candidate, Resume, AnalysisResult, User
from app.schemas.schemas import CandidateRankingItem

router = APIRouter(prefix="/ranking", tags=["Ranking & Comparison"])

class CompareRequest(BaseModel):
    job_id: int
    candidate_ids: List[int]

@router.get("/job/{job_id}", response_model=List[CandidateRankingItem])
def get_job_rankings(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    applications = db.query(Application).filter(Application.job_id == job_id).all()
    rankings = []

    for app in applications:
        cand = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
        if not cand:
            continue

        analysis = db.query(AnalysisResult).filter(
            AnalysisResult.application_id == app.id
        ).order_by(AnalysisResult.analyzed_at.desc()).first()

        # If analysis not yet performed, use default 0 scores
        if not analysis:
            continue

        missing_mand = analysis.missing_mandatory_skills or []
        has_deficit = len(missing_mand) > 0

        rankings.append(CandidateRankingItem(
            candidate_id=cand.id,
            candidate_name=f"{cand.first_name} {cand.last_name}",
            email=cand.email,
            current_title=cand.current_title,
            total_years_experience=cand.total_years_experience or 0.0,
            application_id=app.id,
            resume_id=app.resume_id,
            status=app.status,
            overall_score=analysis.overall_score,
            skill_score=analysis.skill_score,
            semantic_score=analysis.semantic_score,
            experience_score=analysis.experience_score,
            education_score=analysis.education_score,
            technology_score=analysis.technology_score,
            domain_score=analysis.domain_score,
            matched_skills_count=len(analysis.matched_skills or []),
            missing_mandatory_count=len(missing_mand),
            has_mandatory_deficit=has_deficit,
            applied_at=app.applied_at
        ))

    # Sort candidates by overall score descending
    rankings.sort(key=lambda x: x.overall_score, reverse=True)
    return rankings

@router.post("/compare")
def compare_candidates(
    req: CompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    comparison_results = []
    
    for cand_id in req.candidate_ids:
        cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
        if not cand:
            continue

        app = db.query(Application).filter(
            Application.job_id == req.job_id,
            Application.candidate_id == cand_id
        ).first()

        analysis = None
        if app:
            analysis = db.query(AnalysisResult).filter(
                AnalysisResult.application_id == app.id
            ).order_by(AnalysisResult.analyzed_at.desc()).first()

        candidate_data = {
            "candidate_id": cand.id,
            "candidate_name": f"{cand.first_name} {cand.last_name}",
            "email": cand.email,
            "current_title": cand.current_title,
            "experience_years": cand.total_years_experience,
            "status": app.status if app else "Applied",
            "scores": {
                "overall": analysis.overall_score if analysis else 0.0,
                "skills": analysis.skill_score if analysis else 0.0,
                "semantic": analysis.semantic_score if analysis else 0.0,
                "experience": analysis.experience_score if analysis else 0.0,
                "education": analysis.education_score if analysis else 0.0,
                "technology": analysis.technology_score if analysis else 0.0,
                "domain": analysis.domain_score if analysis else 0.0,
            },
            "matched_skills": analysis.matched_skills if analysis else [],
            "missing_mandatory": analysis.missing_mandatory_skills if analysis else [],
            "missing_preferred": analysis.missing_preferred_skills if analysis else [],
            "has_mandatory_deficit": len(analysis.missing_mandatory_skills) > 0 if analysis and analysis.missing_mandatory_skills else False,
            "explanation": analysis.explanation if analysis else "No analysis available"
        }
        comparison_results.append(candidate_data)

    # Format dimensional metrics for Recharts
    dimensions = ["Overall Match", "Skills", "Semantic", "Experience", "Education", "Technology", "Domain"]
    chart_data = []
    for dim in dimensions:
        row = {"dimension": dim}
        for item in comparison_results:
            key = dim.lower().split()[0]
            if key == "overall": val = item["scores"]["overall"]
            elif key == "skills": val = item["scores"]["skills"]
            elif key == "semantic": val = item["scores"]["semantic"]
            elif key == "experience": val = item["scores"]["experience"]
            elif key == "education": val = item["scores"]["education"]
            elif key == "technology": val = item["scores"]["technology"]
            elif key == "domain": val = item["scores"]["domain"]
            else: val = 0.0
            row[item["candidate_name"]] = val
        chart_data.append(row)

    return {
        "job_title": job.title,
        "candidates": comparison_results,
        "radar_data": chart_data
    }


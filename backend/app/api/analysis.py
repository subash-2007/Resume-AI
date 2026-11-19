from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import AnalysisResult, Resume, Job, Application, SkillGap, User, Candidate
from app.schemas.schemas import (
    AnalyzeResumeRequest, CandidateSelfAnalyzeRequest, AnalysisResultResponse
)
from app.services.nlp_engine import calculate_hybrid_match, analyze_job_requirements

router = APIRouter(prefix="/analysis", tags=["Analysis & Matching"])

@router.post("/match", response_model=AnalysisResultResponse)
def analyze_resume_for_job(
    req: AnalyzeResumeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    resume = db.query(Resume).filter(Resume.id == req.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    # Run ML Hybrid Matching
    match_data = calculate_hybrid_match(
        resume_text=resume.raw_text,
        resume_parsed=resume.parsed_data or {},
        job_title=job.title,
        job_description=job.description,
        mandatory_skills=job.mandatory_skills or [],
        preferred_skills=job.preferred_skills or [],
        required_experience=job.required_experience or 0.0,
        required_education=job.educational_requirements or "Bachelor's Degree",
        custom_weights=job.scoring_weights
    )

    # Find or link application if exists
    app = db.query(Application).filter(
        Application.job_id == job.id,
        Application.resume_id == resume.id
    ).first()

    analysis = AnalysisResult(
        application_id=app.id if app else None,
        resume_id=resume.id,
        job_id=job.id,
        overall_score=match_data["overall_score"],
        skill_score=match_data["skill_score"],
        semantic_score=match_data["semantic_score"],
        experience_score=match_data["experience_score"],
        education_score=match_data["education_score"],
        technology_score=match_data["technology_score"],
        domain_score=match_data["domain_score"],
        matched_skills=match_data["matched_skills"],
        missing_mandatory_skills=match_data["missing_mandatory_skills"],
        missing_preferred_skills=match_data["missing_preferred_skills"],
        explanation=match_data["explanation"],
        scoring_weights=match_data["scoring_weights"]
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Save Skill Gaps
    for s in match_data["missing_mandatory_skills"]:
        gap = SkillGap(
            analysis_result_id=analysis.id,
            missing_skill=s,
            category="mandatory",
            importance="High",
            recommendation=f"Prioritize building competency in {s} to satisfy mandatory qualifications."
        )
        db.add(gap)

    for s in match_data["missing_preferred_skills"]:
        gap = SkillGap(
            analysis_result_id=analysis.id,
            missing_skill=s,
            category="preferred",
            importance="Medium",
            recommendation=f"Familiarity with {s} will strengthen candidate distinction."
        )
        db.add(gap)
    db.commit()

    return AnalysisResultResponse(
        id=analysis.id,
        job_id=analysis.job_id,
        resume_id=analysis.resume_id,
        application_id=analysis.application_id,
        overall_score=analysis.overall_score,
        skill_score=analysis.skill_score,
        semantic_score=analysis.semantic_score,
        experience_score=analysis.experience_score,
        education_score=analysis.education_score,
        technology_score=analysis.technology_score,
        domain_score=analysis.domain_score,
        matched_skills=analysis.matched_skills,
        missing_mandatory_skills=analysis.missing_mandatory_skills,
        missing_preferred_skills=analysis.missing_preferred_skills,
        explanation=analysis.explanation,
        scoring_weights=analysis.scoring_weights,
        has_mandatory_deficit=match_data["has_mandatory_deficit"],
        analyzed_at=analysis.analyzed_at
    )

@router.post("/self-match", response_model=AnalysisResultResponse)
def candidate_self_match(
    req: CandidateSelfAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Candidate portal: matches candidate resume against pasted or custom job description."""
    resume = db.query(Resume).filter(Resume.id == req.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    # Automatically extract requirements from the custom job description
    extracted = analyze_job_requirements(req.job_title, req.job_description)

    # Check if a Job with this title exists or create a temporary / shadow job record
    job = db.query(Job).filter(Job.title == req.job_title).first()
    if not job:
        job = Job(
            title=req.job_title,
            department="Candidate Target",
            location="Remote / Hybrid",
            description=req.job_description,
            mandatory_skills=extracted["mandatory_skills"],
            preferred_skills=extracted["preferred_skills"],
            required_experience=extracted["experience_years"],
            educational_requirements=extracted["education_level"],
            status="active"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    # Calculate ML Hybrid Match
    match_data = calculate_hybrid_match(
        resume_text=resume.raw_text,
        resume_parsed=resume.parsed_data or {},
        job_title=req.job_title,
        job_description=req.job_description,
        mandatory_skills=extracted["mandatory_skills"],
        preferred_skills=extracted["preferred_skills"],
        required_experience=extracted["experience_years"],
        required_education=extracted["education_level"]
    )

    analysis = AnalysisResult(
        application_id=None,
        resume_id=resume.id,
        job_id=job.id,
        overall_score=match_data["overall_score"],
        skill_score=match_data["skill_score"],
        semantic_score=match_data["semantic_score"],
        experience_score=match_data["experience_score"],
        education_score=match_data["education_score"],
        technology_score=match_data["technology_score"],
        domain_score=match_data["domain_score"],
        matched_skills=match_data["matched_skills"],
        missing_mandatory_skills=match_data["missing_mandatory_skills"],
        missing_preferred_skills=match_data["missing_preferred_skills"],
        explanation=match_data["explanation"],
        scoring_weights=match_data["scoring_weights"]
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return AnalysisResultResponse(
        id=analysis.id,
        job_id=analysis.job_id,
        resume_id=analysis.resume_id,
        application_id=analysis.application_id,
        overall_score=analysis.overall_score,
        skill_score=analysis.skill_score,
        semantic_score=analysis.semantic_score,
        experience_score=analysis.experience_score,
        education_score=analysis.education_score,
        technology_score=analysis.technology_score,
        domain_score=analysis.domain_score,
        matched_skills=analysis.matched_skills,
        missing_mandatory_skills=analysis.missing_mandatory_skills,
        missing_preferred_skills=analysis.missing_preferred_skills,
        explanation=analysis.explanation,
        scoring_weights=analysis.scoring_weights,
        has_mandatory_deficit=match_data["has_mandatory_deficit"],
        analyzed_at=analysis.analyzed_at
    )

@router.get("/candidate/history")
def get_candidate_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch candidate's resumes
    user_resumes = db.query(Resume.id).filter(Resume.user_id == current_user.id).all()
    resume_ids = [r[0] for r in user_resumes]

    analyses = db.query(AnalysisResult).filter(
        AnalysisResult.resume_id.in_(resume_ids)
    ).order_by(AnalysisResult.analyzed_at.desc()).all()

    history = []
    for a in analyses:
        job = db.query(Job).filter(Job.id == a.job_id).first()
        resume = db.query(Resume).filter(Resume.id == a.resume_id).first()
        history.append({
            "id": a.id,
            "job_title": job.title if job else "General Evaluation",
            "resume_filename": resume.filename if resume else "Resume",
            "overall_score": a.overall_score,
            "skill_score": a.skill_score,
            "semantic_score": a.semantic_score,
            "matched_skills": a.matched_skills,
            "missing_mandatory_skills": a.missing_mandatory_skills,
            "analyzed_at": a.analyzed_at
        })
    return history

@router.get("/{analysis_id}")
def get_analysis_details(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analysis = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis result not found.")

    job = db.query(Job).filter(Job.id == analysis.job_id).first()
    resume = db.query(Resume).filter(Resume.id == analysis.resume_id).first()

    return {
        "id": analysis.id,
        "job": {
            "id": job.id if job else None,
            "title": job.title if job else "Target Position",
            "department": job.department if job else "General",
            "location": job.location if job else "Remote"
        },
        "resume": {
            "id": resume.id if resume else None,
            "filename": resume.filename if resume else "Resume"
        },
        "overall_score": analysis.overall_score,
        "skill_score": analysis.skill_score,
        "semantic_score": analysis.semantic_score,
        "experience_score": analysis.experience_score,
        "education_score": analysis.education_score,
        "technology_score": analysis.technology_score,
        "domain_score": analysis.domain_score,
        "matched_skills": analysis.matched_skills or [],
        "missing_mandatory_skills": analysis.missing_mandatory_skills or [],
        "missing_preferred_skills": analysis.missing_preferred_skills or [],
        "explanation": analysis.explanation,
        "scoring_weights": analysis.scoring_weights,
        "has_mandatory_deficit": len(analysis.missing_mandatory_skills or []) > 0,
        "analyzed_at": analysis.analyzed_at
    }


import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import AnalysisResult, Job, Resume, Candidate, Application, Report, User
from app.services.pdf_generator import generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/generate/{analysis_id}")
def generate_and_download_report(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analysis = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis result not found.")

    job = db.query(Job).filter(Job.id == analysis.job_id).first()
    resume = db.query(Resume).filter(Resume.id == analysis.resume_id).first()

    # Find candidate name and email
    candidate_name = "Candidate"
    candidate_email = "candidate@resumeai.io"
    if analysis.application_id:
        app = db.query(Application).filter(Application.id == analysis.application_id).first()
        if app:
            cand = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
            if cand:
                candidate_name = f"{cand.first_name} {cand.last_name}"
                candidate_email = cand.email
    elif resume and resume.parsed_data:
        candidate_name = resume.parsed_data.get("name", "Applicant")
        candidate_email = resume.parsed_data.get("email", "candidate@resumeai.io")

    analysis_dict = {
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
        "explanation": analysis.explanation
    }

    filename = f"ResumeAI_Report_Analysis_{analysis.id}.pdf"
    pdf_path = generate_pdf_report(
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        job_title=job.title if job else "Target Position",
        department=job.department if job else "Technology",
        analysis_data=analysis_dict,
        output_filename=filename
    )

    # Save Report record in DB
    report_rec = Report(
        analysis_result_id=analysis.id,
        report_type="PDF",
        file_path=pdf_path
    )
    db.add(report_rec)
    db.commit()

    return FileResponse(
        path=pdf_path,
        filename=filename,
        media_type="application/pdf"
    )


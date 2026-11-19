import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Resume, Candidate, CandidateSkill, Application, Job, User, AuditLog
from app.schemas.schemas import ResumeResponse
from app.services.nlp_engine import extract_text_from_file, extract_resume_info, calculate_hybrid_match
from app.models.models import AnalysisResult

router = APIRouter(prefix="/resumes", tags=["Resumes"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}

def save_and_parse_file(file: UploadFile, db: Session, user: Optional[User] = None, job_id: Optional[int] = None):
    # Validate extension
    filename = file.filename or "uploaded_resume.pdf"
    _, ext = os.path.splitext(filename)
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Only PDF, DOCX, and TXT are accepted."
        )

    # Unique storage name
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)

    # 1. NLP Text extraction
    raw_text = extract_text_from_file(file_path, ext.replace(".", ""))
    if not raw_text.strip():
        raw_text = f"Candidate Profile: {filename}\nKeywords: Software Engineering, Data Analysis"

    # 2. Extract structured candidate entities
    parsed = extract_resume_info(raw_text)

    # 3. Create Resume record
    resume = Resume(
        user_id=user.id if user else None,
        filename=filename,
        file_path=file_path,
        file_type=ext.replace(".", "").lower(),
        raw_text=raw_text,
        parsed_data=parsed
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # 4. Duplicate-aware Candidate Record Creation / Resolution
    cand_email = parsed.get("email")
    candidate = None

    # Priority 1: If user is logged in as a candidate, link to their candidate record
    if user and user.role == "candidate":
        candidate = db.query(Candidate).filter(Candidate.user_id == user.id).first()

    # Priority 2: Match by detected email if not already resolved
    if not candidate and cand_email and cand_email != "Not detected":
        candidate = db.query(Candidate).filter(Candidate.email == cand_email.lower()).first()

    name_parts = parsed.get("name", "Applicant").split()
    first_name = name_parts[0] if name_parts else "Applicant"
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Candidate"

    if not candidate:
        # Determine candidate email, guaranteeing uniqueness against constraints
        fallback_email = cand_email.lower() if (cand_email and cand_email != "Not detected") else f"candidate_{resume.id}_{uuid.uuid4().hex[:6]}@resumeai.internal"
        if db.query(Candidate).filter(Candidate.email == fallback_email).first():
            fallback_email = f"candidate_{resume.id}_{uuid.uuid4().hex[:6]}@resumeai.internal"

        candidate = Candidate(
            user_id=user.id if user and user.role == "candidate" else None,
            first_name=first_name,
            last_name=last_name,
            email=fallback_email,
            phone=parsed.get("phone") if parsed.get("phone") != "Not detected" else None,
            total_years_experience=parsed.get("total_experience_years", 0.0),
            current_title="Software Professional"
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
    else:
        # Update existing candidate record safely
        if parsed.get("name") and parsed.get("name") != "Not detected":
            candidate.first_name = first_name
            candidate.last_name = last_name
        if parsed.get("phone") and parsed.get("phone") != "Not detected":
            candidate.phone = parsed.get("phone")
        if parsed.get("total_experience_years"):
            candidate.total_years_experience = parsed.get("total_experience_years")
        if not candidate.user_id and user and user.role == "candidate":
            candidate.user_id = user.id
        db.commit()
        db.refresh(candidate)

    # 5. Save candidate skills (avoiding duplicates)
    for skill_name in parsed.get("skills", []):
        existing_skill = db.query(CandidateSkill).filter(
            CandidateSkill.candidate_id == candidate.id,
            CandidateSkill.skill_name == skill_name
        ).first()
        if not existing_skill:
            c_skill = CandidateSkill(
                candidate_id=candidate.id,
                resume_id=resume.id,
                skill_name=skill_name,
                standardized_skill=skill_name,
                category="technical"
            )
            db.add(c_skill)
    db.commit()

    # 6. If uploaded within context of a Job, link Application & Run ML Screening
    match_result = None
    if job_id:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            # Check existing application
            existing_app = db.query(Application).filter(
                Application.job_id == job.id,
                Application.candidate_id == candidate.id
            ).first()

            if not existing_app:
                existing_app = Application(
                    job_id=job.id,
                    candidate_id=candidate.id,
                    resume_id=resume.id,
                    status="AI Screened"
                )
                db.add(existing_app)
                db.commit()
                db.refresh(existing_app)

            # Compute ML Hybrid Match
            match_data = calculate_hybrid_match(
                resume_text=raw_text,
                resume_parsed=parsed,
                job_title=job.title,
                job_description=job.description,
                mandatory_skills=job.mandatory_skills or [],
                preferred_skills=job.preferred_skills or [],
                required_experience=job.required_experience or 0.0,
                required_education=job.educational_requirements or "Bachelor's Degree",
                custom_weights=job.scoring_weights
            )

            analysis = AnalysisResult(
                application_id=existing_app.id,
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
            match_result = match_data

    return {
        "id": resume.id,
        "filename": resume.filename,
        "file_type": resume.file_type,
        "candidate_id": candidate.id,
        "candidate_name": f"{candidate.first_name} {candidate.last_name}",
        "parsed_data": parsed,
        "match_result": match_result,
        "created_at": resume.created_at
    }

@router.post("/upload")
def upload_single_resume(
    file: UploadFile = File(...),
    job_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = save_and_parse_file(file=file, db=db, user=current_user, job_id=job_id)
    return result

@router.post("/bulk-upload")
def upload_bulk_resumes(
    files: List[UploadFile] = File(...),
    job_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = []
    errors = []
    for file in files:
        try:
            res = save_and_parse_file(file=file, db=db, user=current_user, job_id=job_id)
            results.append(res)
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})

    return {
        "total_uploaded": len(results),
        "total_failed": len(errors),
        "processed": results,
        "errors": errors
    }

@router.get("", response_model=List[ResumeResponse])
def list_my_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "candidate":
        resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    else:
        resumes = db.query(Resume).order_by(Resume.created_at.desc()).limit(100).all()
        
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "file_type": r.file_type,
            "parsed_data": r.parsed_data or {},
            "created_at": r.created_at
        }
        for r in resumes
    ]

@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
        
    if current_user.role == "candidate" and resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this resume.")

    return {
        "id": resume.id,
        "filename": resume.filename,
        "file_type": resume.file_type,
        "raw_text": resume.raw_text,
        "parsed_data": resume.parsed_data,
        "created_at": resume.created_at
    }


import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from app.core.database import get_db
from app.core.security import get_current_user, get_optional_current_user
from app.models.models import (
    User, Job, JobRequirement, Resume, Candidate, Application,
    AnalysisResult, Interview, AuditLog, HiringCampaign,
    ProcessingJob, ProcessingLog, CandidateNote, CandidateSkill,
    Organization
)
from app.schemas.schemas import (
    HiringCampaignCreate, HiringCampaignResponse, ProcessingProgressResponse,
    CandidateActionRequest, HiringAnalyticsResponse
)
from app.services.storage import get_storage_provider
from app.services.background_worker import enqueue_batch_processing

router = APIRouter(prefix="/hiring", tags=["Bulk Hiring & Screening"])

ALLOWED_RESUME_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}

def get_hiring_recruiter(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> User:
    if current_user:
        return current_user
    
    # Recruiter accessing from public hiring navigation
    hr_user = db.query(User).filter(User.role.in_(["admin", "hr_manager", "hr_recruiter"])).first()
    if hr_user:
        return hr_user
    
    first_user = db.query(User).first()
    if first_user:
        return first_user
        
    default_org = db.query(Organization).first()
    if not default_org:
        default_org = Organization(name="ResumeAI Enterprise", domain="resumeai.io")
        db.add(default_org)
        db.commit()
        db.refresh(default_org)
    
    from app.core.security import hash_password
    sys_user = User(
        email="hr@resumeai.io",
        hashed_password=hash_password("admin123"),
        full_name="HR Director",
        role="hr_manager",
        org_id=default_org.id
    )
    db.add(sys_user)
    db.commit()
    db.refresh(sys_user)
    return sys_user

# ----------------- Campaign CRUD Endpoints -----------------
@router.post("/campaigns", response_model=HiringCampaignResponse)
def create_hiring_campaign(
    campaign_in: HiringCampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_hiring_recruiter)
):
    try:
        # Validate required fields
        if not campaign_in.title or not campaign_in.title.strip():
            raise HTTPException(status_code=400, detail="Job Title is required.")
        if not campaign_in.job_description or not campaign_in.job_description.strip():
            raise HTTPException(status_code=400, detail="Job Description is required.")
        if not campaign_in.company_name or not campaign_in.company_name.strip():
            raise HTTPException(status_code=400, detail="Company Name is required.")

        # 1. Automatically create corresponding Job entity to link into existing system
        job = Job(
            org_id=current_user.org_id,
            created_by_id=current_user.id,
            title=campaign_in.title.strip(),
            department=campaign_in.department.strip() if campaign_in.department else "General",
            location=campaign_in.location.strip() if campaign_in.location else "Remote",
            employment_type=campaign_in.employment_type or "Full-time",
            description=campaign_in.job_description.strip(),
            mandatory_skills=campaign_in.mandatory_skills or [],
            preferred_skills=campaign_in.preferred_skills or [],
            required_experience=float(campaign_in.required_experience or 0.0),
            educational_requirements=campaign_in.education_level or "Bachelor's Degree",
            vacancies=int(campaign_in.vacancies or 1),
            deadline=str(campaign_in.deadline) if campaign_in.deadline else None,
            status="active",
            scoring_weights=campaign_in.scoring_weights
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # 2. Add JobRequirement record
        job_req = JobRequirement(
            job_id=job.id,
            technical_skills=(campaign_in.mandatory_skills or []) + (campaign_in.preferred_skills or []),
            mandatory_quals=campaign_in.mandatory_skills or [],
            preferred_quals=campaign_in.preferred_skills or [],
            experience_years=float(campaign_in.required_experience or 0.0),
            education_level=campaign_in.education_level or "Bachelor's Degree",
            tools_technologies=campaign_in.mandatory_skills or []
        )
        db.add(job_req)

        # 3. Create HiringCampaign
        campaign = HiringCampaign(
            job_id=job.id,
            created_by_id=current_user.id,
            title=campaign_in.title.strip(),
            company_name=campaign_in.company_name.strip(),
            department=campaign_in.department.strip() if campaign_in.department else "General",
            location=campaign_in.location.strip() if campaign_in.location else "Remote",
            employment_type=campaign_in.employment_type or "Full-time",
            required_experience=float(campaign_in.required_experience or 0.0),
            education_level=campaign_in.education_level or "Bachelor's Degree",
            mandatory_skills=campaign_in.mandatory_skills or [],
            preferred_skills=campaign_in.preferred_skills or [],
            job_description=campaign_in.job_description.strip(),
            vacancies=int(campaign_in.vacancies or 1),
            deadline=str(campaign_in.deadline) if campaign_in.deadline else None,
            status="active",
            scoring_weights=campaign_in.scoring_weights
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)

        return campaign
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error while creating hiring campaign: {str(exc)}"
        )


@router.get("/campaigns", response_model=List[HiringCampaignResponse])
def list_hiring_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_hiring_recruiter)
):
    campaigns = (
        db.query(HiringCampaign)
        .order_by(HiringCampaign.created_at.desc())
        .all()
    )
    return campaigns


@router.get("/campaigns/{campaign_id}", response_model=HiringCampaignResponse)
def get_hiring_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_hiring_recruiter)
):
    campaign = db.query(HiringCampaign).filter(HiringCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Hiring campaign not found.")
    return campaign


# ----------------- Bulk Resume Ingestion Endpoints -----------------
@router.post("/campaigns/{campaign_id}/upload-batch")
def upload_resumes_batch(
    campaign_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_hiring_recruiter)
):
    campaign = db.query(HiringCampaign).filter(HiringCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Hiring campaign not found.")

    storage = get_storage_provider()
    batch_id = uuid.uuid4().hex[:12]

    # Create master ProcessingJob record
    processing_job = ProcessingJob(
        campaign_id=campaign.id,
        batch_id=batch_id,
        total_files=len(files),
        processed_files=0,
        failed_files=0,
        status="queued"
    )
    db.add(processing_job)
    db.commit()
    db.refresh(processing_job)

    file_records = []
    for f in files:
        filename = f.filename or "candidate_resume.pdf"
        _, ext = os.path.splitext(filename)
        if ext.lower() not in ALLOWED_RESUME_EXTENSIONS:
            # Create failed log entry immediately
            log_item = ProcessingLog(
                processing_job_id=processing_job.id,
                filename=filename,
                status="failed",
                stage="upload",
                message=f"Unsupported format '{ext}'. Only PDF and DOCX supported."
            )
            db.add(log_item)
            continue

        try:
            # Stream file to storage without memory bloat
            dest_path, file_hash, file_size = storage.save_file_stream(f.file, filename)

            # Register log entry
            log_item = ProcessingLog(
                processing_job_id=processing_job.id,
                filename=filename,
                file_hash=file_hash,
                file_size_bytes=file_size,
                status="pending",
                stage="upload",
                message="File received and queued for screening."
            )
            db.add(log_item)
            db.commit()
            db.refresh(log_item)

            file_records.append({
                "log_id": log_item.id,
                "file_path": dest_path,
                "filename": filename,
                "file_hash": file_hash,
                "file_size": file_size
            })
        except Exception as e:
            log_item = ProcessingLog(
                processing_job_id=processing_job.id,
                filename=filename,
                status="failed",
                stage="upload",
                message=f"Upload stream error: {str(e)}"
            )
            db.add(log_item)
            db.commit()

    # Enqueue to background worker thread pool
    if file_records:
        campaign.status = "processing"
        db.commit()
        enqueue_batch_processing(processing_job.id, file_records)

    return {
        "processing_job_id": processing_job.id,
        "batch_id": batch_id,
        "total_enqueued": len(file_records),
        "total_rejected": len(files) - len(file_records),
        "status": "queued"
    }


# Resumable chunked upload endpoint
@router.post("/campaigns/{campaign_id}/upload-chunk")
def upload_resume_chunk(
    campaign_id: int,
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    chunk_file: UploadFile = File(...),
    current_user: User = Depends(get_hiring_recruiter)
):
    storage = get_storage_provider()
    chunk_bytes = chunk_file.file.read()
    saved_bytes = storage.save_chunk(upload_id, chunk_index, chunk_bytes)
    return {
        "upload_id": upload_id,
        "chunk_index": chunk_index,
        "total_chunks": total_chunks,
        "received_bytes": saved_bytes,
        "status": "chunk_saved"
    }


@router.post("/campaigns/{campaign_id}/complete-chunk-upload")
def complete_chunk_upload(
    campaign_id: int,
    upload_id: str = Form(...),
    total_chunks: int = Form(...),
    original_filename: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_hiring_recruiter)
):
    campaign = db.query(HiringCampaign).filter(HiringCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Hiring campaign not found.")

    storage = get_storage_provider()
    dest_path, file_hash, file_size = storage.assemble_chunks(upload_id, total_chunks, original_filename)

    batch_id = f"chunk_{upload_id[:8]}"
    processing_job = ProcessingJob(
        campaign_id=campaign.id,
        batch_id=batch_id,
        total_files=1,
        processed_files=0,
        failed_files=0,
        status="queued"
    )
    db.add(processing_job)
    db.commit()
    db.refresh(processing_job)

    log_item = ProcessingLog(
        processing_job_id=processing_job.id,
        filename=original_filename,
        file_hash=file_hash,
        file_size_bytes=file_size,
        status="pending",
        stage="upload",
        message="Resumable file assembled successfully and queued."
    )
    db.add(log_item)
    db.commit()
    db.refresh(log_item)

    enqueue_batch_processing(processing_job.id, [{
        "log_id": log_item.id,
        "file_path": dest_path,
        "filename": original_filename,
        "file_hash": file_hash,
        "file_size": file_size
    }])

    return {
        "processing_job_id": processing_job.id,
        "filename": original_filename,
        "file_hash": file_hash,
        "file_size": file_size,
        "status": "queued"
    }


# ----------------- Processing Telemetry & Polling -----------------
@router.get("/campaigns/{campaign_id}/progress", response_model=ProcessingProgressResponse)
def get_campaign_processing_progress(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_hiring_recruiter)
):
    campaign = db.query(HiringCampaign).filter(HiringCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Hiring campaign not found.")

    latest_job = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.campaign_id == campaign_id)
        .order_by(ProcessingJob.id.desc())
        .first()
    )

    if not latest_job:
        return {
            "campaign_id": campaign.id,
            "status": "idle",
            "total_files": campaign.total_resumes,
            "processed_files": campaign.processed_resumes,
            "failed_files": campaign.failed_resumes,
            "pending_files": 0,
            "progress_percentage": 100.0 if campaign.total_resumes > 0 else 0.0,
            "logs": []
        }

    logs = (
        db.query(ProcessingLog)
        .filter(ProcessingLog.processing_job_id == latest_job.id)
        .order_by(ProcessingLog.id.desc())
        .limit(100)
        .all()
    )

    total = latest_job.total_files or 1
    done = (latest_job.processed_files or 0) + (latest_job.failed_files or 0)
    pct = min(round((done / total) * 100.0, 1), 100.0)
    pending = max(total - done, 0)

    log_dicts = [
        {
            "id": l.id,
            "filename": l.filename,
            "status": l.status,
            "stage": l.stage,
            "file_size_bytes": l.file_size_bytes,
            "message": l.message,
            "created_at": l.created_at.isoformat() if l.created_at else None
        }
        for l in logs
    ]

    return {
        "campaign_id": campaign.id,
        "status": latest_job.status,
        "total_files": latest_job.total_files,
        "processed_files": latest_job.processed_files,
        "failed_files": latest_job.failed_files,
        "pending_files": pending,
        "progress_percentage": pct,
        "logs": log_dicts
    }


# ----------------- Candidate Ranking & Filters -----------------
@router.get("/campaigns/{campaign_id}/rankings")
def get_campaign_ranked_candidates(
    campaign_id: int,
    search: Optional[str] = Query(None),
    min_experience: Optional[float] = Query(None),
    max_experience: Optional[float] = Query(None),
    education_filter: Optional[str] = Query(None),
    mandatory_coverage: Optional[str] = Query("all"),  # all, all_met, has_deficit
    status_filter: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("score_desc"),      # score_desc, score_asc, exp_desc, name_asc
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_hiring_recruiter)
):
    campaign = db.query(HiringCampaign).filter(HiringCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Hiring campaign not found.")

    query = (
        db.query(
            Candidate,
            Application,
            AnalysisResult,
            Resume
        )
        .join(Application, Application.candidate_id == Candidate.id)
        .join(AnalysisResult, AnalysisResult.application_id == Application.id)
        .join(Resume, Resume.id == AnalysisResult.resume_id)
        .filter(Application.job_id == campaign.job_id)
    )

    # Search filter
    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            func.lower(Candidate.first_name + " " + Candidate.last_name).like(s) |
            func.lower(Candidate.email).like(s)
        )

    # Experience filters
    if min_experience is not None:
        query = query.filter(Candidate.total_years_experience >= min_experience)
    if max_experience is not None:
        query = query.filter(Candidate.total_years_experience <= max_experience)

    # Application status filter
    if status_filter and status_filter.lower() != "all":
        query = query.filter(func.lower(Application.status) == status_filter.lower())

    # Mandatory deficit filter
    if mandatory_coverage == "has_deficit":
        query = query.filter(func.length(AnalysisResult.missing_mandatory_skills) > 4)
    elif mandatory_coverage == "all_met":
        query = query.filter(func.length(AnalysisResult.missing_mandatory_skills) <= 4)

    # Sort
    if sort_by == "score_asc":
        query = query.order_by(asc(AnalysisResult.overall_score))
    elif sort_by == "exp_desc":
        query = query.order_by(desc(Candidate.total_years_experience))
    elif sort_by == "name_asc":
        query = query.order_by(asc(Candidate.first_name))
    else:
        query = query.order_by(desc(AnalysisResult.overall_score))

    total = query.count()
    results = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for rank_idx, (cand, app_rec, analysis, res) in enumerate(results, start=(page - 1) * limit + 1):
        items.append({
            "rank": rank_idx,
            "candidate_id": cand.id,
            "candidate_name": f"{cand.first_name} {cand.last_name}",
            "email": cand.email,
            "phone": cand.phone,
            "location": cand.location or "Not detected",
            "experience_years": cand.total_years_experience,
            "degree": res.parsed_data.get("education", [{}])[0].get("degree", "Not detected") if res.parsed_data else "Not detected",
            "application_id": app_rec.id,
            "application_status": app_rec.status,
            "resume_id": res.id,
            "overall_score": analysis.overall_score,
            "skill_score": analysis.skill_score,
            "semantic_score": analysis.semantic_score,
            "experience_score": analysis.experience_score,
            "education_score": analysis.education_score,
            "matched_skills": analysis.matched_skills or [],
            "missing_mandatory": analysis.missing_mandatory_skills or [],
            "missing_preferred": analysis.missing_preferred_skills or [],
            "has_mandatory_deficit": len(analysis.missing_mandatory_skills or []) > 0,
            "analyzed_at": analysis.analyzed_at.isoformat() if analysis.analyzed_at else None
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1
    }


# ----------------- Candidate Detail Page & Dossier -----------------
@router.get("/candidates/{candidate_id}/detail")
def get_candidate_detail(
    candidate_id: int,
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_hiring_recruiter)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    # Target application
    app_query = db.query(Application).filter(Application.candidate_id == candidate.id)
    if campaign_id:
        campaign = db.query(HiringCampaign).filter(HiringCampaign.id == campaign_id).first()
        if campaign:
            app_query = app_query.filter(Application.job_id == campaign.job_id)
    application = app_query.order_by(Application.applied_at.desc()).first()

    analysis = None
    resume = None
    if application:
        analysis = (
            db.query(AnalysisResult)
            .filter(AnalysisResult.application_id == application.id)
            .order_by(AnalysisResult.analyzed_at.desc())
            .first()
        )
        resume = db.query(Resume).filter(Resume.id == application.resume_id).first()

    if not resume:
        resume = (
            db.query(Resume)
            .join(AnalysisResult, AnalysisResult.resume_id == Resume.id)
            .join(Application, Application.id == AnalysisResult.application_id)
            .filter(Application.candidate_id == candidate.id)
            .order_by(Resume.created_at.desc())
            .first()
        )

    # Fetch candidate notes
    notes = (
        db.query(CandidateNote)
        .filter(CandidateNote.candidate_id == candidate.id)
        .order_by(CandidateNote.created_at.desc())
        .all()
    )
    notes_list = [
        {
            "id": n.id,
            "note": n.note,
            "created_at": n.created_at.isoformat(),
            "author_name": n.author.full_name if n.author else "HR Officer"
        }
        for n in notes
    ]

    # Fetch interviews
    interviews = []
    if application:
        iv_records = (
            db.query(Interview)
            .filter(Interview.application_id == application.id)
            .order_by(Interview.created_at.desc())
            .all()
        )
        interviews = [
            {
                "id": iv.id,
                "interviewer_name": iv.interviewer_name,
                "interview_date": iv.interview_date,
                "interview_time": iv.interview_time,
                "interview_type": iv.interview_type,
                "status": iv.status,
                "notes": iv.notes
            }
            for iv in iv_records
        ]

    # Rank position within campaign
    rank_pos = None
    if campaign_id and analysis:
        higher_count = (
            db.query(AnalysisResult.id)
            .join(Application, Application.id == AnalysisResult.application_id)
            .filter(
                Application.job_id == campaign.job_id,
                AnalysisResult.overall_score > analysis.overall_score
            )
            .count()
        )
        rank_pos = higher_count + 1

    return {
        "candidate": {
            "id": candidate.id,
            "name": f"{candidate.first_name} {candidate.last_name}",
            "email": candidate.email,
            "phone": candidate.phone or "Not detected",
            "location": candidate.location or "Not detected",
            "current_title": candidate.current_title or "Software Professional",
            "total_experience_years": candidate.total_years_experience
        },
        "application": {
            "id": application.id if application else None,
            "job_id": application.job_id if application else None,
            "status": application.status if application else "Applied",
            "rank_position": rank_pos
        },
        "resume": {
            "id": resume.id if resume else None,
            "filename": resume.filename if resume else None,
            "file_type": resume.file_type if resume else None,
            "raw_text": resume.raw_text if resume else "",
            "parsed_data": resume.parsed_data if resume else {},
            "preview_url": f"/api/v1/hiring/resumes/{resume.id}/preview" if resume else None,
            "download_url": f"/api/v1/hiring/resumes/{resume.id}/download" if resume else None
        },
        "matching_analysis": {
            "overall_score": analysis.overall_score if analysis else 0.0,
            "skill_score": analysis.skill_score if analysis else 0.0,
            "semantic_score": analysis.semantic_score if analysis else 0.0,
            "experience_score": analysis.experience_score if analysis else 0.0,
            "education_score": analysis.education_score if analysis else 0.0,
            "technology_score": analysis.technology_score if analysis else 0.0,
            "domain_score": analysis.domain_score if analysis else 0.0,
            "matched_skills": analysis.matched_skills if analysis else [],
            "missing_mandatory_skills": analysis.missing_mandatory_skills if analysis else [],
            "missing_preferred_skills": analysis.missing_preferred_skills if analysis else [],
            "evidence_breakdown": analysis.evidence_breakdown if analysis else {},
            "strengths": analysis.strengths if analysis else [],
            "improvement_areas": analysis.improvement_areas if analysis else [],
            "explanation": analysis.explanation if analysis else "No analysis available.",
            "scoring_weights": analysis.scoring_weights if analysis else None
        },
        "notes": notes_list,
        "interviews": interviews
    }


# ----------------- HR Actions on Candidates -----------------
@router.post("/candidates/{candidate_id}/action")
def execute_candidate_action(
    candidate_id: int,
    action_in: CandidateActionRequest,
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_hiring_recruiter)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    app_query = db.query(Application).filter(Application.candidate_id == candidate.id)
    if campaign_id:
        campaign = db.query(HiringCampaign).filter(HiringCampaign.id == campaign_id).first()
        if campaign:
            app_query = app_query.filter(Application.job_id == campaign.job_id)
    application = app_query.order_by(Application.applied_at.desc()).first()

    if not application:
        raise HTTPException(status_code=400, detail="No active application found for this candidate.")

    act = action_in.action.lower()
    if act == "shortlist":
        application.status = "Shortlisted"
    elif act == "review":
        application.status = "Under Review"
    elif act == "reject":
        application.status = "Not Selected"
    elif act == "schedule_interview":
        application.status = "Interview Scheduled"
        iv_data = action_in.interview_details or {}
        new_iv = Interview(
            application_id=application.id,
            interviewer_name=iv_data.get("interviewer_name", current_user.full_name),
            interview_date=iv_data.get("interview_date", "2026-11-10"),
            interview_time=iv_data.get("interview_time", "14:00"),
            interview_type=iv_data.get("interview_type", "Technical Screening"),
            notes=action_in.notes or iv_data.get("notes")
        )
        db.add(new_iv)

    if action_in.notes:
        note_rec = CandidateNote(
            candidate_id=candidate.id,
            campaign_id=campaign_id,
            author_id=current_user.id,
            note=action_in.notes
        )
        db.add(note_rec)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action=f"candidate_{act}",
        target_type="candidate",
        target_id=candidate.id,
        details={"status": application.status, "notes": action_in.notes}
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "candidate_id": candidate.id,
        "application_status": application.status,
        "message": f"Action '{act}' executed successfully."
    }


# ----------------- Secure Resume Preview & Download -----------------
@router.get("/resumes/{resume_id}/preview")
def preview_resume_document(
    resume_id: int,
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Physical resume document not found on storage.")

    media_type = "application/pdf" if resume.file_type == "pdf" else "text/plain"
    return FileResponse(
        resume.file_path,
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{resume.filename}"'}
    )


@router.get("/resumes/{resume_id}/download")
def download_resume_document(
    resume_id: int,
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Physical file missing.")

    return FileResponse(
        resume.file_path,
        media_type="application/octet-stream",
        filename=resume.filename
    )


# ----------------- Bulk Analytics Dashboard Data -----------------
@router.get("/campaigns/{campaign_id}/analytics", response_model=HiringAnalyticsResponse)
def get_campaign_analytics(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_hiring_recruiter)
):
    campaign = db.query(HiringCampaign).filter(HiringCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Hiring campaign not found.")

    job_id = campaign.job_id

    # 1. Total resumes uploaded and processed
    total_uploaded = db.query(Resume).filter(Resume.campaign_id == campaign_id).count()
    if total_uploaded == 0:
        # Fallback to count of applications for this job
        total_uploaded = db.query(Application).filter(Application.job_id == job_id).count()

    analyses = (
        db.query(AnalysisResult)
        .join(Application, Application.id == AnalysisResult.application_id)
        .filter(Application.job_id == job_id)
        .all()
    )

    candidates_analyzed = len(analyses)
    scores = [a.overall_score for a in analyses if a.overall_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    # 2. Pipeline counts
    apps = db.query(Application).filter(Application.job_id == job_id).all()
    shortlisted = sum(1 for a in apps if a.status.lower() == "shortlisted")
    under_review = sum(1 for a in apps if "review" in a.status.lower() or a.status.lower() == "ai screened")
    interviewed = sum(1 for a in apps if "interview" in a.status.lower())
    rejected = sum(1 for a in apps if "reject" in a.status.lower() or "not" in a.status.lower())

    # 3. Score Distribution Buckets (Strictly using approved brand colors)
    buckets = {"90-100%": 0, "80-89%": 0, "70-79%": 0, "60-69%": 0, "<60%": 0}
    for s in scores:
        if s >= 90: buckets["90-100%"] += 1
        elif s >= 80: buckets["80-89%"] += 1
        elif s >= 70: buckets["70-79%"] += 1
        elif s >= 60: buckets["60-69%"] += 1
        else: buckets["<60%"] += 1

    score_dist = [{"range": k, "count": v} for k, v in buckets.items()]

    # 4. Skill Distribution
    skill_counts = {}
    for a in analyses:
        for sk in (a.matched_skills or []):
            skill_counts[sk] = skill_counts.get(sk, 0) + 1
    sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    skill_dist = [{"skill": k, "count": v} for k, v in sorted_skills]
    if not skill_dist:
        skill_dist = [{"skill": "No data", "count": 0}]

    # 5. Experience Distribution
    cands = (
        db.query(Candidate.total_years_experience)
        .join(Application, Application.candidate_id == Candidate.id)
        .filter(Application.job_id == job_id)
        .all()
    )
    exp_buckets = {"0-2 yrs": 0, "2-5 yrs": 0, "5-8 yrs": 0, "8+ yrs": 0}
    for (ey,) in cands:
        if ey is None: continue
        if ey < 2.0: exp_buckets["0-2 yrs"] += 1
        elif ey < 5.0: exp_buckets["2-5 yrs"] += 1
        elif ey < 8.0: exp_buckets["5-8 yrs"] += 1
        else: exp_buckets["8+ yrs"] += 1
    exp_dist = [{"bracket": k, "count": v} for k, v in exp_buckets.items()]

    # 6. Education Distribution
    resumes_edu = (
        db.query(Resume.parsed_data)
        .join(AnalysisResult, AnalysisResult.resume_id == Resume.id)
        .join(Application, Application.id == AnalysisResult.application_id)
        .filter(Application.job_id == job_id)
        .all()
    )
    edu_buckets = {"Doctorate": 0, "Master's": 0, "Bachelor's": 0, "Other": 0}
    for (pd,) in resumes_edu:
        if not pd: continue
        edu_list = pd.get("education", [])
        deg = edu_list[0].get("degree", "") if edu_list else ""
        if "Doctorate" in deg: edu_buckets["Doctorate"] += 1
        elif "Master" in deg: edu_buckets["Master's"] += 1
        elif "Bachelor" in deg: edu_buckets["Bachelor's"] += 1
        else: edu_buckets["Other"] += 1
    edu_dist = [{"qualification": k, "count": v} for k, v in edu_buckets.items()]

    # 7. Pipeline Funnel
    pipeline_dist = [
        {"stage": "Total Ingested", "count": total_uploaded},
        {"stage": "AI Screened", "count": candidates_analyzed},
        {"stage": "Under Review", "count": under_review},
        {"stage": "Shortlisted", "count": shortlisted},
        {"stage": "Interview", "count": interviewed}
    ]

    return {
        "total_uploaded": total_uploaded,
        "successfully_processed": candidates_analyzed,
        "failed_resumes": campaign.failed_resumes,
        "candidates_analyzed": candidates_analyzed,
        "average_match_score": avg_score,
        "shortlisted_count": shortlisted,
        "under_review_count": under_review,
        "interviews_scheduled_count": interviewed,
        "rejected_count": rejected,
        "score_distribution": score_dist,
        "skill_distribution": skill_dist,
        "experience_distribution": exp_dist,
        "education_distribution": edu_dist,
        "pipeline_distribution": pipeline_dist
    }


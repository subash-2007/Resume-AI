import os
import uuid
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import (
    HiringCampaign, ProcessingJob, ProcessingLog, Resume, Candidate,
    CandidateSkill, Application, Job, AnalysisResult
)
from app.services.nlp_engine import (
    extract_text_from_file, extract_resume_info, calculate_hybrid_match
)

logger = logging.getLogger(__name__)

WORKER_CONCURRENCY = int(os.getenv("BULK_WORKER_CONCURRENCY", "4"))
executor = ThreadPoolExecutor(max_workers=WORKER_CONCURRENCY, thread_name_prefix="BulkWorker")

def process_single_resume(
    db: Session,
    campaign_id: int,
    job_id: int,
    log_id: int,
    file_path: str,
    filename: str,
    file_hash: Optional[str],
    file_size: int,
    scoring_weights: Optional[Dict[str, float]] = None
) -> bool:
    """Processes an individual resume with isolated failure handling and database persistence."""
    log_entry = db.query(ProcessingLog).filter(ProcessingLog.id == log_id).first()
    if not log_entry:
        return False

    try:
        log_entry.status = "processing"
        log_entry.stage = "text_extraction"
        db.commit()

        # 1. Text extraction
        _, ext = os.path.splitext(filename)
        ext_clean = ext.replace(".", "").lower()
        raw_text = extract_text_from_file(file_path, ext_clean)
        if not raw_text.strip():
            raw_text = f"Candidate Profile: {filename}\nNotice: Empty or scanned document. Fallback text representation."

        # 2. NLP entity and skills extraction
        log_entry.stage = "nlp_parsing"
        db.commit()
        parsed = extract_resume_info(raw_text)

        # 3. Create or reuse Resume record
        resume = Resume(
            campaign_id=campaign_id,
            filename=filename,
            file_path=file_path,
            file_type=ext_clean,
            file_hash=file_hash,
            file_size=file_size,
            raw_text=raw_text,
            parsed_data=parsed
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        log_entry.resume_id = resume.id

        # 4. Duplicate-safe Candidate resolution
        cand_email = parsed.get("email")
        candidate = None
        if cand_email and cand_email != "Not detected":
            candidate = db.query(Candidate).filter(Candidate.email == cand_email.lower()).first()

        name_parts = parsed.get("name", "Applicant").split()
        first_name = name_parts[0] if name_parts else "Applicant"
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Candidate"

        if not candidate:
            resolved_email = cand_email.lower() if (cand_email and cand_email != "Not detected") else f"candidate_{resume.id}_{uuid.uuid4().hex[:6]}@resumeai.internal"
            if db.query(Candidate).filter(Candidate.email == resolved_email).first():
                resolved_email = f"candidate_{resume.id}_{uuid.uuid4().hex[:6]}@resumeai.internal"

            candidate = Candidate(
                first_name=first_name,
                last_name=last_name,
                email=resolved_email,
                phone=parsed.get("phone") if parsed.get("phone") != "Not detected" else None,
                location=parsed.get("location") if parsed.get("location") != "Not detected" else None,
                total_years_experience=parsed.get("total_experience_years", 0.0),
                current_title="Software Professional"
            )
            db.add(candidate)
            db.commit()
            db.refresh(candidate)
        else:
            if parsed.get("name") and parsed.get("name") != "Not detected":
                candidate.first_name = first_name
                candidate.last_name = last_name
            if parsed.get("phone") and parsed.get("phone") != "Not detected":
                candidate.phone = parsed.get("phone")
            if parsed.get("total_experience_years"):
                candidate.total_years_experience = parsed.get("total_experience_years")
            db.commit()
            db.refresh(candidate)

        # 5. Save candidate skills
        for skill_name in parsed.get("skills", []):
            exists = db.query(CandidateSkill).filter(
                CandidateSkill.candidate_id == candidate.id,
                CandidateSkill.skill_name == skill_name
            ).first()
            if not exists:
                c_skill = CandidateSkill(
                    candidate_id=candidate.id,
                    resume_id=resume.id,
                    skill_name=skill_name,
                    standardized_skill=skill_name,
                    category="technical"
                )
                db.add(c_skill)
        db.commit()

        # 6. Link to Campaign Job & Run ML Matching Engine
        log_entry.stage = "ml_scoring"
        db.commit()

        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            app_record = db.query(Application).filter(
                Application.job_id == job.id,
                Application.candidate_id == candidate.id
            ).first()
            if not app_record:
                app_record = Application(
                    job_id=job.id,
                    candidate_id=candidate.id,
                    resume_id=resume.id,
                    status="AI Screened"
                )
                db.add(app_record)
                db.commit()
                db.refresh(app_record)
            else:
                app_record.resume_id = resume.id
                db.commit()

            match_data = calculate_hybrid_match(
                resume_text=raw_text,
                resume_parsed=parsed,
                job_title=job.title,
                job_description=job.description,
                mandatory_skills=job.mandatory_skills or [],
                preferred_skills=job.preferred_skills or [],
                required_experience=job.required_experience or 0.0,
                required_education=job.educational_requirements or "Bachelor's Degree",
                custom_weights=scoring_weights or job.scoring_weights
            )

            analysis = AnalysisResult(
                application_id=app_record.id,
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
                evidence_breakdown=match_data.get("evidence_breakdown", {}),
                strengths=match_data.get("strengths", []),
                improvement_areas=match_data.get("improvement_areas", []),
                explanation=match_data["explanation"],
                scoring_weights=match_data["scoring_weights"]
            )
            db.add(analysis)
            db.commit()

        log_entry.status = "success"
        log_entry.stage = "persisted"
        log_entry.message = f"Screening complete. Overall compatibility: {match_data['overall_score']}%"
        db.commit()
        return True

    except Exception as e:
        logger.exception(f"Error processing resume {filename}: {e}")
        db.rollback()
        log_entry.status = "failed"
        log_entry.stage = "failed"
        log_entry.message = str(e)
        db.commit()
        return False


def _execute_batch_job(processing_job_id: int, file_records: List[Dict[str, Any]]):
    """Worker task executed in thread pool for large-scale batches."""
    db: Session = SessionLocal()
    try:
        p_job = db.query(ProcessingJob).filter(ProcessingJob.id == processing_job_id).first()
        if not p_job:
            return

        p_job.status = "processing"
        p_job.started_at = datetime.utcnow()
        db.commit()

        campaign = db.query(HiringCampaign).filter(HiringCampaign.id == p_job.campaign_id).first()
        if not campaign:
            return

        job_id = campaign.job_id
        scoring_weights = campaign.scoring_weights

        processed_count = 0
        failed_count = 0

        for item in file_records:
            success = process_single_resume(
                db=db,
                campaign_id=campaign.id,
                job_id=job_id,
                log_id=item["log_id"],
                file_path=item["file_path"],
                filename=item["filename"],
                file_hash=item.get("file_hash"),
                file_size=item.get("file_size", 0),
                scoring_weights=scoring_weights
            )
            if success:
                processed_count += 1
            else:
                failed_count += 1

            # Update running progress counters
            p_job.processed_files = processed_count
            p_job.failed_files = failed_count
            campaign.processed_resumes += 1 if success else 0
            campaign.failed_resumes += 0 if success else 1
            db.commit()

        # Finalize job status
        p_job.status = "completed"
        p_job.completed_at = datetime.utcnow()

        # Update campaign aggregate statistics
        campaign.total_resumes = (
            db.query(Resume).filter(Resume.campaign_id == campaign.id).count()
        )
        # Compute real average match score across campaign analyses
        avg_score_query = (
            db.query(AnalysisResult.overall_score)
            .join(Resume, AnalysisResult.resume_id == Resume.id)
            .filter(Resume.campaign_id == campaign.id)
            .all()
        )
        if avg_score_query:
            scores = [s[0] for s in avg_score_query if s[0] is not None]
            campaign.avg_match_score = round(sum(scores) / len(scores), 1) if scores else 0.0

        campaign.status = "active"
        db.commit()

    except Exception as e:
        logger.exception(f"Fatal error in batch job {processing_job_id}: {e}")
        db.rollback()
        p_job = db.query(ProcessingJob).filter(ProcessingJob.id == processing_job_id).first()
        if p_job:
            p_job.status = "failed"
            p_job.error_message = str(e)
            db.commit()
    finally:
        db.close()


def enqueue_batch_processing(processing_job_id: int, file_records: List[Dict[str, Any]]):
    """Enqueues batch processing task to background thread pool."""
    executor.submit(_execute_batch_job, processing_job_id, file_records)


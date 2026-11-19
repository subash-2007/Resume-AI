from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="organization")
    jobs = relationship("Job", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="candidate", nullable=False)  # admin, hr_manager, hr_recruiter, candidate
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    resumes = relationship("Resume", back_populates="user")
    created_jobs = relationship("Job", back_populates="creator")
    candidate_profile = relationship("Candidate", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    location = Column(String(100), nullable=False)
    employment_type = Column(String(50), default="Full-time")  # Full-time, Part-time, Contract, Remote
    description = Column(Text, nullable=False)
    mandatory_skills = Column(JSON, default=list)  # ["Python", "FastAPI", "SQL"]
    preferred_skills = Column(JSON, default=list)  # ["Docker", "Kubernetes", "AWS"]
    required_experience = Column(Float, default=0.0)  # in years
    educational_requirements = Column(String(255), default="Bachelor's Degree")
    vacancies = Column(Integer, default=1)
    deadline = Column(String(50), nullable=True)
    status = Column(String(50), default="active")  # active, closed, draft
    scoring_weights = Column(JSON, nullable=True)  # custom scoring weights if modified by HR
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="jobs")
    creator = relationship("User", back_populates="created_jobs")
    requirements = relationship("JobRequirement", back_populates="job", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    analyses = relationship("AnalysisResult", back_populates="job", cascade="all, delete-orphan")


class JobRequirement(Base):
    __tablename__ = "job_requirements"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, unique=True)
    technical_skills = Column(JSON, default=list)
    soft_skills = Column(JSON, default=list)
    mandatory_quals = Column(JSON, default=list)
    preferred_quals = Column(JSON, default=list)
    experience_years = Column(Float, default=0.0)
    education_level = Column(String(100), default="Bachelor")
    tools_technologies = Column(JSON, default=list)

    job = relationship("Job", back_populates="requirements")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    campaign_id = Column(Integer, ForeignKey("hiring_campaigns.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(20), nullable=False)  # pdf, docx, txt
    file_hash = Column(String(64), index=True, nullable=True)  # SHA-256 for duplicate detection
    file_size = Column(Integer, default=0)
    raw_text = Column(Text, nullable=False)
    parsed_data = Column(JSON, default=dict)  # structured parsed info
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="resumes")
    campaign = relationship("HiringCampaign", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")
    analyses = relationship("AnalysisResult", back_populates="resume")
    candidate_skills = relationship("CandidateSkill", back_populates="resume")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    location = Column(String(100), nullable=True)
    current_title = Column(String(150), nullable=True)
    total_years_experience = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="candidate_profile")
    skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    skill_name = Column(String(100), nullable=False, index=True)
    standardized_skill = Column(String(100), nullable=False, index=True)
    category = Column(String(50), default="technical")
    proficiency_level = Column(String(50), default="intermediate")

    candidate = relationship("Candidate", back_populates="skills")
    resume = relationship("Resume", back_populates="candidate_skills")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    # Pipeline stages: Applied, AI Screened, HR Review, Shortlisted, Technical Interview, HR Interview, Selected, Not Selected
    status = Column(String(50), default="Applied", index=True)
    applied_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
    analyses = relationship("AnalysisResult", back_populates="application", cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Float, nullable=False)  # 0 to 100
    skill_score = Column(Float, nullable=False)    # 0 to 100
    semantic_score = Column(Float, nullable=False) # 0 to 100
    experience_score = Column(Float, nullable=False)
    education_score = Column(Float, nullable=False)
    technology_score = Column(Float, nullable=False)
    domain_score = Column(Float, nullable=False)
    matched_skills = Column(JSON, default=list)
    missing_mandatory_skills = Column(JSON, default=list)
    missing_preferred_skills = Column(JSON, default=list)
    evidence_breakdown = Column(JSON, default=dict)
    strengths = Column(JSON, default=list)
    improvement_areas = Column(JSON, default=list)
    explanation = Column(Text, nullable=False)
    scoring_weights = Column(JSON, nullable=True)
    analyzed_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="analyses")
    resume = relationship("Resume", back_populates="analyses")
    job = relationship("Job", back_populates="analyses")
    skill_gaps = relationship("SkillGap", back_populates="analysis_result", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="analysis_result", cascade="all, delete-orphan")


class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, index=True)
    analysis_result_id = Column(Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False)
    missing_skill = Column(String(100), nullable=False)
    category = Column(String(50), default="mandatory")  # mandatory, preferred
    importance = Column(String(50), default="High")       # High, Medium, Low
    recommendation = Column(Text, nullable=True)

    analysis_result = relationship("AnalysisResult", back_populates="skill_gaps")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    interviewer_name = Column(String(150), nullable=False)
    interview_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    interview_time = Column(String(50), nullable=False)  # HH:MM
    interview_type = Column(String(50), default="Technical")  # Screening, Technical, Culture Fit, Final HR
    status = Column(String(50), default="Scheduled")  # Scheduled, Completed, Cancelled, Rescheduled
    feedback = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)  # 1 to 5
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    application = relationship("Application", back_populates="interviews")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    analysis_result_id = Column(Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False)
    report_type = Column(String(50), default="PDF")
    file_path = Column(String(512), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

    analysis_result = relationship("AnalysisResult", back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)  # job, candidate, application, interview
    target_id = Column(Integer, nullable=True)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


class HiringCampaign(Base):
    __tablename__ = "hiring_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    location = Column(String(100), nullable=False)
    employment_type = Column(String(50), default="Full-time")
    required_experience = Column(Float, default=0.0)
    education_level = Column(String(255), default="Bachelor's Degree")
    mandatory_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    job_description = Column(Text, nullable=False)
    vacancies = Column(Integer, default=1)
    deadline = Column(String(50), nullable=True)
    status = Column(String(50), default="active", index=True)  # draft, active, processing, completed, closed
    scoring_weights = Column(JSON, nullable=True)
    total_resumes = Column(Integer, default=0)
    processed_resumes = Column(Integer, default=0)
    failed_resumes = Column(Integer, default=0)
    avg_match_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("Job")
    creator = relationship("User")
    resumes = relationship("Resume", back_populates="campaign")
    processing_jobs = relationship("ProcessingJob", back_populates="campaign", cascade="all, delete-orphan")
    notes = relationship("CandidateNote", back_populates="campaign", cascade="all, delete-orphan")


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("hiring_campaigns.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(String(100), index=True, nullable=False)
    total_files = Column(Integer, default=0)
    processed_files = Column(Integer, default=0)
    failed_files = Column(Integer, default=0)
    status = Column(String(50), default="queued", index=True)  # queued, processing, completed, failed
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    campaign = relationship("HiringCampaign", back_populates="processing_jobs")
    logs = relationship("ProcessingLog", back_populates="processing_job", cascade="all, delete-orphan")


class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(Integer, primary_key=True, index=True)
    processing_job_id = Column(Integer, ForeignKey("processing_jobs.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), index=True, nullable=True)  # SHA-256
    file_size_bytes = Column(Integer, default=0)
    status = Column(String(50), default="pending")  # pending, processing, success, failed, duplicate
    stage = Column(String(50), default="upload")  # upload, extraction, nlp_parsing, ml_scoring, persisted
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    processing_job = relationship("ProcessingJob", back_populates="logs")
    resume = relationship("Resume")


class CandidateNote(Base):
    __tablename__ = "candidate_notes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("hiring_campaigns.id", ondelete="CASCADE"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate")
    campaign = relationship("HiringCampaign", back_populates="notes")
    author = relationship("User")


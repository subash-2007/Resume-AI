from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth Schemas -----------------
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "candidate"  # admin, hr_manager, hr_recruiter, candidate
    organization_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    org_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Job Schemas -----------------
class ScoringWeights(BaseModel):
    technical_skills: float = 0.35
    semantic_similarity: float = 0.25
    experience: float = 0.15
    education: float = 0.10
    technology: float = 0.10
    domain: float = 0.05

class JobCreate(BaseModel):
    title: str
    department: str
    location: str
    employment_type: str = "Full-time"
    description: str
    mandatory_skills: List[str] = []
    preferred_skills: List[str] = []
    required_experience: float = 0.0
    educational_requirements: str = "Bachelor's Degree"
    vacancies: int = 1
    deadline: Optional[str] = None
    scoring_weights: Optional[ScoringWeights] = None

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    description: Optional[str] = None
    mandatory_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    required_experience: Optional[float] = None
    educational_requirements: Optional[str] = None
    vacancies: Optional[int] = None
    deadline: Optional[str] = None
    status: Optional[str] = None
    scoring_weights: Optional[ScoringWeights] = None

class JobRequirementAnalysisRequest(BaseModel):
    title: str
    description: str

class JobRequirementAnalysisResponse(BaseModel):
    technical_skills: List[str]
    soft_skills: List[str]
    mandatory_skills: List[str]
    preferred_skills: List[str]
    experience_years: float
    education_level: str
    tools_technologies: List[str]

class JobResponse(BaseModel):
    id: int
    title: str
    department: str
    location: str
    employment_type: str
    description: str
    mandatory_skills: List[str]
    preferred_skills: List[str]
    required_experience: float
    educational_requirements: str
    vacancies: int
    deadline: Optional[str]
    status: str
    scoring_weights: Optional[Dict[str, float]]
    created_at: datetime
    application_count: Optional[int] = 0

    class Config:
        from_attributes = True

# ----------------- Resume Schemas -----------------
class ResumeParsedData(BaseModel):
    name: Optional[str] = "Not detected"
    email: Optional[str] = "Not detected"
    phone: Optional[str] = "Not detected"
    education: List[Dict[str, Any]] = []
    skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    total_experience_years: float = 0.0
    projects: List[Dict[str, Any]] = []
    certifications: List[str] = []
    technologies: List[str] = []

class ResumeResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    parsed_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Analysis & Matching Schemas -----------------
class AnalyzeResumeRequest(BaseModel):
    job_id: int
    resume_id: int

class CandidateSelfAnalyzeRequest(BaseModel):
    job_title: str
    job_description: str
    resume_id: int

class AnalysisResultResponse(BaseModel):
    id: int
    job_id: Optional[int] = None
    resume_id: int
    application_id: Optional[int] = None
    overall_score: float
    skill_score: float
    semantic_score: float
    experience_score: float
    education_score: float
    technology_score: float
    domain_score: float
    matched_skills: List[str]
    missing_mandatory_skills: List[str]
    missing_preferred_skills: List[str]
    explanation: str
    scoring_weights: Optional[Dict[str, float]] = None
    has_mandatory_deficit: bool = False
    analyzed_at: datetime

    class Config:
        from_attributes = True

# ----------------- Candidate Schemas -----------------
class CandidateResponse(BaseModel):
    id: int
    user_id: Optional[int]
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    location: Optional[str]
    current_title: Optional[str]
    total_years_experience: float
    created_at: datetime

    class Config:
        from_attributes = True

class CandidateDetailResponse(CandidateResponse):
    skills: List[str] = []
    applications: List[Dict[str, Any]] = []
    latest_score: Optional[float] = None

# ----------------- Application & Pipeline -----------------
class ApplicationStatusUpdate(BaseModel):
    status: str  # Applied, AI Screened, HR Review, Shortlisted, Technical Interview, HR Interview, Selected, Not Selected

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    job_title: str
    candidate_id: int
    candidate_name: str
    candidate_email: str
    resume_id: int
    status: str
    applied_at: datetime
    match_percentage: Optional[float] = None
    has_mandatory_deficit: Optional[bool] = False

# ----------------- Ranking Schemas -----------------
class CandidateRankingItem(BaseModel):
    candidate_id: int
    candidate_name: str
    email: str
    current_title: Optional[str]
    total_years_experience: float
    application_id: int
    resume_id: int
    status: str
    overall_score: float
    skill_score: float
    semantic_score: float
    experience_score: float
    education_score: float
    technology_score: float
    domain_score: float
    matched_skills_count: int
    missing_mandatory_count: int
    has_mandatory_deficit: bool
    applied_at: datetime

# ----------------- Interview Schemas -----------------
class InterviewCreate(BaseModel):
    application_id: int
    interviewer_name: str
    interview_date: str  # YYYY-MM-DD
    interview_time: str  # HH:MM
    interview_type: str = "Technical"
    notes: Optional[str] = None

class InterviewUpdate(BaseModel):
    status: Optional[str] = None
    feedback: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[int] = None

class InterviewResponse(BaseModel):
    id: int
    application_id: int
    candidate_name: str
    job_title: str
    interviewer_name: str
    interview_date: str
    interview_time: str
    interview_type: str
    status: str
    feedback: Optional[str]
    notes: Optional[str]
    rating: Optional[int]
    created_at: datetime

# ----------------- Analytics Schemas -----------------
class RecruitmentMetricsResponse(BaseModel):
    active_jobs: int
    total_candidates: int
    resumes_analyzed: int
    shortlisted_candidates: int
    interviews_scheduled: int
    pending_reviews: int
    pipeline_stages: Dict[str, int]
    match_distribution: List[Dict[str, Any]]
    top_skills_in_demand: List[Dict[str, Any]]
    applications_per_job: List[Dict[str, Any]]
    conversion_rates: Dict[str, float]
    average_match_score: float = 0.0

# ----------------- Bulk Hiring & Intelligent Screening Schemas -----------------
class HiringCampaignCreate(BaseModel):
    title: str
    company_name: str
    department: str
    location: str
    employment_type: str = "Full-time"
    required_experience: float = 0.0
    education_level: str = "Bachelor's Degree"
    mandatory_skills: List[str] = []
    preferred_skills: List[str] = []
    job_description: str
    vacancies: int = 1
    deadline: Optional[str] = None
    scoring_weights: Optional[Dict[str, float]] = None

class HiringCampaignResponse(BaseModel):
    id: int
    job_id: int
    title: str
    company_name: str
    department: str
    location: str
    employment_type: str
    required_experience: float
    education_level: str
    mandatory_skills: List[str]
    preferred_skills: List[str]
    job_description: str
    vacancies: int
    deadline: Optional[str]
    status: str
    scoring_weights: Optional[Dict[str, float]]
    total_resumes: int
    processed_resumes: int
    failed_resumes: int
    avg_match_score: float
    created_at: datetime

    class Config:
        from_attributes = True

class ProcessingJobResponse(BaseModel):
    id: int
    campaign_id: int
    batch_id: str
    total_files: int
    processed_files: int
    failed_files: int
    status: str
    error_message: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class ProcessingProgressResponse(BaseModel):
    campaign_id: int
    status: str
    total_files: int
    processed_files: int
    failed_files: int
    pending_files: int
    progress_percentage: float
    logs: List[Dict[str, Any]] = []

class CandidateActionRequest(BaseModel):
    action: str  # shortlist, review, schedule_interview, reject, note
    notes: Optional[str] = None
    interview_details: Optional[Dict[str, Any]] = None

class HiringAnalyticsResponse(BaseModel):
    total_uploaded: int
    successfully_processed: int
    failed_resumes: int
    candidates_analyzed: int
    average_match_score: float
    shortlisted_count: int
    under_review_count: int
    interviews_scheduled_count: int
    rejected_count: int
    score_distribution: List[Dict[str, Any]]
    skill_distribution: List[Dict[str, Any]]
    experience_distribution: List[Dict[str, Any]]
    education_distribution: List[Dict[str, Any]]
    pipeline_distribution: List[Dict[str, Any]]



export type UserRole = 'admin' | 'hr_manager' | 'hr_recruiter' | 'candidate';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  org_id?: number | null;
}

export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  mandatory_skills: string[];
  preferred_skills: string[];
  required_experience: number;
  educational_requirements: string;
  vacancies: number;
  deadline?: string | null;
  status: string;
  scoring_weights?: Record<string, number> | null;
  created_at: string;
  application_count?: number;
}

export interface Resume {
  id: number;
  filename: string;
  file_type: string;
  parsed_data: {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience?: Array<{ years?: number; title?: string }>;
    total_experience_years?: number;
    education?: Array<{ degree?: string; verified?: boolean }>;
    projects?: any[];
    certifications?: string[];
    technologies?: string[];
  };
  created_at: string;
}

export interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  current_title: string;
  total_years_experience: number;
  skills: string[];
  applications: Array<{
    application_id: number;
    job_id: number;
    job_title: string;
    status: string;
    match_score?: number | null;
    applied_at: string;
  }>;
  latest_score?: number | null;
  created_at: string;
}

export interface AnalysisResult {
  id: number;
  job_id?: number | null;
  resume_id: number;
  application_id?: number | null;
  overall_score: number;
  skill_score: number;
  semantic_score: number;
  experience_score: number;
  education_score: number;
  technology_score: number;
  domain_score: number;
  matched_skills: string[];
  missing_mandatory_skills: string[];
  missing_preferred_skills: string[];
  explanation: string;
  scoring_weights?: Record<string, number> | null;
  has_mandatory_deficit: boolean;
  analyzed_at: string;
}

export interface CandidateRanking {
  candidate_id: number;
  candidate_name: string;
  email: string;
  current_title?: string;
  total_years_experience: number;
  application_id: number;
  resume_id: number;
  status: string;
  overall_score: number;
  skill_score: number;
  semantic_score: number;
  experience_score: number;
  education_score: number;
  technology_score: number;
  domain_score: number;
  matched_skills_count: number;
  missing_mandatory_count: number;
  has_mandatory_deficit: boolean;
  applied_at: string;
}

export interface Interview {
  id: number;
  application_id: number;
  candidate_name: string;
  job_title: string;
  interviewer_name: string;
  interview_date: string;
  interview_time: string;
  interview_type: string;
  status: string;
  feedback?: string | null;
  notes?: string | null;
  rating?: number | null;
  created_at: string;
}

export interface RecruitmentMetrics {
  active_jobs: number;
  total_candidates: number;
  resumes_analyzed: number;
  shortlisted_candidates: number;
  interviews_scheduled: number;
  pending_reviews: number;
  pipeline_stages: Record<string, number>;
  match_distribution: Array<{ range: string; count: number }>;
  top_skills_in_demand: Array<{ skill: string; demand_score: number }>;
  applications_per_job: Array<{ job_title: string; applications: number }>;
  conversion_rates: {
    screening_rate: number;
    shortlist_rate: number;
    interview_rate: number;
    offer_rate: number;
  };
  average_match_score?: number;
}

export interface HiringCampaign {
  id: number;
  job_id: number;
  title: string;
  company_name: string;
  department: string;
  location: string;
  employment_type: string;
  required_experience: number;
  education_level: string;
  mandatory_skills: string[];
  preferred_skills: string[];
  job_description: string;
  vacancies: number;
  deadline?: string | null;
  status: string;
  scoring_weights?: Record<string, number> | null;
  total_resumes: number;
  processed_resumes: number;
  failed_resumes: number;
  avg_match_score: number;
  created_at: string;
}

export interface ProcessingLogItem {
  id: number;
  filename: string;
  status: string;
  stage: string;
  file_size_bytes: number;
  message?: string;
  created_at?: string;
}

export interface HiringProcessingProgress {
  campaign_id: number;
  status: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  pending_files: number;
  progress_percentage: number;
  logs: ProcessingLogItem[];
}

export interface HiringRankedCandidate {
  rank: number;
  candidate_id: number;
  candidate_name: string;
  email: string;
  phone?: string;
  location?: string;
  experience_years: number;
  degree?: string;
  application_id: number;
  application_status: string;
  resume_id: number;
  overall_score: number;
  skill_score: number;
  semantic_score: number;
  experience_score: number;
  education_score: number;
  matched_skills: string[];
  missing_mandatory: string[];
  missing_preferred: string[];
  has_mandatory_deficit: boolean;
  analyzed_at?: string;
}

export interface CandidateDossier {
  candidate: {
    id: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    current_title: string;
    total_experience_years: number;
  };
  application: {
    id: number;
    job_id: number;
    status: string;
    rank_position?: number | null;
  };
  resume: {
    id: number;
    filename: string;
    file_type: string;
    raw_text: string;
    parsed_data: any;
    preview_url?: string;
    download_url?: string;
  };
  matching_analysis: {
    overall_score: number;
    skill_score: number;
    semantic_score: number;
    experience_score: number;
    education_score: number;
    technology_score: number;
    domain_score: number;
    matched_skills: string[];
    missing_mandatory_skills: string[];
    missing_preferred_skills: string[];
    evidence_breakdown: Record<string, { status: string; section: string; found: boolean }>;
    strengths: string[];
    improvement_areas: string[];
    explanation: string;
    scoring_weights?: Record<string, number> | null;
  };
  notes: Array<{
    id: number;
    note: string;
    created_at: string;
    author_name: string;
  }>;
  interviews: Array<{
    id: number;
    interviewer_name: string;
    interview_date: string;
    interview_time: string;
    interview_type: string;
    status: string;
    notes?: string;
  }>;
}

export interface HiringAnalytics {
  total_uploaded: number;
  successfully_processed: number;
  failed_resumes: number;
  candidates_analyzed: number;
  average_match_score: number;
  shortlisted_count: number;
  under_review_count: number;
  interviews_scheduled_count: number;
  rejected_count: number;
  score_distribution: Array<{ range: string; count: number }>;
  skill_distribution: Array<{ skill: string; count: number }>;
  experience_distribution: Array<{ bracket: string; count: number }>;
  education_distribution: Array<{ qualification: string; count: number }>;
  pipeline_distribution: Array<{ stage: string; count: number }>;
}


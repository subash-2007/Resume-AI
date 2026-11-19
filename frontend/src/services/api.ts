import axios from 'axios';
import {
  User, Job, Resume, Candidate, AnalysisResult,
  CandidateRanking, Interview, RecruitmentMetrics,
  HiringCampaign, HiringProcessingProgress, HiringRankedCandidate,
  CandidateDossier, HiringAnalytics
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('resumeai_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // When payload is FormData, remove Content-Type to let browser set boundary parameter automatically
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Auth API
export const apiLogin = (data: { email: string; password: string }) =>
  apiClient.post<{ access_token: string; token_type: string; user: User }>('/auth/login', data);

export const apiRegister = (data: { email: string; password: string; full_name: string; role?: string; organization_name?: string }) =>
  apiClient.post<{ access_token: string; token_type: string; user: User }>('/auth/register', data);

export const apiGetMe = () =>
  apiClient.get<User>('/auth/me');

// Jobs API
export const apiGetJobs = (params?: { search?: string; department?: string; status_filter?: string }) =>
  apiClient.get<Job[]>('/jobs', { params });

export const apiGetJob = (id: number) =>
  apiClient.get<Job>(`/jobs/${id}`);

export const apiCreateJob = (data: Partial<Job>) =>
  apiClient.post<Job>('/jobs', data);

export const apiUpdateJob = (id: number, data: Partial<Job>) =>
  apiClient.put<Job>(`/jobs/${id}`, data);

export const apiDeleteJob = (id: number) =>
  apiClient.delete(`/jobs/${id}`);

export const apiExtractJobRequirements = (data: { title: string; description: string }) =>
  apiClient.post<{
    technical_skills: string[];
    soft_skills: string[];
    mandatory_skills: string[];
    preferred_skills: string[];
    experience_years: number;
    education_level: string;
    tools_technologies: string[];
  }>('/jobs/extract-requirements', data);

// Resumes API
export const apiUploadSingleResume = (formData: FormData) =>
  apiClient.post('/resumes/upload', formData);

export const apiUploadBulkResumes = (formData: FormData) =>
  apiClient.post('/resumes/bulk-upload', formData);

export const apiGetMyResumes = () =>
  apiClient.get<Resume[]>('/resumes');

export const apiGetResume = (id: number) =>
  apiClient.get<Resume & { raw_text: string }>(`/resumes/${id}`);

// Candidates API
export const apiGetCandidates = (params?: { search?: string; page?: number; limit?: number }) =>
  apiClient.get<{ items: Candidate[]; total: number; page: number; limit: number }>('/candidates', { params });

export const apiGetCandidate = (id: number) =>
  apiClient.get<any>(`/candidates/${id}`);

export const apiUpdateApplicationStatus = (appId: number, status: string) =>
  apiClient.put(`/candidates/application/${appId}/status`, { status });

// Ranking & Comparison API
export const apiGetJobRankings = (jobId: number) =>
  apiClient.get<CandidateRanking[]>(`/ranking/job/${jobId}`);

export const apiCompareCandidates = (jobId: number, candidateIds: number[]) =>
  apiClient.post<{ job_title: string; candidates: any[]; radar_data: any[] }>('/ranking/compare', {
    job_id: jobId,
    candidate_ids: candidateIds,
  });

// Analysis & Matching API
export const apiAnalyzeMatch = (jobId: number, resumeId: number) =>
  apiClient.post<AnalysisResult>('/analysis/match', { job_id: jobId, resume_id: resumeId });

export const apiCandidateSelfMatch = (data: { job_title: string; job_description: string; resume_id: number }) =>
  apiClient.post<AnalysisResult>('/analysis/self-match', data);

export const apiGetCandidateHistory = () =>
  apiClient.get<any[]>('/analysis/candidate/history');

export const apiGetAnalysis = (analysisId: number) =>
  apiClient.get<any>(`/analysis/${analysisId}`);

// Interviews API
export const apiGetInterviews = (params?: { status_filter?: string }) =>
  apiClient.get<Interview[]>('/interviews', { params });

export const apiScheduleInterview = (data: {
  application_id: number;
  interviewer_name: string;
  interview_date: string;
  interview_time: string;
  interview_type: string;
  notes?: string;
}) => apiClient.post<Interview>('/interviews', data);

export const apiUpdateInterview = (id: number, data: { status?: string; feedback?: string; rating?: number; notes?: string }) =>
  apiClient.put<Interview>(`/interviews/${id}`, data);

// Analytics API
export const apiGetRecruitmentMetrics = () =>
  apiClient.get<RecruitmentMetrics>('/analytics/recruitment-metrics');

// Reports API (PDF Download URL)
export const getReportDownloadUrl = (analysisId: number) =>
  `${API_BASE}/reports/generate/${analysisId}`;

// Bulk Hiring & AI Screening API
export const apiCreateHiringCampaign = (data: Partial<HiringCampaign>) =>
  apiClient.post<HiringCampaign>('/hiring/campaigns', data);

export const apiGetHiringCampaigns = () =>
  apiClient.get<HiringCampaign[]>('/hiring/campaigns');

export const apiGetHiringCampaign = (id: number) =>
  apiClient.get<HiringCampaign>(`/hiring/campaigns/${id}`);

export const apiUploadHiringBatch = (campaignId: number, formData: FormData) =>
  apiClient.post<{ processing_job_id: number; batch_id: string; total_enqueued: number; status: string }>(
    `/hiring/campaigns/${campaignId}/upload-batch`,
    formData
  );

export const apiUploadHiringChunk = (campaignId: number, formData: FormData) =>
  apiClient.post<{ upload_id: string; chunk_index: number; received_bytes: number }>(
    `/hiring/campaigns/${campaignId}/upload-chunk`,
    formData
  );

export const apiCompleteHiringChunk = (campaignId: number, formData: FormData) =>
  apiClient.post<{ processing_job_id: number; filename: string; file_hash: string; status: string }>(
    `/hiring/campaigns/${campaignId}/complete-chunk-upload`,
    formData
  );

export const apiGetHiringProgress = (campaignId: number) =>
  apiClient.get<HiringProcessingProgress>(`/hiring/campaigns/${campaignId}/progress`);

export const apiGetHiringRankings = (campaignId: number, params?: {
  search?: string;
  min_experience?: number;
  max_experience?: number;
  education_filter?: string;
  mandatory_coverage?: string;
  status_filter?: string;
  sort_by?: string;
  page?: number;
  limit?: number;
}) =>
  apiClient.get<{ items: HiringRankedCandidate[]; total: number; page: number; limit: number; total_pages: number }>(
    `/hiring/campaigns/${campaignId}/rankings`,
    { params }
  );

export const apiGetCandidateDossier = (candidateId: number, campaignId?: number) =>
  apiClient.get<CandidateDossier>(`/hiring/candidates/${candidateId}/detail`, {
    params: { campaign_id: campaignId }
  });

export const apiExecuteCandidateAction = (
  candidateId: number,
  data: { action: string; notes?: string; interview_details?: any },
  campaignId?: number
) =>
  apiClient.post(`/hiring/candidates/${candidateId}/action`, data, {
    params: { campaign_id: campaignId }
  });

export const apiGetHiringAnalytics = (campaignId: number) =>
  apiClient.get<HiringAnalytics>(`/hiring/campaigns/${campaignId}/analytics`);

export const getResumePreviewUrl = (resumeId: number) =>
  `${API_BASE}/hiring/resumes/${resumeId}/preview`;

export const getResumeDownloadUrl = (resumeId: number) =>
  `${API_BASE}/hiring/resumes/${resumeId}/download`;



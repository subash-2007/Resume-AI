import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  UploadCloud,
  FileText,
  Layers,
  Award,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderUp,
  Download,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  Building,
  MapPin,
  Clock,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Cpu,
  UserCheck,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { CircularProgress } from '../../components/CircularProgress';
import { CandidateDossierModal } from './CandidateDossierModal';
import {
  HiringCampaign,
  HiringProcessingProgress,
  HiringRankedCandidate,
  HiringAnalytics
} from '../../types';
import {
  apiCreateHiringCampaign,
  apiGetHiringCampaigns,
  apiUploadHiringBatch,
  apiGetHiringProgress,
  apiGetHiringRankings,
  apiGetHiringAnalytics,
  apiExtractJobRequirements
} from '../../services/api';

type WizardStep = 1 | 2 | 3 | 4 | 5;

export const BulkHiringPortal: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Navigation: Strictly 1 -> 2 -> 3 -> 4 -> 5
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Campaigns & Active Job
  const [campaigns, setCampaigns] = useState<HiringCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  // STEP 1 Form State (All 12 Required Fields)
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('Enterprise Corp');
  const [department, setDepartment] = useState('Engineering');
  const [jobLocation, setJobLocation] = useState('San Francisco, CA (Hybrid)');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [requiredExperience, setRequiredExperience] = useState(3.0);
  const [educationLevel, setEducationLevel] = useState("Bachelor's Degree");
  const [mandatorySkillsInput, setMandatorySkillsInput] = useState('Python, FastAPI, SQL, Machine Learning');
  const [preferredSkillsInput, setPreferredSkillsInput] = useState('Docker, Kubernetes, AWS, PyTorch');
  const [jobDescription, setJobDescription] = useState('');
  const [vacancies, setVacancies] = useState(5);
  const [deadline, setDeadline] = useState('2026-12-31');

  // STEP 1 Feedback & Status
  const [isExtractingRequirements, setIsExtractingRequirements] = useState(false);
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [createdJobCode, setCreatedJobCode] = useState<string | null>(null);

  // STEP 2 Bulk Upload State (500+ scale support)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // STEP 3 Processing Telemetry State
  const [progressData, setProgressData] = useState<HiringProcessingProgress | null>(null);
  const pollIntervalRef = useRef<any>(null);

  // STEP 4 Ranked Candidates State
  const [rankings, setRankings] = useState<HiringRankedCandidate[]>([]);
  const [rankingTotal, setRankingTotal] = useState(0);
  const [rankingPage, setRankingPage] = useState(1);
  const [rankingSearch, setRankingSearch] = useState('');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [mandatoryFilter, setMandatoryFilter] = useState<'all' | 'all_met' | 'has_deficit'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('score_desc');

  // STEP 5 Selected Candidate
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  // Active Campaign Object
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  // Load Campaigns on Mount (Keep default step as 1: Create Job)
  const fetchCampaigns = async () => {
    try {
      const res = await apiGetHiringCampaigns();
      setCampaigns(res.data);
      if (res.data.length > 0 && !selectedCampaignId) {
        // We track the latest campaign id for optional quick-switch, but user starts at Step 1
        setSelectedCampaignId(res.data[0].id);
      }
    } catch (e) {
      console.error('Error fetching campaigns:', e);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Polling for Step 3 (AI Resume Analysis)
  useEffect(() => {
    if (!selectedCampaignId) return;

    fetchRankings();
    fetchProgress();

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      fetchProgress();
    }, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedCampaignId, rankingPage, rankingSearch, experienceFilter, mandatoryFilter, statusFilter, sortOrder]);

  const fetchProgress = async () => {
    if (!selectedCampaignId) return;
    try {
      const res = await apiGetHiringProgress(selectedCampaignId);
      setProgressData(res.data);
      if (res.data.status === 'completed' || res.data.processed_files > 0) {
        fetchRankings();
      }
    } catch (e) {
      console.error('Error fetching progress:', e);
    }
  };

  const fetchRankings = async () => {
    if (!selectedCampaignId) return;
    try {
      let minExp: number | undefined;
      let maxExp: number | undefined;
      if (experienceFilter === 'junior') { maxExp = 2.0; }
      else if (experienceFilter === 'mid') { minExp = 2.0; maxExp = 5.0; }
      else if (experienceFilter === 'senior') { minExp = 5.0; }

      const res = await apiGetHiringRankings(selectedCampaignId, {
        search: rankingSearch || undefined,
        min_experience: minExp,
        max_experience: maxExp,
        mandatory_coverage: mandatoryFilter,
        status_filter: statusFilter !== 'all' ? statusFilter : undefined,
        sort_by: sortOrder,
        page: rankingPage,
        limit: 25
      });
      setRankings(res.data.items);
      setRankingTotal(res.data.total);
    } catch (e) {
      console.error('Error fetching rankings:', e);
    }
  };

  // AI Extract Requirements from Job Description
  const handleExtractFromDescription = async () => {
    if (!jobDescription.trim()) {
      setFormError('Please enter a job description first so AI can analyze requirements.');
      return;
    }
    try {
      setIsExtractingRequirements(true);
      setFormError(null);
      const res = await apiExtractJobRequirements({
        title: jobTitle || 'Software Engineer',
        description: jobDescription
      });
      if (res.data.mandatory_skills?.length > 0) {
        setMandatorySkillsInput(res.data.mandatory_skills.join(', '));
      }
      if (res.data.preferred_skills?.length > 0) {
        setPreferredSkillsInput(res.data.preferred_skills.join(', '));
      }
      if (res.data.experience_years) {
        setRequiredExperience(res.data.experience_years);
      }
      if (res.data.education_level) {
        setEducationLevel(res.data.education_level);
      }
    } catch (e: any) {
      console.error('Extract error:', e);
      setFormError('AI requirement parsing encountered an issue. You may continue entering manually.');
    } finally {
      setIsExtractingRequirements(false);
    }
  };

  // STEP 1: Submit and Create Job in Database
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Front-end field validation
    if (!jobTitle.trim()) {
      setFormError('Job Title is required. Please provide a clear role title.');
      return;
    }
    if (!companyName.trim()) {
      setFormError('Company Name is required. Please specify the hiring organization.');
      return;
    }
    if (!jobDescription.trim()) {
      setFormError('Complete Job Description is required to parse qualifications and evaluate resumes.');
      return;
    }

    try {
      setIsSubmittingCampaign(true);
      const mandatoryArr = mandatorySkillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const preferredArr = preferredSkillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      // Normalize date format safely
      let formattedDeadline = deadline.trim();
      if (/^\d{2}-\d{2}-\d{4}$/.test(formattedDeadline)) {
        const [d, m, y] = formattedDeadline.split('-');
        formattedDeadline = `${y}-${m}-${d}`;
      }

      const res = await apiCreateHiringCampaign({
        title: jobTitle.trim(),
        company_name: companyName.trim(),
        department: department.trim() || 'General',
        location: jobLocation.trim() || 'Remote',
        employment_type: employmentType,
        required_experience: Number(requiredExperience) || 0.0,
        education_level: educationLevel,
        mandatory_skills: mandatoryArr,
        preferred_skills: preferredArr,
        job_description: jobDescription.trim(),
        vacancies: Math.max(1, Number(vacancies) || 1),
        deadline: formattedDeadline || undefined,
        scoring_weights: {
          technical_skills: 0.35,
          semantic_similarity: 0.25,
          experience: 0.15,
          education: 0.10,
          technology: 0.10,
          domain: 0.05
        }
      });

      const uniqueJobId = `JOB-${String(res.data.job_id || res.data.id).padStart(4, '0')}`;
      setCreatedJobCode(uniqueJobId);
      setFormSuccess(`Job created and saved to database successfully! Unique Job ID: ${uniqueJobId}`);
      
      // Update campaign state
      setCampaigns(prev => [res.data, ...prev.filter(c => c.id !== res.data.id)]);
      setSelectedCampaignId(res.data.id);

      // Navigate to Step 2 only after successful database creation
      setTimeout(() => {
        setCurrentStep(2);
      }, 700);
    } catch (err: any) {
      console.error('Job creation failed:', err);
      let detailMsg = 'Failed to create hiring campaign in database. Please verify fields.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          detailMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          detailMsg = err.response.data.detail
            .map((d: any) => `${d.loc ? d.loc.slice(1).join('.') : 'field'}: ${d.msg}`)
            .join('; ');
        }
      } else if (err.message) {
        detailMsg = err.message;
      }
      setFormError(detailMsg);
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  // STEP 2: File Ingestion Handlers (500+ PDF/DOCX support)
  const handleFilesChosen = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    let dups = 0;
    const existingSignatures = new Set(selectedFiles.map(f => `${f.name}_${f.size}`));

    Array.from(files).forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'txt') {
        const sig = `${f.name}_${f.size}`;
        if (existingSignatures.has(sig)) {
          dups += 1;
        } else {
          existingSignatures.add(sig);
          valid.push(f);
        }
      }
    });

    if (dups > 0) {
      setDuplicateCount(prev => prev + dups);
    }

    if (valid.length < files.length - dups) {
      setUploadError('Some files were ignored because only PDF, DOCX, and TXT are supported.');
    } else {
      setUploadError(null);
    }

    setSelectedFiles(prev => [...prev, ...valid]);
  };

  // STEP 2: Start Bulk Screening Upload
  const handleStartScreeningUpload = async () => {
    if (!selectedCampaignId) {
      setUploadError('Active Job ID is missing. Please complete Step 1 first.');
      return;
    }
    if (selectedFiles.length === 0) {
      setUploadError('Please select or drag-and-drop at least one resume file.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // Chunked streaming to protect browser & backend memory (50 files per chunk)
      const BATCH_CHUNK_SIZE = 50;
      for (let i = 0; i < selectedFiles.length; i += BATCH_CHUNK_SIZE) {
        const slice = selectedFiles.slice(i, i + BATCH_CHUNK_SIZE);
        const formData = new FormData();
        slice.forEach(file => {
          formData.append('files', file);
        });
        await apiUploadHiringBatch(selectedCampaignId, formData);
      }

      setSelectedFiles([]);
      fetchProgress();
      
      // Advance to Step 3: AI Resume Analysis
      setCurrentStep(3);
    } catch (e: any) {
      console.error('Upload error:', e);
      setUploadError(e.response?.data?.detail || 'Bulk resume upload encountered an issue. Please retry.');
    } finally {
      setIsUploading(false);
    }
  };

  const totalUploadSizeBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const totalUploadSizeFormatted = (totalUploadSizeBytes / (1024 * 1024)).toFixed(1);

  // CSV Export for Step 4
  const handleExportCSV = () => {
    if (rankings.length === 0) return;
    const headers = ['Rank', 'Candidate Name', 'Email', 'Experience Years', 'Overall Score', 'Skill Score', 'Semantic Score', 'Status'];
    const rows = rankings.map(r => [
      r.rank,
      `"${r.candidate_name}"`,
      `"${r.email}"`,
      r.experience_years,
      `${r.overall_score}%`,
      `${r.skill_score}%`,
      `${r.semantic_score}%`,
      `"${r.application_status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ResumeAI_Rankings_Campaign_${selectedCampaignId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeJobCodeDisplay = createdJobCode || (selectedCampaign ? `JOB-${String(selectedCampaign.job_id || selectedCampaign.id).padStart(4, '0')}` : 'JOB-NEW');

  return (
    <div className="min-h-screen bg-mocha-950 text-silver flex flex-col selection:bg-lavender selection:text-mocha-950">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 space-y-8">
        
        {/* Top Header Banner */}
        <div className="mocha-card p-8 border-silver/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-mocha-800/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mocha-900 border border-silver/20 text-xs font-semibold text-lavender mb-3 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-lavender inline-block"></span>
                <span>Large-Scale Recruitment Screening (500+ to 1,000+ Resumes)</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-silver">
                AI-Powered Bulk Recruitment Screening
              </h1>
              <p className="text-xs sm:text-sm text-silver/70 max-w-3xl mt-1 leading-relaxed">
                Asynchronous resume processing powered by PyMuPDF, python-docx, SentenceTransformers (all-MiniLM-L6-v2), and TF-IDF. Follow the exact sequential workflow below.
              </p>
            </div>

            {/* Existing Campaign Quick-Select */}
            {campaigns.length > 0 && (
              <div className="flex flex-col text-xs bg-mocha-900/80 p-3 rounded-xl border border-silver/15">
                <span className="text-silver/60 mb-1 text-[11px] font-medium">Switch Active Campaign</span>
                <select
                  value={selectedCampaignId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedCampaignId(id);
                    setCreatedJobCode(`JOB-${String(id).padStart(4, '0')}`);
                  }}
                  className="bg-mocha-950 border border-silver/20 rounded-lg px-3 py-2 text-xs text-silver focus:outline-none focus:border-lavender"
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>
                      JOB-{String(c.job_id || c.id).padStart(4, '0')} - {c.title} ({c.company_name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* STRICT 5-STEP SEQUENTIAL WIZARD NAVIGATION BAR */}
        <div className="mocha-card p-3 border-silver/20">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            
            {/* Step 1 */}
            <button
              onClick={() => setCurrentStep(1)}
              className={`p-3 rounded-xl font-medium flex items-center gap-2.5 transition-all text-left ${
                currentStep === 1
                  ? 'bg-lavender text-mocha-950 font-bold shadow-md'
                  : 'bg-mocha-900/60 text-silver hover:bg-mocha-850 border border-silver/15'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                currentStep === 1 ? 'bg-mocha-950 text-lavender' : 'bg-mocha-800 text-silver/80'
              }`}>
                01
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase tracking-wider block opacity-70">Step 1</span>
                <span className="font-semibold truncate block">Create Job</span>
              </div>
            </button>

            {/* Step 2 */}
            <button
              onClick={() => {
                if (selectedCampaignId) setCurrentStep(2);
                else setFormError('Please save the job in Step 1 before proceeding to Resume Upload.');
              }}
              disabled={!selectedCampaignId}
              className={`p-3 rounded-xl font-medium flex items-center gap-2.5 transition-all text-left ${
                currentStep === 2
                  ? 'bg-lavender text-mocha-950 font-bold shadow-md'
                  : selectedCampaignId
                  ? 'bg-mocha-900/60 text-silver hover:bg-mocha-850 border border-silver/15'
                  : 'bg-mocha-900/20 text-silver/30 border border-silver/5 cursor-not-allowed'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                currentStep === 2 ? 'bg-mocha-950 text-lavender' : 'bg-mocha-800 text-silver/80'
              }`}>
                02
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase tracking-wider block opacity-70">Step 2</span>
                <span className="font-semibold truncate block">Bulk Upload</span>
              </div>
            </button>

            {/* Step 3 */}
            <button
              onClick={() => {
                if (selectedCampaignId) setCurrentStep(3);
              }}
              disabled={!selectedCampaignId}
              className={`p-3 rounded-xl font-medium flex items-center gap-2.5 transition-all text-left ${
                currentStep === 3
                  ? 'bg-lavender text-mocha-950 font-bold shadow-md'
                  : selectedCampaignId
                  ? 'bg-mocha-900/60 text-silver hover:bg-mocha-850 border border-silver/15'
                  : 'bg-mocha-900/20 text-silver/30 border border-silver/5 cursor-not-allowed'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                currentStep === 3 ? 'bg-mocha-950 text-lavender' : 'bg-mocha-800 text-silver/80'
              }`}>
                03
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase tracking-wider block opacity-70">Step 3</span>
                <span className="font-semibold truncate block">AI Analysis</span>
              </div>
            </button>

            {/* Step 4 */}
            <button
              onClick={() => {
                if (selectedCampaignId) setCurrentStep(4);
              }}
              disabled={!selectedCampaignId}
              className={`p-3 rounded-xl font-medium flex items-center gap-2.5 transition-all text-left ${
                currentStep === 4
                  ? 'bg-lavender text-mocha-950 font-bold shadow-md'
                  : selectedCampaignId
                  ? 'bg-mocha-900/60 text-silver hover:bg-mocha-850 border border-silver/15'
                  : 'bg-mocha-900/20 text-silver/30 border border-silver/5 cursor-not-allowed'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                currentStep === 4 ? 'bg-mocha-950 text-lavender' : 'bg-mocha-800 text-silver/80'
              }`}>
                04
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase tracking-wider block opacity-70">Step 4</span>
                <span className="font-semibold truncate block">Rankings ({rankingTotal})</span>
              </div>
            </button>

            {/* Step 5 */}
            <button
              onClick={() => {
                if (selectedCandidateId) setCurrentStep(5);
              }}
              disabled={!selectedCandidateId}
              className={`p-3 rounded-xl font-medium flex items-center gap-2.5 transition-all text-left ${
                currentStep === 5
                  ? 'bg-lavender text-mocha-950 font-bold shadow-md'
                  : selectedCandidateId
                  ? 'bg-mocha-900/60 text-silver hover:bg-mocha-850 border border-silver/15'
                  : 'bg-mocha-900/20 text-silver/30 border border-silver/5 cursor-not-allowed'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                currentStep === 5 ? 'bg-mocha-950 text-lavender' : 'bg-mocha-800 text-silver/80'
              }`}>
                05
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase tracking-wider block opacity-70">Step 5</span>
                <span className="font-semibold truncate block">Candidate Details</span>
              </div>
            </button>

          </div>
        </div>

        {/* =========================================================================
            STEP 1 – CREATE JOB (All 12 Fields, Real DB Insertion, Unique Job ID)
           ========================================================================= */}
        {currentStep === 1 && (
          <div className="mocha-card p-8 space-y-8 animate-in fade-in duration-200">
            <div className="border-b border-silver/10 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-mocha-900 border border-silver/15 text-[11px] font-semibold text-lavender mb-2 uppercase tracking-wider">
                <span>Step 01 / 05 &bull; Vacancy Specifications</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-silver">Create Job &amp; Initialize Recruitment Pipeline</h2>
              <p className="text-xs text-silver/70 mt-1">
                Enter target vacancy parameters. The AI Requirement Analyzer can extract mandatory skills and experience duration directly from your job description.
              </p>
            </div>

            {/* INLINE VALIDATION & SERVER ERROR BANNER */}
            {formError && (
              <div className="p-4 rounded-xl bg-mocha-900 border border-lavender/50 text-xs text-lavender flex items-start gap-3 shadow-md">
                <AlertTriangle className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm">Job Validation / Server Notice:</span>
                  <span className="text-silver/90 mt-1 block leading-relaxed">{formError}</span>
                </div>
              </div>
            )}

            {/* INLINE SUCCESS BANNER */}
            {formSuccess && (
              <div className="p-4 rounded-xl bg-mocha-900 border border-silver/40 text-xs text-silver flex items-start gap-3 shadow-md">
                <CheckCircle2 className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-lavender block text-sm">Job Saved in Database:</span>
                  <span className="text-silver/90 mt-1 block leading-relaxed">{formSuccess}</span>
                  <span className="text-[11px] text-lavender/80 mt-1 block">Navigating to Step 2: Bulk Resume Upload...</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-6">
              
              {/* Row 1: Title, Company, Department */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">1. Job Title *</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Machine Learning Engineer"
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">2. Company Name *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Enterprise Corp"
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">3. Department *</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering &amp; AI"
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Location, Employment Type, Experience, Education */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">4. Job Location *</label>
                  <input
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA (Hybrid)"
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">5. Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">6. Required Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={requiredExperience}
                    onChange={(e) => setRequiredExperience(parseFloat(e.target.value) || 0)}
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">7. Education Qualification</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                  >
                    <option value="High School">High School</option>
                    <option value="Associate Degree">Associate Degree</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="PhD / Doctorate">PhD / Doctorate</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Mandatory & Preferred Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">
                    8. Mandatory Skills (Comma-separated) *
                  </label>
                  <input
                    type="text"
                    value={mandatorySkillsInput}
                    onChange={(e) => setMandatorySkillsInput(e.target.value)}
                    placeholder="Python, FastAPI, SQL, Machine Learning"
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                  />
                  <span className="text-[11px] text-silver/60 mt-1 block">
                    Candidate will be flagged with deficit if any mandatory skill is absent.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">
                    9. Preferred Skills (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={preferredSkillsInput}
                    onChange={(e) => setPreferredSkillsInput(e.target.value)}
                    placeholder="Docker, Kubernetes, AWS, PyTorch"
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                  />
                  <span className="text-[11px] text-silver/60 mt-1 block">
                    Bonus competencies contributing 30% to technical subscore.
                  </span>
                </div>
              </div>

              {/* Row 4: Complete Job Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-silver">10. Complete Job Description *</label>
                  <button
                    type="button"
                    onClick={handleExtractFromDescription}
                    disabled={isExtractingRequirements}
                    className="text-xs text-lavender hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <span>{isExtractingRequirements ? 'Extracting Requirements...' : 'Auto-Extract Requirements with AI'}</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste complete job description, responsibilities, technical stacks, domain background, and minimum qualifications here..."
                  className="w-full bg-mocha-900 border border-silver/20 rounded-lg p-3 text-xs text-silver focus:outline-none focus:border-lavender"
                  required
                />
              </div>

              {/* Row 5: Vacancies & Application Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">11. Number of Vacancies</label>
                  <input
                    type="number"
                    min="1"
                    value={vacancies}
                    onChange={(e) => setVacancies(parseInt(e.target.value) || 1)}
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-silver block mb-1.5">12. Application Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3.5 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-silver/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-silver/60">
                  Saves job entity to database, generates unique Job ID, and unlocks Step 2.
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingCampaign}
                  className="btn-primary py-3.5 px-8 text-xs shadow-md font-bold inline-flex items-center gap-2"
                >
                  <span>{isSubmittingCampaign ? 'Creating Job in Database...' : 'Create Job & Continue'}</span>
                  <ArrowRight className="w-4 h-4 text-mocha-950" />
                </button>
              </div>

            </form>
          </div>
        )}

        {/* =========================================================================
            STEP 2 – BULK RESUME UPLOAD (500+ Resumes, 10GB+ Scale, Chunked Upload)
           ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Active Job Summary Header */}
            <div className="mocha-card p-6 border-silver/20 bg-mocha-900/60">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-silver/10 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-mocha-800 border border-silver/20 text-[11px] font-semibold text-lavender mb-1">
                    Job ID: {activeJobCodeDisplay}
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-silver">
                    {selectedCampaign?.title || jobTitle}
                  </h2>
                  <p className="text-xs text-lavender font-medium mt-0.5">
                    {selectedCampaign?.company_name || companyName} • {selectedCampaign?.department || department} • {selectedCampaign?.location || jobLocation}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-silver/60 block">Open Positions</span>
                  <span className="font-serif font-bold text-silver text-sm">{selectedCampaign?.vacancies || vacancies} Vacancies</span>
                </div>
              </div>
              <div className="pt-3 text-xs text-silver/70">
                <span className="font-semibold text-silver block mb-1">Job Description Summary:</span>
                <p className="line-clamp-2 leading-relaxed">
                  {selectedCampaign?.job_description || jobDescription}
                </p>
              </div>
            </div>

            {/* Upload Zone Card */}
            <div className="mocha-card p-8 space-y-6">
              <div className="border-b border-silver/10 pb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-mocha-900 border border-silver/15 text-[11px] font-semibold text-lavender mb-2 uppercase tracking-wider">
                  <span>Step 02 / 05 &bull; Bulk Resume Ingestion</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-silver">
                  Large-Scale Bulk Resume Ingestion
                </h3>
                <p className="text-xs text-silver/70 mt-1">
                  Upload 500+ PDF or DOCX resumes (up to 10GB aggregate capacity). Streaming chunks and background worker ingestion ensure memory stability.
                </p>
              </div>

              {/* Drag & Drop Area */}
              <div className="border-2 border-dashed border-silver/20 hover:border-lavender rounded-2xl p-10 text-center bg-mocha-900/60 transition-colors">
                <UploadCloud className="w-14 h-14 text-lavender mx-auto mb-3" />
                <h4 className="font-serif text-lg font-bold text-silver mb-1">
                  Drag and Drop Resume Files or Folder Here
                </h4>
                <p className="text-xs text-silver/60 mb-6 max-w-lg mx-auto">
                  Supports bulk PDF and DOCX files. Files are streamed directly to storage in 64KB buffers to avoid application memory exhaustion.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {/* File Selector */}
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.txt"
                    ref={fileInputRef}
                    onChange={(e) => handleFilesChosen(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary text-xs py-2.5 px-5 shadow-sm inline-flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Select Resume Files</span>
                  </button>

                  {/* Folder Selector */}
                  <input
                    type="file"
                    multiple
                    // @ts-ignore
                    webkitdirectory=""
                    // @ts-ignore
                    directory=""
                    ref={folderInputRef}
                    onChange={(e) => handleFilesChosen(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="btn-secondary text-xs py-2.5 px-5 shadow-sm inline-flex items-center gap-2"
                  >
                    <FolderUp className="w-3.5 h-3.5 text-lavender" />
                    <span>Upload Entire Folder</span>
                  </button>
                </div>

                {uploadError && (
                  <div className="mt-4 p-3 rounded-lg bg-mocha-850 border border-lavender/30 text-xs text-lavender max-w-md mx-auto">
                    {uploadError}
                  </div>
                )}

                {duplicateCount > 0 && (
                  <div className="mt-2 text-[11px] text-silver/60">
                    Detected and filtered {duplicateCount} duplicate file(s) automatically.
                  </div>
                )}
              </div>

              {/* Staged Files Overview & Actions */}
              {selectedFiles.length > 0 && (
                <div className="p-5 rounded-xl bg-mocha-900 border border-silver/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-silver block">
                      {selectedFiles.length} Resumes Staged for Ingestion
                    </span>
                    <span className="text-[11px] text-silver/60 mt-0.5 block">
                      Aggregate Payload: {totalUploadSizeFormatted} MB • Ready for chunked streaming
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedFiles([])}
                      className="text-xs text-silver/60 hover:text-silver px-3 py-2"
                    >
                      Clear Selection
                    </button>
                    <button
                      type="button"
                      onClick={handleStartScreeningUpload}
                      disabled={isUploading}
                      className="btn-primary text-xs py-2.5 px-6 shadow-sm font-bold inline-flex items-center gap-2"
                    >
                      <span>{isUploading ? 'Streaming to Workers...' : 'Start Resume Analysis'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-mocha-950" />
                    </button>
                  </div>
                </div>
              )}

              {/* If no files selected yet, allow jump if resumes already uploaded */}
              {selectedFiles.length === 0 && selectedCampaign && selectedCampaign.total_resumes > 0 && (
                <div className="p-4 rounded-xl bg-mocha-900/60 border border-silver/15 flex items-center justify-between">
                  <span className="text-xs text-silver/70">
                    This job already has {selectedCampaign.total_resumes} resumes in the database.
                  </span>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                  >
                    <span>Proceed to AI Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5 text-lavender" />
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3 – AI RESUME ANALYSIS (Extraction, ML Scoring & Queue Telemetry)
           ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header Card */}
            <div className="mocha-card p-6 border-silver/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-mocha-900 border border-silver/15 text-[11px] font-semibold text-lavender mb-2 uppercase tracking-wider">
                  <span>Step 03 / 05 &bull; AI Resume Extraction &amp; ML Matching</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-silver">
                  Screening Pipeline: {selectedCampaign?.title || 'Active Job'}
                </h3>
                <p className="text-xs text-silver/70 mt-1">
                  Extracting candidate personal details, education, technical skills, experience chronology, projects, and certifications.
                </p>
              </div>

              <button
                onClick={() => setCurrentStep(4)}
                className="btn-primary text-xs py-2.5 px-6 font-bold shadow-md inline-flex items-center gap-2 shrink-0"
              >
                <Layers className="w-4 h-4 text-mocha-950" />
                <span>View Candidate Rankings</span>
                <ArrowRight className="w-4 h-4 text-mocha-950" />
              </button>
            </div>

            {/* Pipeline Extraction Features Matrix */}
            <div className="mocha-card p-6 border-silver/15">
              <span className="text-xs font-bold text-silver block mb-3 uppercase tracking-wider">
                10-Point Intelligent Extraction Engine
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {[
                  '1. Candidate Info',
                  '2. Education & Degree',
                  '3. Technical Skills',
                  '4. Work Experience',
                  '5. Projects & Internships',
                  '6. Certifications',
                  '7. Requirement Matching',
                  '8. ML Semantic Cosine',
                  '9. TF-IDF Skill Overlap',
                  '10. Database Persistence'
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-mocha-900 border border-silver/10 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-lavender shrink-0" />
                    <span className="text-[11px] text-silver/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-Time Telemetry Counters */}
            {progressData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="mocha-card p-4 text-center">
                  <div className="text-[10px] text-silver/60 uppercase tracking-wider mb-1">Total Files</div>
                  <div className="font-serif text-xl font-bold text-silver">{progressData.total_files}</div>
                </div>
                <div className="mocha-card p-4 text-center">
                  <div className="text-[10px] text-silver/60 uppercase tracking-wider mb-1">Queue Status</div>
                  <div className="font-serif text-sm font-bold text-lavender uppercase">{progressData.status}</div>
                </div>
                <div className="mocha-card p-4 text-center">
                  <div className="text-[10px] text-silver/60 uppercase tracking-wider mb-1">Pending</div>
                  <div className="font-serif text-xl font-bold text-silver/80">{progressData.pending_files}</div>
                </div>
                <div className="mocha-card p-4 text-center">
                  <div className="text-[10px] text-silver/60 uppercase tracking-wider mb-1">Processing</div>
                  <div className="font-serif text-xl font-bold text-lavender">
                    {progressData.status === 'processing' ? progressData.pending_files : 0}
                  </div>
                </div>
                <div className="mocha-card p-4 text-center">
                  <div className="text-[10px] text-silver/60 uppercase tracking-wider mb-1">Completed</div>
                  <div className="font-serif text-xl font-bold text-silver">{progressData.processed_files}</div>
                </div>
                <div className="mocha-card p-4 text-center">
                  <div className="text-[10px] text-silver/60 uppercase tracking-wider mb-1">Failed</div>
                  <div className="font-serif text-xl font-bold text-lavender">{progressData.failed_files}</div>
                </div>
                <div className="mocha-card p-4 text-center">
                  <div className="text-[10px] text-silver/60 uppercase tracking-wider mb-1">Progress</div>
                  <div className="font-serif text-xl font-bold text-lavender">{progressData.progress_percentage}%</div>
                </div>
              </div>
            )}

            {/* Overall Animated Progress Bar */}
            {progressData && (
              <div className="mocha-card p-6 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-silver">Asynchronous Processing Progress</span>
                  <span className="font-mono text-lavender font-bold">{progressData.progress_percentage}% Completed</span>
                </div>
                <div className="w-full h-3 bg-mocha-900 rounded-full overflow-hidden p-0.5 border border-silver/15">
                  <div
                    className="h-full bg-lavender rounded-full transition-all duration-500"
                    style={{ width: `${progressData.progress_percentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-silver/60">
                  <span>Background workers parsing text, extracting skills, &amp; computing hybrid cosine scores</span>
                  <span>Polling updates automatically</span>
                </div>
              </div>
            )}

            {/* Per-Resume Processing Logs Table */}
            {progressData && progressData.logs.length > 0 && (
              <div className="mocha-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-base font-bold text-silver">
                    Individual File Ingestion Telemetry
                  </h4>
                  <button
                    onClick={fetchProgress}
                    className="text-xs text-lavender hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-silver/15 text-silver/60 uppercase tracking-wider">
                        <th className="pb-2">Filename</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Pipeline Stage</th>
                        <th className="pb-2">Size</th>
                        <th className="pb-2">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-silver/10">
                      {progressData.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-mocha-850/30">
                          <td className="py-2.5 font-medium text-silver max-w-xs truncate">{log.filename}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              log.status === 'success' ? 'bg-lavender/20 text-lavender' :
                              log.status === 'processing' ? 'bg-mocha-800 text-silver' :
                              log.status === 'failed' ? 'bg-mocha-900 border border-lavender/40 text-lavender' :
                              'bg-mocha-850 text-silver/60'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-silver/80 uppercase text-[10px]">{log.stage}</td>
                          <td className="py-2.5 text-silver/60">{(log.file_size_bytes / 1024).toFixed(1)} KB</td>
                          <td className="py-2.5 text-silver/70 max-w-sm truncate">{log.message || 'Queued'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Advance to Step 4 button banner */}
            <div className="p-6 rounded-2xl bg-mocha-900 border border-silver/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="font-serif font-bold text-silver text-base block">Ready to View Candidate Rankings</span>
                <span className="text-xs text-silver/70 mt-0.5 block">View ranked candidates evaluated by our hybrid ML ranking model.</span>
              </div>
              <button
                onClick={() => setCurrentStep(4)}
                className="btn-primary py-3 px-8 text-xs font-bold inline-flex items-center gap-2"
              >
                <span>View Candidate Rankings</span>
                <ArrowRight className="w-4 h-4 text-mocha-950" />
              </button>
            </div>

          </div>
        )}

        {/* =========================================================================
            STEP 4 – CANDIDATE RANKING (Descending Order, Search, Filter, Sort)
           ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Toolbar */}
            <div className="mocha-card p-6 border-silver/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-mocha-900 border border-silver/15 text-[11px] font-semibold text-lavender mb-2 uppercase tracking-wider">
                  <span>Step 04 / 05 &bull; Candidate Leaderboard</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-silver">
                  Ranked Candidates ({rankingTotal})
                </h3>
                <p className="text-xs text-silver/70 mt-1">
                  Sorted in descending order of actual match score computed via hybrid NLP &amp; embeddings.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={rankings.length === 0}
                  className="btn-secondary text-xs py-2.5 px-4 inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-lavender" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mocha-card p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-silver/50 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={rankingSearch}
                    onChange={(e) => {
                      setRankingSearch(e.target.value);
                      setRankingPage(1);
                    }}
                    placeholder="Search candidate name or email..."
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg pl-9 pr-3 py-2 text-xs text-silver focus:outline-none focus:border-lavender"
                  />
                </div>

                {/* Experience Filter */}
                <div>
                  <select
                    value={experienceFilter}
                    onChange={(e) => {
                      setExperienceFilter(e.target.value);
                      setRankingPage(1);
                    }}
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3 py-2 text-xs text-silver focus:outline-none focus:border-lavender"
                  >
                    <option value="all">Experience: All Durations</option>
                    <option value="junior">Junior (&lt; 2 Years)</option>
                    <option value="mid">Mid-Level (2 - 5 Years)</option>
                    <option value="senior">Senior (5+ Years)</option>
                  </select>
                </div>

                {/* Mandatory Skills Filter */}
                <div>
                  <select
                    value={mandatoryFilter}
                    onChange={(e) => {
                      setMandatoryFilter(e.target.value as any);
                      setRankingPage(1);
                    }}
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3 py-2 text-xs text-silver focus:outline-none focus:border-lavender"
                  >
                    <option value="all">Mandatory Skills: All</option>
                    <option value="all_met">100% Mandatory Skills Met</option>
                    <option value="has_deficit">Has Skill Deficit</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setRankingPage(1);
                    }}
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3 py-2 text-xs text-silver focus:outline-none focus:border-lavender"
                  >
                    <option value="all">Status: All Pipeline Stages</option>
                    <option value="AI Screened">AI Screened</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Not Selected">Not Selected</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value);
                      setRankingPage(1);
                    }}
                    className="w-full bg-mocha-900 border border-silver/20 rounded-lg px-3 py-2 text-xs text-silver focus:outline-none focus:border-lavender"
                  >
                    <option value="score_desc">Sort: Highest Match Score</option>
                    <option value="score_asc">Sort: Lowest Match Score</option>
                    <option value="exp_desc">Sort: Most Experience</option>
                    <option value="name_asc">Sort: Alphabetical (A-Z)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Candidate Table */}
            <div className="mocha-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-silver/15 text-silver/60 uppercase tracking-wider bg-mocha-900/60">
                      <th className="py-3.5 pl-4">Rank</th>
                      <th className="py-3.5">Candidate</th>
                      <th className="py-3.5">Compatibility</th>
                      <th className="py-3.5">Experience</th>
                      <th className="py-3.5">Matched Skills</th>
                      <th className="py-3.5">Mandatory Status</th>
                      <th className="py-3.5">Status</th>
                      <th className="py-3.5 pr-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-silver/10">
                    {rankings.map((cand) => (
                      <tr
                        key={cand.candidate_id}
                        className="hover:bg-mocha-850/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedCandidateId(cand.candidate_id);
                          setCurrentStep(5);
                        }}
                      >
                        <td className="py-3.5 pl-4 font-serif font-bold text-silver">
                          #{cand.rank}
                        </td>
                        <td className="py-3.5">
                          <div className="font-serif font-bold text-silver text-sm group-hover:text-lavender transition-colors">
                            {cand.candidate_name}
                          </div>
                          <div className="text-[11px] text-silver/60">{cand.email}</div>
                        </td>
                        <td className="py-3.5">
                          {/* Clean circular gauge without overlapping text + bold percentage */}
                          <div className="flex items-center gap-2.5">
                            <CircularProgress score={cand.overall_score} size={32} strokeWidth={3.5} showText={false} />
                            <span className="font-serif font-bold text-silver text-sm">{cand.overall_score.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-silver/90">
                          {cand.experience_years} Years
                        </td>
                        <td className="py-3.5 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {cand.matched_skills.slice(0, 3).map((sk, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-mocha-800 border border-silver/15 text-[10px] text-silver/80"
                              >
                                {sk}
                              </span>
                            ))}
                            {cand.matched_skills.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] text-silver/50">
                                +{cand.matched_skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5">
                          {cand.has_mandatory_deficit ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-mocha-900 border border-lavender/30 text-[10px] text-lavender">
                              <AlertTriangle className="w-3 h-3 text-lavender" />
                              <span>{cand.missing_mandatory.length} Missing</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-mocha-800 text-[10px] text-silver/80">
                              <CheckCircle2 className="w-3 h-3 text-lavender" />
                              <span>100% Met</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            cand.application_status === 'Shortlisted' ? 'bg-lavender/25 text-lavender border border-lavender/40' :
                            cand.application_status === 'Interview Scheduled' ? 'bg-mocha-800 text-silver border border-silver/25' :
                            cand.application_status === 'Not Selected' ? 'bg-mocha-900 text-silver/50 border border-silver/15' :
                            'bg-mocha-850 text-silver/80 border border-silver/20'
                          }`}>
                            {cand.application_status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidateId(cand.candidate_id);
                              setCurrentStep(5);
                            }}
                            className="btn-secondary text-[11px] py-1.5 px-3 inline-flex items-center gap-1"
                          >
                            <span>Dossier</span>
                            <ArrowRight className="w-3 h-3 text-lavender" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rankings.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-silver/60">
                          No candidates found matching the active filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {rankingTotal > 25 && (
                <div className="p-4 border-t border-silver/15 flex items-center justify-between text-xs">
                  <span className="text-silver/60">
                    Showing {(rankingPage - 1) * 25 + 1} to {Math.min(rankingPage * 25, rankingTotal)} of {rankingTotal} ranked candidates
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRankingPage(prev => Math.max(prev - 1, 1))}
                      disabled={rankingPage === 1}
                      className="p-1.5 rounded-lg border border-silver/20 disabled:opacity-30 hover:bg-mocha-850"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-mono text-silver">{rankingPage}</span>
                    <button
                      onClick={() => setRankingPage(prev => prev + 1)}
                      disabled={rankingPage * 25 >= rankingTotal}
                      className="p-1.5 rounded-lg border border-silver/20 disabled:opacity-30 hover:bg-mocha-850"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================================================
            STEP 5 – CANDIDATE DETAILS (Dossier, Extracted Profile, PDF Viewer, Notes)
           ========================================================================= */}
        {currentStep === 5 && selectedCandidateId && selectedCampaignId && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(4)}
                className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4 text-lavender" />
                <span>Back to Candidate Rankings</span>
              </button>

              <span className="text-xs text-silver/60 font-mono">
                Job ID: {activeJobCodeDisplay}
              </span>
            </div>

            {/* Embedded Candidate Dossier Component */}
            <CandidateDossierModal
              candidateId={selectedCandidateId}
              campaignId={selectedCampaignId}
              onClose={() => setCurrentStep(4)}
              onActionSuccess={() => {
                fetchRankings();
              }}
            />

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

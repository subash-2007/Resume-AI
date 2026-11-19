import React, { useState, useEffect } from 'react';
import {
  FileSearch,
  Cpu,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  Layers,
  FileText
} from 'lucide-react';
import { Header } from '../../components/Header';
import { CircularProgress } from '../../components/CircularProgress';
import {
  apiGetMyResumes, apiGetJobs, apiAnalyzeMatch,
  apiCandidateSelfMatch, getReportDownloadUrl
} from '../../services/api';
import { Resume, Job, AnalysisResult } from '../../types';

export const AnalyzeResume: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | ''>('');
  
  // Mode: 'existing' or 'custom'
  const [mode, setMode] = useState<'existing' | 'custom'>('existing');
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const [resRes, jobRes] = await Promise.all([
          apiGetMyResumes(),
          apiGetJobs({ status_filter: 'active' })
        ]);
        setResumes(resRes.data);
        if (resRes.data.length > 0) setSelectedResumeId(resRes.data[0].id);
        setJobs(jobRes.data);
        if (jobRes.data.length > 0) setSelectedJobId(jobRes.data[0].id);
      } catch (e) {
        console.error(e);
      }
    };
    initData();
  }, []);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setErrorMessage('Please select a resume to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    try {
      if (mode === 'existing') {
        if (!selectedJobId) {
          setErrorMessage('Please select an active job opening.');
          setIsAnalyzing(false);
          return;
        }
        const res = await apiAnalyzeMatch(Number(selectedJobId), Number(selectedResumeId));
        setAnalysisResult(res.data);
      } else {
        if (!customTitle.trim() || !customDescription.trim()) {
          setErrorMessage('Please enter both a Job Title and Description.');
          setIsAnalyzing(false);
          return;
        }
        const res = await apiCandidateSelfMatch({
          job_title: customTitle,
          job_description: customDescription,
          resume_id: Number(selectedResumeId)
        });
        setAnalysisResult(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || 'Analysis could not be computed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Resume &amp; Job Compatibility Analysis"
        subtitle="Evaluate your resume against target roles using centralized NLP, TF-IDF, and semantic embeddings."
      />

      <main className="p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Analysis Configuration Form */}
        <div className="mocha-card p-6">
          <form onSubmit={handleRunAnalysis} className="space-y-6">
            
            {/* Resume Selection */}
            <div>
              <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1.5">
                1. Select Resume Document
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                className="mocha-input w-full text-xs"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.filename} (Uploaded: {new Date(r.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Job Opening Mode Switch */}
            <div>
              <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-2">
                2. Select Evaluation Mode
              </label>
              <div className="grid grid-cols-2 p-1 bg-mocha-850 rounded-lg border border-silver/15 max-w-md">
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  className={`py-2 text-xs font-semibold rounded-md transition-all ${
                    mode === 'existing'
                      ? 'bg-lavender text-mocha-950 shadow-sm'
                      : 'text-silver/70 hover:text-lavender'
                  }`}
                >
                  Select Existing Opening
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`py-2 text-xs font-semibold rounded-md transition-all ${
                    mode === 'custom'
                      ? 'bg-lavender text-mocha-950 shadow-sm'
                      : 'text-silver/70 hover:text-lavender'
                  }`}
                >
                  Paste Custom Job Description
                </button>
              </div>
            </div>

            {mode === 'existing' ? (
              <div>
                <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1.5">
                  Target Job Opening
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(Number(e.target.value))}
                  className="mocha-input w-full text-xs"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.department}) • Exp: {j.required_experience} yrs
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                    Target Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Machine Learning Engineer"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="mocha-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                    Job Description *
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Paste the full job posting requirements and responsibilities..."
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="mocha-input w-full text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-mocha-800 border border-lavender/30 text-xs text-lavender flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-lavender" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="btn-primary text-xs py-2.5 px-6 shadow-sm"
              >
                <Cpu className="w-4 h-4" />
                <span>{isAnalyzing ? 'Running Hybrid Matching Engine...' : 'Run Compatibility Analysis'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

          </form>
        </div>

        {/* Live Analysis Result Dossier */}
        {analysisResult && (
          <div className="mocha-card p-8 space-y-6 border border-lavender/30">
            
            {/* Header with Circular Score */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-silver/10 pb-6">
              <div>
                <span className="badge-lavender text-xs uppercase font-semibold">
                  Explainable Evaluation Dossier
                </span>
                <h3 className="font-serif text-2xl font-bold text-silver mt-1">
                  Overall Compatibility: {analysisResult.overall_score}%
                </h3>
                <p className="text-xs text-silver/70 mt-1 max-w-lg">
                  Computed using SentenceTransformers semantic similarity, TF-IDF keyword overlap, and standardized skill taxonomy coverage.
                </p>
              </div>

              <div className="p-4 bg-mocha-850 rounded-xl border border-silver/15">
                <CircularProgress
                  score={analysisResult.overall_score}
                  size={120}
                  strokeWidth={9}
                  label="Match"
                />
              </div>
            </div>

            {/* Mandatory Deficit Warning If Applicable */}
            {analysisResult.has_mandatory_deficit && (
              <div className="p-4 rounded-xl bg-mocha-850 border border-lavender/40 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-sm font-bold text-silver">
                    Mandatory Skill Deficit Alert
                  </h4>
                  <p className="text-xs text-silver/80 mt-1 leading-relaxed">
                    This position requires the following mandatory competencies which were not detected in your resume:
                    <span className="text-lavender font-bold block mt-1">
                      {analysisResult.missing_mandatory_skills.join(', ')}
                    </span>
                    Even with a high overall similarity score, missing mandatory requirements require human recruiter clearance.
                  </p>
                </div>
              </div>
            )}

            {/* 6-Dimensional Component Scores */}
            <div>
              <h4 className="text-xs uppercase font-semibold text-silver/70 tracking-wider mb-3">
                Individual Score Dimensions
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <span className="text-[10px] text-silver/60 block">Skill Match (35%)</span>
                  <span className="text-lg font-bold text-lavender mt-1 block">{analysisResult.skill_score}%</span>
                </div>
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <span className="text-[10px] text-silver/60 block">Semantic Sim (25%)</span>
                  <span className="text-lg font-bold text-silver mt-1 block">{analysisResult.semantic_score}%</span>
                </div>
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <span className="text-[10px] text-silver/60 block">Experience (15%)</span>
                  <span className="text-lg font-bold text-lavender mt-1 block">{analysisResult.experience_score}%</span>
                </div>
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <span className="text-[10px] text-silver/60 block">Education (10%)</span>
                  <span className="text-lg font-bold text-silver mt-1 block">{analysisResult.education_score}%</span>
                </div>
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <span className="text-[10px] text-silver/60 block">Tooling (10%)</span>
                  <span className="text-lg font-bold text-lavender mt-1 block">{analysisResult.technology_score}%</span>
                </div>
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <span className="text-[10px] text-silver/60 block">Domain (5%)</span>
                  <span className="text-lg font-bold text-silver mt-1 block">{analysisResult.domain_score}%</span>
                </div>
              </div>
            </div>

            {/* Matched vs Missing Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 bg-mocha-850 rounded-lg border border-silver/15">
                <span className="text-xs uppercase font-semibold text-silver/80 tracking-wider flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-lavender" />
                  <span>Matched Skills ({analysisResult.matched_skills.length})</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.matched_skills.map((s, i) => (
                    <span key={i} className="badge-lavender text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-mocha-850 rounded-lg border border-silver/15">
                <span className="text-xs uppercase font-semibold text-silver/80 tracking-wider flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-4 h-4 text-lavender" />
                  <span>Missing Skills ({analysisResult.missing_mandatory_skills.length + analysisResult.missing_preferred_skills.length})</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.missing_mandatory_skills.map((s, i) => (
                    <span key={`mand-${i}`} className="badge-mocha text-xs text-lavender font-bold border border-lavender/30">
                      {s} (Mandatory)
                    </span>
                  ))}
                  {analysisResult.missing_preferred_skills.map((s, i) => (
                    <span key={`pref-${i}`} className="badge-silver text-xs">
                      {s} (Preferred)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Explanation Evidence */}
            <div className="p-4 bg-mocha-850 rounded-lg border border-silver/10 text-xs text-silver/80 leading-relaxed font-sans">
              <span className="font-serif font-bold text-silver block mb-1">Audit Trail &amp; Evidence:</span>
              {analysisResult.explanation}
            </div>

            {/* PDF Report Export Button */}
            <div className="flex justify-end pt-2">
              <a
                href={getReportDownloadUrl(analysisResult.id)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download ReportLab PDF Dossier</span>
              </a>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};


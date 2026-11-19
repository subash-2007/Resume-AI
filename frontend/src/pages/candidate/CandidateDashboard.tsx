import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  UploadCloud,
  Layers,
  Award,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase
} from 'lucide-react';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { CircularProgress } from '../../components/CircularProgress';
import { apiGetMyResumes, apiGetCandidateHistory } from '../../services/api';
import { Resume } from '../../types';

export const CandidateDashboard: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRes, histRes] = await Promise.all([
          apiGetMyResumes(),
          apiGetCandidateHistory()
        ]);
        setResumes(resRes.data);
        setHistory(histRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const latestAnalysis = history[0];
  const scores = history.map(h => h.overall_score);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0) : '0';

  const userSkills: string[] = resumes[0]?.parsed_data?.skills || [];

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Candidate Career Intelligence"
        subtitle="Audit your resume, identify skill gaps against market requirements, and track career compatibility."
      >
        <Link to="/candidate/analyze" className="btn-primary text-xs py-2 px-3.5 shadow-sm">
          <FileSearch className="w-3.5 h-3.5" />
          <span>New Resume Evaluation</span>
        </Link>
      </Header>

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Analyses"
            value={history.length}
            subtitle="Job Evaluations Run"
            icon={FileSearch}
            badge="Audited"
          />
          <StatCard
            title="Latest Match Score"
            value={latestAnalysis ? `${latestAnalysis.overall_score}%` : 'N/A'}
            subtitle={latestAnalysis ? latestAnalysis.job_title : 'No Evaluation Yet'}
            icon={Award}
            badge="Hybrid ML"
          />
          <StatCard
            title="Average Compatibility"
            value={scores.length > 0 ? `${avgScore}%` : 'N/A'}
            subtitle="Across Evaluated Positions"
            icon={TrendingUp}
            badge="Indexed"
          />
          <StatCard
            title="Active Resumes"
            value={resumes.length}
            subtitle="Parsed in System"
            icon={UploadCloud}
            badge={resumes.length > 0 ? "Uploaded" : "Pending"}
          />
        </div>

        {/* Hero Assessment Summary */}
        <div className="mocha-card p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mocha-800 border border-silver/15 text-xs text-lavender font-semibold">
              <Layers className="w-3.5 h-3.5 text-lavender" />
              <span>Centralized NLP &amp; Hybrid Scoring</span>
            </div>

            <h2 className="font-serif text-3xl font-bold text-silver">
              Your Professional Profile Readiness
            </h2>

            <p className="text-xs text-silver/75 leading-relaxed font-sans">
              ResumeAI evaluates your resume using deterministic skill taxonomy matching, TF-IDF keyword representation, and SentenceTransformer semantic embeddings. Missing mandatory requirements are flagged proactively so you can optimize your applications.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/candidate/upload" className="btn-secondary text-xs py-2 px-4">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload New Resume</span>
              </Link>
              <Link to="/candidate/skill-gaps" className="btn-primary text-xs py-2 px-4">
                <Layers className="w-3.5 h-3.5" />
                <span>View Skill Gap Remediation</span>
              </Link>
            </div>
          </div>

          {/* Animated Circular Match Indicator */}
          <div className="p-6 rounded-2xl bg-mocha-850 border border-silver/15 flex flex-col items-center">
            <CircularProgress
              score={latestAnalysis ? latestAnalysis.overall_score : 0}
              size={140}
              strokeWidth={10}
              label={latestAnalysis ? "Match" : "No Match"}
              sublabel={latestAnalysis ? latestAnalysis.job_title : "No evaluation recorded yet"}
            />
          </div>
        </div>

        {/* Dual Panels: Detected Skills & Recent Evaluations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Candidate Competency Matrix */}
          <div className="mocha-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-silver/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-silver">
                  Detected Competencies
                </h3>
                <p className="text-xs text-silver/60">
                  Skills extracted and standardized from your active resume.
                </p>
              </div>
              <span className="badge-lavender text-xs">{userSkills.length} Verified</span>
            </div>

            {userSkills.length === 0 ? (
              <div className="py-8 text-center text-silver/50 text-xs italic space-y-3">
                <UploadCloud className="w-8 h-8 text-lavender/40 mx-auto" />
                <p>No competencies detected yet. Upload your resume to extract skills automatically via PyMuPDF.</p>
                <Link to="/candidate/upload" className="btn-secondary text-xs py-1.5 px-3 inline-block">
                  Upload Resume
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userSkills.map((s, idx) => (
                  <span key={idx} className="badge-lavender text-xs py-1 px-2.5">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-silver/10 flex items-center justify-between text-xs text-silver/60">
              <span>Standardized via Global Skill Taxonomy</span>
              <Link to="/candidate/upload" className="text-lavender hover:underline font-medium">
                Update Resume &rarr;
              </Link>
            </div>
          </div>

          {/* Recent Evaluations History */}
          <div className="mocha-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-silver/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-silver">
                  Recent Job Compatibility Audits
                </h3>
                <p className="text-xs text-silver/60">
                  Evaluations computed against real job openings.
                </p>
              </div>
              <Link to="/candidate/history" className="text-xs text-lavender hover:underline font-medium">
                View All &rarr;
              </Link>
            </div>

            <div className="divide-y divide-silver/10">
              {history.length === 0 ? (
                <div className="py-8 text-center text-silver/60 text-xs space-y-3">
                  <FileSearch className="w-8 h-8 text-lavender/40 mx-auto" />
                  <p>No previous evaluations found. Evaluate your resume against open positions.</p>
                  <Link to="/candidate/analyze" className="btn-primary text-xs py-1.5 px-3 inline-block">
                    Evaluate Job Compatibility
                  </Link>
                </div>
              ) : (
                history.slice(0, 4).map((item, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-silver">
                        {item.job_title}
                      </h4>
                      <p className="text-xs text-silver/60">
                        {new Date(item.analyzed_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="badge-lavender font-bold text-xs">
                        {item.overall_score}% Match
                      </span>
                      <div className="text-[10px] text-silver/50 mt-1">
                        Skill: {item.skill_score}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Award,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  FileText,
  Filter,
  ShieldCheck,
  GitCompare,
  ArrowRight
} from 'lucide-react';
import { Header } from '../../components/Header';
import { apiGetJobs, apiGetJobRankings, getReportDownloadUrl } from '../../services/api';
import { Job, CandidateRanking } from '../../types';

export const CandidateRankingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('job_id');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [rankings, setRankings] = useState<CandidateRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await apiGetJobs({ status_filter: 'active' });
        setJobs(res.data);
        if (res.data.length > 0) {
          const targetId = initialJobId ? Number(initialJobId) : res.data[0].id;
          setSelectedJobId(targetId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [initialJobId]);

  useEffect(() => {
    if (!selectedJobId) return;
    const fetchRankings = async () => {
      setIsLoading(true);
      try {
        const res = await apiGetJobRankings(Number(selectedJobId));
        setRankings(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRankings();
  }, [selectedJobId]);

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Candidate Ranking Matrix"
        subtitle="Explainable candidate sorting driven by multi-factor hybrid scoring and mandatory requirement verification."
      >
        {selectedJobId && (
          <Link
            to={`/hr/compare?job_id=${selectedJobId}`}
            className="btn-secondary text-xs py-2 px-3 shadow-sm flex items-center gap-1.5"
          >
            <GitCompare className="w-3.5 h-3.5 text-lavender" />
            <span>Compare Candidates</span>
          </Link>
        )}
      </Header>

      <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Job Selector & Scoring Weights Banner */}
        <div className="mocha-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <label className="block text-[10px] font-semibold text-silver/60 uppercase tracking-wider mb-1.5">
              Select Job Position to Inspect Rankings
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
              className="mocha-input w-full md:w-96 text-xs"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          {selectedJob && (
            <div className="bg-mocha-850 p-3 rounded-lg border border-silver/10 text-xs text-silver/80 flex flex-wrap gap-4">
              <div>
                <span className="text-silver/50 block text-[10px]">Technical Skills</span>
                <span className="font-bold text-lavender">35%</span>
              </div>
              <div>
                <span className="text-silver/50 block text-[10px]">Semantic Similarity</span>
                <span className="font-bold text-lavender">25%</span>
              </div>
              <div>
                <span className="text-silver/50 block text-[10px]">Experience Duration</span>
                <span className="font-bold text-lavender">15%</span>
              </div>
              <div>
                <span className="text-silver/50 block text-[10px]">Education</span>
                <span className="font-bold text-lavender">10%</span>
              </div>
              <div>
                <span className="text-silver/50 block text-[10px]">Tools</span>
                <span className="font-bold text-lavender">10%</span>
              </div>
              <div>
                <span className="text-silver/50 block text-[10px]">Domain</span>
                <span className="font-bold text-lavender">5%</span>
              </div>
            </div>
          )}
        </div>

        {/* Explainability Governance Notice */}
        <div className="p-4 rounded-lg bg-mocha-900 border border-silver/20 flex items-start gap-3 text-xs text-silver/80">
          <ShieldCheck className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <b>Explainability Assurance:</b> Rankings are ordered by composite compatibility percentage. 
            However, <span className="text-lavender font-semibold">candidates with missing mandatory competencies are flagged with a prominent warning</span> to prevent high semantic scores from masking non-negotiable job requirements.
          </p>
        </div>

        {/* Rankings Table */}
        <div className="mocha-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-silver">
              <thead className="bg-mocha-850 text-silver/80 uppercase tracking-wider text-[10px] font-semibold border-b border-silver/15">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4 text-center">Overall Index</th>
                  <th className="py-3 px-4 text-center">Skill (35%)</th>
                  <th className="py-3 px-4 text-center">Semantic (25%)</th>
                  <th className="py-3 px-4 text-center">Exp (15%)</th>
                  <th className="py-3 px-4 text-center">Edu (10%)</th>
                  <th className="py-3 px-4 text-center">Deficit Check</th>
                  <th className="py-3 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/10">
                {rankings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-silver/60">
                      <Award className="w-8 h-8 text-lavender/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-silver">No Candidate Rankings Available</p>
                      <p className="text-xs text-silver/50 mt-0.5">Screen candidates against this role to generate explainable hybrid ML rankings.</p>
                    </td>
                  </tr>
                ) : (
                  rankings.map((cand, idx) => (
                    <tr
                      key={cand.candidate_id}
                      className={`hover:bg-mocha-850/50 transition-colors ${
                        idx === 0 ? 'bg-mocha-850/30 font-medium' : ''
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="py-3.5 px-4 text-center font-serif text-sm font-bold text-silver">
                        #{idx + 1}
                      </td>

                      {/* Candidate */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-silver text-sm">
                          {cand.candidate_name}
                        </div>
                        <div className="text-[11px] text-silver/60">
                          {cand.current_title} • {cand.total_years_experience} yrs
                        </div>
                      </td>

                      {/* Overall Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-lavender/20 text-lavender border border-lavender/30">
                          {cand.overall_score}%
                        </span>
                      </td>

                      {/* Technical Skill */}
                      <td className="py-3.5 px-4 text-center text-silver/90">
                        {cand.skill_score}%
                      </td>

                      {/* Semantic */}
                      <td className="py-3.5 px-4 text-center text-silver/90">
                        {cand.semantic_score}%
                      </td>

                      {/* Experience */}
                      <td className="py-3.5 px-4 text-center text-silver/90">
                        {cand.experience_score}%
                      </td>

                      {/* Education */}
                      <td className="py-3.5 px-4 text-center text-silver/90">
                        {cand.education_score}%
                      </td>

                      {/* Mandatory Deficit Flag */}
                      <td className="py-3.5 px-4 text-center">
                        {cand.has_mandatory_deficit ? (
                          <span className="badge-mocha text-[10px] text-lavender font-bold inline-flex items-center gap-1 border border-lavender/30">
                            <AlertTriangle className="w-3 h-3 text-lavender" />
                            <span>Missing ({cand.missing_mandatory_count})</span>
                          </span>
                        ) : (
                          <span className="badge-silver text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-lavender" />
                            <span>Complete</span>
                          </span>
                        )}
                      </td>

                      {/* Dossier Download URL */}
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={getReportDownloadUrl(cand.application_id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary text-[11px] py-1.5 px-3 inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF Dossier</span>
                        </a>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};


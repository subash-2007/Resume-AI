import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GitCompare,
  Briefcase,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Header } from '../../components/Header';
import { apiGetJobs, apiGetJobRankings, apiCompareCandidates } from '../../services/api';
import { Job, CandidateRanking } from '../../types';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

export const CandidateComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('job_id');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [rankings, setRankings] = useState<CandidateRanking[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Jobs
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

  // Fetch Candidates for Selected Job
  useEffect(() => {
    if (!selectedJobId) return;
    const fetchRankings = async () => {
      try {
        const res = await apiGetJobRankings(Number(selectedJobId));
        setRankings(res.data);
        // Pre-select top 2 candidates if available
        if (res.data.length >= 2) {
          setSelectedCandidateIds([res.data[0].candidate_id, res.data[1].candidate_id]);
        } else if (res.data.length === 1) {
          setSelectedCandidateIds([res.data[0].candidate_id]);
        } else {
          setSelectedCandidateIds([]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRankings();
  }, [selectedJobId]);

  // Trigger Multi-Candidate Comparison API
  useEffect(() => {
    if (!selectedJobId || selectedCandidateIds.length === 0) {
      setComparisonData(null);
      return;
    }

    const runComparison = async () => {
      try {
        const res = await apiCompareCandidates(Number(selectedJobId), selectedCandidateIds);
        setComparisonData(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    runComparison();
  }, [selectedJobId, selectedCandidateIds]);

  const toggleCandidateSelection = (id: number) => {
    if (selectedCandidateIds.includes(id)) {
      if (selectedCandidateIds.length > 1) {
        setSelectedCandidateIds(selectedCandidateIds.filter(cId => cId !== id));
      }
    } else {
      if (selectedCandidateIds.length < 3) {
        setSelectedCandidateIds([...selectedCandidateIds, id]);
      } else {
        alert('You can compare a maximum of 3 candidates simultaneously.');
      }
    }
  };

  const chartColors = ['#E6E0F0', '#E5E4E2', '#bd967c'];

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Multi-Candidate Dimensional Comparison"
        subtitle="Side-by-side radar and matrix analysis across skills, semantic similarity, and experience."
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Job & Candidate Selector */}
        <div className="mocha-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-silver">
                Target Opening &amp; Candidate Selection
              </h3>
              <p className="text-xs text-silver/60">
                Select 2 or 3 candidates from this position to compute side-by-side comparative analytics.
              </p>
            </div>

            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
              className="mocha-input text-xs w-full sm:w-80"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-silver/10 flex flex-wrap gap-2">
            {rankings.length === 0 ? (
              <p className="text-xs text-silver/50 italic py-2">
                No candidates screened for this position yet. Please upload candidate resumes in Resume Screening.
              </p>
            ) : (
              rankings.map((cand) => {
                const isSelected = selectedCandidateIds.includes(cand.candidate_id);
                return (
                  <button
                    key={cand.candidate_id}
                    onClick={() => toggleCandidateSelection(cand.candidate_id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-lavender text-mocha-950 font-bold border-lavender shadow-sm'
                        : 'bg-mocha-850 text-silver/80 border-silver/15 hover:border-lavender/50'
                    }`}
                  >
                    <span>{cand.candidate_name}</span>
                    <span className="text-[10px] opacity-80">({cand.overall_score}%)</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Empty state when no comparison candidates */}
        {(!comparisonData || comparisonData.candidates.length === 0) && (
          <div className="mocha-card p-12 text-center space-y-3">
            <GitCompare className="w-10 h-10 text-lavender/40 mx-auto" />
            <h4 className="font-serif text-base font-bold text-silver">No Candidate Comparison Selected</h4>
            <p className="text-xs text-silver/60 max-w-md mx-auto">
              Select at least 2 candidates above to render the multi-dimensional radar vector overlay and side-by-side competency matrix.
            </p>
          </div>
        )}

        {/* Comparison Radar & Bar Visualization */}
        {comparisonData && comparisonData.candidates.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Radar Chart */}
            <div className="mocha-card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg font-bold text-silver">
                  Competency Vector Overlay
                </h3>
                <span className="badge-lavender text-xs">Radar Analysis</span>
              </div>
              <p className="text-xs text-silver/60 mb-4">
                Six-dimensional profile alignment mapped across evaluated candidates.
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={comparisonData.radar_data}>
                    <PolarGrid stroke="#583e2d" />
                    <PolarAngleAxis dataKey="dimension" stroke="#E5E4E2" tick={{ fill: '#E5E4E2', fontSize: 11 }} />
                    <PolarRadiusAxis stroke="#6F4E37" angle={30} domain={[0, 100]} />
                    {comparisonData.candidates.map((c: any, idx: number) => (
                      <Radar
                        key={c.candidate_id}
                        name={c.candidate_name}
                        dataKey={c.candidate_name}
                        stroke={chartColors[idx % chartColors.length]}
                        fill={chartColors[idx % chartColors.length]}
                        fillOpacity={0.25}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#E5E4E2' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score Comparison Bars */}
            <div className="mocha-card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg font-bold text-silver">
                  Dimensional Subscores
                </h3>
                <span className="badge-silver text-xs">Metric Breakdown</span>
              </div>
              <p className="text-xs text-silver/60 mb-4">
                Direct component comparisons across verified qualifications.
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData.radar_data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#463124" />
                    <XAxis dataKey="dimension" stroke="#E5E4E2" fontSize={10} tick={{ fill: '#E5E4E2' }} />
                    <YAxis stroke="#E5E4E2" fontSize={11} domain={[0, 100]} tick={{ fill: '#E5E4E2' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2b1e16',
                        borderColor: '#E6E0F0',
                        borderRadius: '8px',
                        color: '#E5E4E2',
                        fontSize: '11px'
                      }}
                    />
                    {comparisonData.candidates.map((c: any, idx: number) => (
                      <Bar
                        key={c.candidate_id}
                        dataKey={c.candidate_name}
                        fill={chartColors[idx % chartColors.length]}
                        radius={[3, 3, 0, 0]}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#E5E4E2' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* Side-by-Side Detailed Breakdown Table */}
        {comparisonData && comparisonData.candidates.length > 0 && (
          <div className="mocha-card p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-silver border-b border-silver/10 pb-3">
              Side-by-Side Competency &amp; Deficit Audit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {comparisonData.candidates.map((c: any, idx: number) => (
                <div
                  key={c.candidate_id}
                  className="p-5 rounded-xl bg-mocha-850 border border-silver/15 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif text-base font-bold text-silver">
                        {c.candidate_name}
                      </h4>
                      <p className="text-xs text-silver/60">
                        {c.current_title} • {c.experience_years} yrs exp
                      </p>
                    </div>
                    <span className="text-xl font-bold font-sans text-lavender">
                      {c.scores.overall}%
                    </span>
                  </div>

                  {c.has_mandatory_deficit ? (
                    <div className="p-2.5 rounded-lg bg-mocha-800 border border-lavender/30 text-xs text-lavender flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-lavender" />
                      <span>Missing mandatory competency</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-mocha-800 border border-silver/20 text-xs text-silver flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-lavender" />
                      <span>All mandatory criteria verified</span>
                    </div>
                  )}

                  {/* Matched Skills */}
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-silver/60 tracking-wider block mb-1">
                      Matched Skills ({c.matched_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {c.matched_skills.map((s: string, sI: number) => (
                        <span key={sI} className="badge-lavender text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  {c.missing_mandatory.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-silver/60 tracking-wider block mb-1">
                        Missing Mandatory ({c.missing_mandatory.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {c.missing_mandatory.map((s: string, sI: number) => (
                          <span key={sI} className="badge-mocha text-[10px] text-lavender font-semibold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="pt-2 border-t border-silver/10 text-xs text-silver/70 leading-relaxed font-sans">
                    {c.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};


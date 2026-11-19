import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  FileCheck,
  Award,
  CalendarCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  UploadCloud
} from 'lucide-react';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { apiGetRecruitmentMetrics, apiGetJobs, apiGetCandidates } from '../../services/api';
import { RecruitmentMetrics, Job, Candidate } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

export const HRDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RecruitmentMetrics | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricRes, jobRes, candRes] = await Promise.all([
          apiGetRecruitmentMetrics(),
          apiGetJobs(),
          apiGetCandidates({ limit: 5 })
        ]);
        setMetrics(metricRes.data);
        setRecentJobs(jobRes.data.slice(0, 4));
        setRecentCandidates(candRes.data.items);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const COLOR_MOCHA = '#6F4E37';
  const COLOR_SILVER = '#E5E4E2';
  const COLOR_LAVENDER = '#E6E0F0';
  const COLOR_MOCHA_LIGHT = '#916b4f';

  const pipelineChartData = metrics ? Object.entries(metrics.pipeline_stages).map(([stage, count]) => ({
    stage,
    count
  })) : [];

  const hasAnalyses = (metrics?.resumes_analyzed ?? 0) > 0;

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Recruitment Intelligence Overview"
        subtitle="Live telemetry and candidate triage powered by centralized ML/NLP engine."
      >
        <div className="flex items-center gap-2">
          <Link to="/hr/screening" className="btn-secondary text-xs py-2 px-3 shadow-sm">
            <UploadCloud className="w-3.5 h-3.5 text-lavender" />
            <span>Screen Resumes</span>
          </Link>
          <Link to="/hr/jobs/create" className="btn-primary text-xs py-2 px-3.5 shadow-sm">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Create New Job</span>
          </Link>
        </div>
      </Header>

      <main className="p-8 space-y-8 max-w-7xl">
        
        {/* Real Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Active Jobs"
            value={metrics?.active_jobs ?? 0}
            subtitle="Verified in Database"
            icon={Briefcase}
            badge={metrics?.active_jobs ? "Live" : "Empty"}
          />
          <StatCard
            title="Total Candidates"
            value={metrics?.total_candidates ?? 0}
            subtitle="Ingested Resumes"
            icon={Users}
            badge={metrics?.total_candidates ? "Parsed" : "Empty"}
          />
          <StatCard
            title="Resumes Analyzed"
            value={metrics?.resumes_analyzed ?? 0}
            subtitle="ML Hybrid Evaluated"
            icon={FileCheck}
            badge="100% Real"
          />
          <StatCard
            title="Shortlisted"
            value={metrics?.shortlisted_candidates ?? 0}
            subtitle="Qualified Profiles"
            icon={Award}
            badge="Vetted"
          />
          <StatCard
            title="Interviews"
            value={metrics?.interviews_scheduled ?? 0}
            subtitle="Scheduled Pipeline"
            icon={CalendarCheck}
            badge="Upcoming"
          />
          <StatCard
            title="Pending Review"
            value={metrics?.pending_reviews ?? 0}
            subtitle="Awaiting Recruiter"
            icon={Clock}
            badge="Triage"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Pipeline Funnel */}
          <div className="mocha-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-silver">
                  Recruitment Pipeline Distribution
                </h3>
                <p className="text-xs text-silver/60">
                  Live candidate stage transitions across active hiring pipelines.
                </p>
              </div>
              <span className="badge-lavender text-xs">Real-Time</span>
            </div>

            {pipelineChartData.every(d => d.count === 0) ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-silver/50 text-xs italic space-y-2">
                <Users className="w-8 h-8 text-lavender/40" />
                <p>No candidates currently in pipeline. Ingest resumes via Resume Screening.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#463124" />
                    <XAxis
                      dataKey="stage"
                      stroke="#E5E4E2"
                      fontSize={10}
                      angle={-20}
                      textAnchor="end"
                      tick={{ fill: '#E5E4E2' }}
                    />
                    <YAxis stroke="#E5E4E2" fontSize={11} tick={{ fill: '#E5E4E2' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2b1e16',
                        borderColor: '#E6E0F0',
                        borderRadius: '8px',
                        color: '#E5E4E2',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill={COLOR_LAVENDER} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Match Score Distribution Pie Chart */}
          <div className="mocha-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg font-bold text-silver">
                  Compatibility Spread
                </h3>
                <span className="badge-silver text-xs">Hybrid ML</span>
              </div>
              <p className="text-xs text-silver/60 mb-4">
                Categorized distribution of overall compatibility scores.
              </p>

              {!hasAnalyses ? (
                <div className="h-44 flex flex-col items-center justify-center text-center text-silver/50 text-xs italic space-y-2">
                  <FileCheck className="w-8 h-8 text-lavender/40" />
                  <p>No compatibility analyses recorded yet.</p>
                </div>
              ) : (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics?.match_distribution || []}
                        dataKey="count"
                        nameKey="range"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {(metrics?.match_distribution || []).map((_, index) => {
                          const colors = [COLOR_MOCHA, COLOR_MOCHA_LIGHT, COLOR_SILVER, COLOR_LAVENDER];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#2b1e16" />;
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2b1e16',
                          borderColor: '#E6E0F0',
                          borderRadius: '8px',
                          color: '#E5E4E2',
                          fontSize: '11px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-silver/10 text-[11px]">
              {(metrics?.match_distribution || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-silver/80">
                  <span className={`w-2.5 h-2.5 rounded-full ${idx === 3 ? 'bg-lavender' : idx === 2 ? 'bg-silver' : idx === 1 ? 'bg-mocha-500' : 'bg-mocha'}`}></span>
                  <span className="truncate">{item.range}: <b>{item.count}</b></span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Recruitment Conversion Rates */}
        <div className="mocha-card p-6">
          <h3 className="font-serif text-lg font-bold text-silver mb-1">
            Recruitment Conversion Metrics
          </h3>
          <p className="text-xs text-silver/60 mb-6">
            Stage conversion ratios computed directly from application lifecycle records.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-mocha-850 rounded-lg border border-silver/10">
              <span className="text-xs text-silver/60 uppercase tracking-wider font-semibold">AI Screened Rate</span>
              <div className="text-2xl font-bold text-silver mt-1">{metrics?.conversion_rates.screening_rate ?? 0}%</div>
              <div className="w-full bg-mocha-950 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-lavender h-full rounded-full" style={{ width: `${metrics?.conversion_rates.screening_rate ?? 0}%` }}></div>
              </div>
            </div>

            <div className="p-4 bg-mocha-850 rounded-lg border border-silver/10">
              <span className="text-xs text-silver/60 uppercase tracking-wider font-semibold">Shortlist Conversion</span>
              <div className="text-2xl font-bold text-silver mt-1">{metrics?.conversion_rates.shortlist_rate ?? 0}%</div>
              <div className="w-full bg-mocha-950 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-silver h-full rounded-full" style={{ width: `${metrics?.conversion_rates.shortlist_rate ?? 0}%` }}></div>
              </div>
            </div>

            <div className="p-4 bg-mocha-850 rounded-lg border border-silver/10">
              <span className="text-xs text-silver/60 uppercase tracking-wider font-semibold">Interview Rate</span>
              <div className="text-2xl font-bold text-silver mt-1">{metrics?.conversion_rates.interview_rate ?? 0}%</div>
              <div className="w-full bg-mocha-950 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-lavender h-full rounded-full" style={{ width: `${metrics?.conversion_rates.interview_rate ?? 0}%` }}></div>
              </div>
            </div>

            <div className="p-4 bg-mocha-850 rounded-lg border border-silver/10">
              <span className="text-xs text-silver/60 uppercase tracking-wider font-semibold">Selection / Offer</span>
              <div className="text-2xl font-bold text-silver mt-1">{metrics?.conversion_rates.offer_rate ?? 0}%</div>
              <div className="w-full bg-mocha-950 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-silver h-full rounded-full" style={{ width: `${metrics?.conversion_rates.offer_rate ?? 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Tables: Open Jobs & Recent Candidates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Job Openings */}
          <div className="mocha-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-silver">
                Active Job Openings
              </h3>
              <Link to="/hr/jobs" className="text-xs text-lavender hover:underline font-medium flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="py-8 text-center text-silver/60 text-xs space-y-2">
                <Briefcase className="w-8 h-8 text-lavender/40 mx-auto" />
                <p>No job openings created yet. Define a vacancy specification to initialize screening.</p>
                <Link to="/hr/jobs/create" className="btn-primary text-xs py-1.5 px-3 inline-block shadow-sm">
                  Create First Opening
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-silver/10">
                {recentJobs.map((job) => (
                  <div key={job.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-silver hover:text-lavender transition-colors">
                        {job.title}
                      </h4>
                      <p className="text-xs text-silver/60 mt-0.5">
                        {job.department} • {job.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="badge-lavender text-[11px]">
                        {job.application_count ?? 0} Applicants
                      </span>
                      <div className="text-[10px] text-silver/50 mt-1">
                        Req: {job.required_experience} yrs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Candidate Activity Feed */}
          <div className="mocha-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-silver">
                Recent Candidate Ingestion
              </h3>
              <Link to="/hr/candidates" className="text-xs text-lavender hover:underline font-medium flex items-center gap-1">
                All Candidates <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentCandidates.length === 0 ? (
              <div className="py-8 text-center text-silver/60 text-xs space-y-2">
                <Users className="w-8 h-8 text-lavender/40 mx-auto" />
                <p>No candidate resumes ingested yet. Ingest applicant documents to populate candidate triage.</p>
                <Link to="/hr/screening" className="btn-secondary text-xs py-1.5 px-3 inline-block shadow-sm">
                  Ingest &amp; Screen Resumes
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-silver/10">
                {recentCandidates.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-mocha-800 border border-silver/20 flex items-center justify-center text-xs font-bold text-lavender">
                        {c.first_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-silver">
                          {c.first_name} {c.last_name}
                        </h4>
                        <p className="text-xs text-silver/60">
                          {c.current_title} • {c.total_years_experience} yrs exp
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {c.latest_score !== undefined && c.latest_score !== null ? (
                        <span className="badge-silver font-bold text-xs">
                          {c.latest_score.toFixed(0)}% Match
                        </span>
                      ) : (
                        <span className="badge-mocha text-xs">Screened</span>
                      )}
                      <div className="text-[10px] text-silver/50 mt-1">
                        {c.skills.length} skills detected
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};

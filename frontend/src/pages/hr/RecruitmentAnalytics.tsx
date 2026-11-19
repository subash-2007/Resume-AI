import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  Award,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Header } from '../../components/Header';
import { apiGetRecruitmentMetrics } from '../../services/api';
import { RecruitmentMetrics } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

export const RecruitmentAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<RecruitmentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiGetRecruitmentMetrics();
        setMetrics(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const COLOR_MOCHA = '#6F4E37';
  const COLOR_MOCHA_LIGHT = '#916b4f';
  const COLOR_SILVER = '#E5E4E2';
  const COLOR_LAVENDER = '#E6E0F0';

  const hasData = (metrics?.resumes_analyzed ?? 0) > 0 || (metrics?.active_jobs ?? 0) > 0;

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Recruitment Analytics &amp; Pipeline Conversion"
        subtitle="Continuous telemetry analyzing hiring velocity, candidate quality spreads, and skill demand."
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="mocha-card p-5">
            <span className="text-[10px] uppercase font-bold text-silver/60 tracking-wider">Candidate Quality Index</span>
            <div className="text-3xl font-bold text-lavender font-sans mt-2">
              {metrics?.average_match_score ? `${metrics.average_match_score}%` : 'N/A'}
            </div>
            <p className="text-[11px] text-silver/60 mt-1">Mean hybrid ML compatibility in DB</p>
          </div>

          <div className="mocha-card p-5">
            <span className="text-[10px] uppercase font-bold text-silver/60 tracking-wider">Resumes Analyzed</span>
            <div className="text-3xl font-bold text-silver font-sans mt-2">
              {metrics?.resumes_analyzed ?? 0}
            </div>
            <p className="text-[11px] text-silver/60 mt-1">Processed via PyMuPDF &amp; NLP</p>
          </div>

          <div className="mocha-card p-5">
            <span className="text-[10px] uppercase font-bold text-silver/60 tracking-wider">Shortlisting Conversion</span>
            <div className="text-3xl font-bold text-lavender font-sans mt-2">
              {metrics?.conversion_rates.shortlist_rate ?? 0}%
            </div>
            <p className="text-[11px] text-silver/60 mt-1">Passing mandatory criteria</p>
          </div>

          <div className="mocha-card p-5">
            <span className="text-[10px] uppercase font-bold text-silver/60 tracking-wider">Interview-to-Offer</span>
            <div className="text-3xl font-bold text-silver font-sans mt-2">
              {metrics?.conversion_rates.offer_rate ?? 0}%
            </div>
            <p className="text-[11px] text-silver/60 mt-1">Final offer generation rate</p>
          </div>
        </div>

        {/* Charts Row 1: Pipeline & Applications per Job */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Applications Per Job Opening */}
          <div className="mocha-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg font-bold text-silver">
                Applicant Volume by Job Opening
              </h3>
              <span className="badge-lavender text-xs">Live Database</span>
            </div>
            <p className="text-xs text-silver/60 mb-6">
              Total candidate submissions linked to open positions.
            </p>

            {(metrics?.applications_per_job || []).length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-silver/50 text-xs italic">
                <BarChart3 className="w-8 h-8 text-lavender/40 mb-2" />
                <p>No job opening applications recorded in the database yet.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.applications_per_job || []} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#463124" />
                    <XAxis
                      dataKey="job_title"
                      stroke="#E5E4E2"
                      fontSize={10}
                      angle={-15}
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
                        fontSize: '11px'
                      }}
                    />
                    <Bar dataKey="applications" fill={COLOR_LAVENDER} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top In-Demand Skills */}
          <div className="mocha-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg font-bold text-silver">
                Top Skills in Organizational Demand
              </h3>
              <span className="badge-silver text-xs">Taxonomy Aggregation</span>
            </div>
            <p className="text-xs text-silver/60 mb-6">
              Mandatory and preferred skill occurrences weighted across active roles.
            </p>

            {(metrics?.top_skills_in_demand || []).length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-silver/50 text-xs italic">
                <Layers className="w-8 h-8 text-lavender/40 mb-2" />
                <p>No skills requirements currently defined. Post a job to populate skill demand.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={metrics?.top_skills_in_demand || []}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#463124" />
                    <XAxis type="number" stroke="#E5E4E2" fontSize={10} tick={{ fill: '#E5E4E2' }} />
                    <YAxis type="category" dataKey="skill" stroke="#E5E4E2" fontSize={11} tick={{ fill: '#E5E4E2' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2b1e16',
                        borderColor: '#E6E0F0',
                        borderRadius: '8px',
                        color: '#E5E4E2',
                        fontSize: '11px'
                      }}
                    />
                    <Bar dataKey="demand_score" fill={COLOR_SILVER} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

        {/* Charts Row 2: Match Distribution & Pipeline Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Match Score Distribution Pie Chart */}
          <div className="mocha-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-silver mb-1">
                Score Tiers Distribution
              </h3>
              <p className="text-xs text-silver/60 mb-4">
                Spread of all hybrid compatibility evaluations.
              </p>

              {(metrics?.match_distribution || []).every(d => d.count === 0) ? (
                <div className="h-56 flex flex-col items-center justify-center text-center text-silver/50 text-xs italic">
                  <PieIcon className="w-8 h-8 text-lavender/40 mb-2" />
                  <p>No analyses evaluated yet in the database.</p>
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics?.match_distribution || []}
                        dataKey="count"
                        nameKey="range"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label={({ name, percent }: any) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
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

            <div className="text-center text-xs text-silver/60 pt-2 border-t border-silver/10">
              Evaluations strictly weighted by skill taxonomy &amp; semantic similarity
            </div>
          </div>

          {/* Pipeline Conversion Funnel */}
          <div className="mocha-card p-6 lg:col-span-2">
            <h3 className="font-serif text-lg font-bold text-silver mb-1">
              Recruitment Conversion Velocity
            </h3>
            <p className="text-xs text-silver/60 mb-6">
              Conversion benchmarks across applicant vetting and interview completion.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-silver font-semibold">1. AI Screening Pass Rate</span>
                  <span className="font-bold text-lavender">{metrics?.conversion_rates.screening_rate ?? 0}%</span>
                </div>
                <div className="w-full bg-mocha-850 h-3 rounded-full overflow-hidden border border-silver/15">
                  <div className="bg-lavender h-full rounded-full" style={{ width: `${metrics?.conversion_rates.screening_rate ?? 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-silver font-semibold">2. Shortlist Qualification</span>
                  <span className="font-bold text-silver">{metrics?.conversion_rates.shortlist_rate ?? 0}%</span>
                </div>
                <div className="w-full bg-mocha-850 h-3 rounded-full overflow-hidden border border-silver/15">
                  <div className="bg-silver h-full rounded-full" style={{ width: `${metrics?.conversion_rates.shortlist_rate ?? 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-silver font-semibold">3. Technical &amp; HR Interview Rate</span>
                  <span className="font-bold text-lavender">{metrics?.conversion_rates.interview_rate ?? 0}%</span>
                </div>
                <div className="w-full bg-mocha-850 h-3 rounded-full overflow-hidden border border-silver/15">
                  <div className="bg-lavender h-full rounded-full" style={{ width: `${metrics?.conversion_rates.interview_rate ?? 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-silver font-semibold">4. Selection / Offer Rate</span>
                  <span className="font-bold text-silver">{metrics?.conversion_rates.offer_rate ?? 0}%</span>
                </div>
                <div className="w-full bg-mocha-850 h-3 rounded-full overflow-hidden border border-silver/15">
                  <div className="bg-silver h-full rounded-full" style={{ width: `${metrics?.conversion_rates.offer_rate ?? 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

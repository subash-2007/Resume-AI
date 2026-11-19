import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  Download,
  AlertTriangle
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Modal } from '../../components/Modal';
import { apiGetCandidates, apiUpdateApplicationStatus, apiScheduleInterview, getReportDownloadUrl } from '../../services/api';
import { Candidate } from '../../types';

export const AllCandidates: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Candidate detail modal
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  // Interview scheduling modal
  const [scheduleModalCand, setScheduleModalCand] = useState<any | null>(null);
  const [interviewerName, setInterviewerName] = useState('Dr. Eleanor Vance');
  const [interviewDate, setInterviewDate] = useState('2026-11-15');
  const [interviewTime, setInterviewTime] = useState('14:30');
  const [interviewType, setInterviewType] = useState('Technical');
  const [interviewNotes, setInterviewNotes] = useState('');

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetCandidates({ search: search || undefined, page, limit: 10 });
      setCandidates(res.data.items);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, page]);

  const handleUpdateStatus = async (applicationId: number, newStatus: string) => {
    try {
      await apiUpdateApplicationStatus(applicationId, newStatus);
      fetchCandidates();
      if (selectedCandidate) {
        setSelectedCandidate(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalCand) return;
    const appId = scheduleModalCand.applications?.[0]?.application_id;
    if (!appId) {
      alert('No active job application found for this candidate.');
      return;
    }

    try {
      await apiScheduleInterview({
        application_id: appId,
        interviewer_name: interviewerName,
        interview_date: interviewDate,
        interview_time: interviewTime,
        interview_type: interviewType,
        notes: interviewNotes
      });
      setScheduleModalCand(null);
      fetchCandidates();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Candidate Triage &amp; Management"
        subtitle="Search, audit, inspect ML scoring evidence, and advance applicant pipeline stages."
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Search & Filter Bar */}
        <div className="mocha-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-silver/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, title, email, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mocha-input w-full pl-9 py-2 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mocha-input text-xs py-2"
            >
              <option value="All">All Pipeline Stages</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="HR Review">HR Review</option>
              <option value="AI Screened">AI Screened</option>
              <option value="Not Selected">Not Selected</option>
            </select>
          </div>
        </div>

        {/* Candidate Table */}
        <div className="mocha-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-silver">
              <thead className="bg-mocha-850 text-silver/80 uppercase tracking-wider text-[10px] font-semibold border-b border-silver/15">
                <tr>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Applied Job</th>
                  <th className="py-3 px-4 text-center">Compatibility</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Stage Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/10">
                {candidates
                  .filter(c => statusFilter === 'All' || c.applications.some(a => a.status === statusFilter))
                  .map((cand) => {
                    const primaryApp = cand.applications[0];
                    const score = cand.latest_score;

                    return (
                      <tr key={cand.id} className="hover:bg-mocha-850/50 transition-colors">
                        
                        {/* Candidate Name & Title */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-silver text-sm">
                            {cand.first_name} {cand.last_name}
                          </div>
                          <div className="text-[11px] text-silver/60">
                            {cand.current_title}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 text-silver/70">
                          <div>{cand.email}</div>
                          <div className="text-[10px] text-silver/50">{cand.phone || 'Phone not detected'}</div>
                        </td>

                        {/* Applied Job */}
                        <td className="py-3.5 px-4">
                          {primaryApp ? (
                            <div>
                              <span className="font-medium text-silver">{primaryApp.job_title}</span>
                              <div className="text-[10px] text-silver/50">
                                Applied {new Date(primaryApp.applied_at).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-silver/50 italic">Direct Ingestion</span>
                          )}
                        </td>

                        {/* Compatibility Score */}
                        <td className="py-3.5 px-4 text-center">
                          {score !== null && score !== undefined ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-lavender/15 text-lavender border border-lavender/30">
                              {score.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-silver/50 text-[11px]">Pending</span>
                          )}
                        </td>

                        {/* Experience */}
                        <td className="py-3.5 px-4 font-medium text-silver/90">
                          {cand.total_years_experience} yrs
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            primaryApp?.status === 'Shortlisted' ? 'bg-lavender/20 border-lavender/40 text-lavender' :
                            primaryApp?.status.includes('Interview') ? 'bg-silver/20 border-silver/40 text-silver' :
                            primaryApp?.status === 'Not Selected' ? 'bg-mocha-800 border-silver/20 text-silver/40' :
                            'bg-mocha-800 border-silver/20 text-silver/80'
                          }`}>
                            {primaryApp?.status || 'AI Screened'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCandidate(cand)}
                              title="Inspect Candidate Dossier"
                              className="p-1.5 rounded-lg bg-mocha-800 hover:bg-mocha-700 text-silver hover:text-lavender border border-silver/20 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {primaryApp && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(primaryApp.application_id, 'Shortlisted')}
                                  title="Shortlist Candidate"
                                  className="p-1.5 rounded-lg bg-mocha-800 hover:bg-mocha-700 text-silver hover:text-lavender border border-silver/20 transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setScheduleModalCand(cand)}
                                  title="Schedule Interview"
                                  className="p-1.5 rounded-lg bg-mocha-800 hover:bg-mocha-700 text-silver hover:text-lavender border border-silver/20 transition-colors"
                                >
                                  <CalendarCheck className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleUpdateStatus(primaryApp.application_id, 'Not Selected')}
                                  title="Mark as Not Selected"
                                  className="p-1.5 rounded-lg bg-mocha-850 hover:bg-mocha-800 text-silver/40 hover:text-lavender transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                {candidates.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-silver/60">
                      <Users className="w-8 h-8 text-lavender/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-silver">No Candidates Found</p>
                      <p className="text-xs text-silver/50 mt-0.5">Candidates will appear here once registered or after resume screening.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 border-t border-silver/10 bg-mocha-850 flex items-center justify-between text-xs text-silver/60">
            <span>Showing {candidates.length} of {total} candidates</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn-secondary text-[11px] py-1 px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                disabled={page * 10 >= total}
                onClick={() => setPage(page + 1)}
                className="btn-secondary text-[11px] py-1 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Candidate Profile Dossier Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={`${selectedCandidate?.first_name} ${selectedCandidate?.last_name}`}
        subtitle={`Current Title: ${selectedCandidate?.current_title} | Total Verified Experience: ${selectedCandidate?.total_years_experience} years`}
      >
        {selectedCandidate && (
          <div className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                <span className="text-silver/60">Email Address:</span>
                <p className="font-semibold text-silver mt-0.5">{selectedCandidate.email}</p>
              </div>
              <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                <span className="text-silver/60">Telephone:</span>
                <p className="font-semibold text-silver mt-0.5">{selectedCandidate.phone || 'Not detected'}</p>
              </div>
            </div>

            <div>
              <span className="text-xs uppercase font-semibold text-silver/60 tracking-wider block mb-2">
                Standardized Skill Taxonomy
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.skills.map((s: string, idx: number) => (
                  <span key={idx} className="badge-lavender text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Application Pipeline Status */}
            <div>
              <span className="text-xs uppercase font-semibold text-silver/60 tracking-wider block mb-2">
                Application History &amp; Actions
              </span>
              <div className="space-y-2">
                {selectedCandidate.applications.map((app: any, idx: number) => (
                  <div key={idx} className="p-3 bg-mocha-850 rounded-lg border border-silver/15 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-silver">{app.job_title}</p>
                      <p className="text-[10px] text-silver/60">Current Status: {app.status}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(app.application_id, 'Shortlisted')}
                        className="btn-primary text-xs py-1 px-3"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app.application_id, 'HR Review')}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        Move to Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close Dossier
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={!!scheduleModalCand}
        onClose={() => setScheduleModalCand(null)}
        title={`Schedule Interview: ${scheduleModalCand?.first_name} ${scheduleModalCand?.last_name}`}
        subtitle={`Applied Opening: ${scheduleModalCand?.applications?.[0]?.job_title || 'Position'}`}
      >
        <form onSubmit={handleConfirmSchedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                Interviewer Name *
              </label>
              <input
                type="text"
                required
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                className="mocha-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                Interview Type *
              </label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="mocha-input w-full text-xs"
              >
                <option value="Technical">Technical Interview</option>
                <option value="Screening">Initial Screening</option>
                <option value="Culture Fit">Culture &amp; Team Fit</option>
                <option value="Final HR">Final HR &amp; Leadership</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                Interview Date *
              </label>
              <input
                type="date"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="mocha-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                Interview Time *
              </label>
              <input
                type="time"
                required
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className="mocha-input w-full text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
              Interview Focus &amp; Notes
            </label>
            <textarea
              rows={3}
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              placeholder="Candidate demonstrated strong competency in Python and FastAPI. Focus interview on distributed caching and concurrency..."
              className="mocha-input w-full text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setScheduleModalCand(null)}
              className="btn-secondary text-xs py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-5"
            >
              Confirm Interview Schedule
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};


import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  User,
  Briefcase,
  Star,
  CheckCircle,
  XCircle,
  Plus,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Modal } from '../../components/Modal';
import { apiGetInterviews, apiUpdateInterview, apiGetCandidates } from '../../services/api';
import { Interview, Candidate } from '../../types';

export const InterviewManagement: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Edit/Feedback Modal
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [newStatus, setNewStatus] = useState('Completed');
  const [notes, setNotes] = useState('');

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetInterviews({
        status_filter: statusFilter !== 'All' ? statusFilter : undefined
      });
      setInterviews(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [statusFilter]);

  const openFeedbackModal = (iv: Interview) => {
    setActiveInterview(iv);
    setFeedback(iv.feedback || '');
    setRating(iv.rating || 5);
    setNewStatus(iv.status);
    setNotes(iv.notes || '');
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterview) return;

    try {
      await apiUpdateInterview(activeInterview.id, {
        status: newStatus,
        feedback,
        rating,
        notes
      });
      setActiveInterview(null);
      fetchInterviews();
    } catch (e) {
      console.error(e);
    }
  };

  const pipelineStages = [
    { name: 'Applied', desc: 'Raw ingestion' },
    { name: 'AI Screened', desc: 'NLP evaluated' },
    { name: 'HR Review', desc: 'Recruiter triage' },
    { name: 'Shortlisted', desc: 'Qualified' },
    { name: 'Technical Interview', desc: 'Engineering audit' },
    { name: 'HR Interview', desc: 'Leadership fit' },
    { name: 'Selected / Offer', desc: 'Final hiring decision' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Interview Coordination &amp; Evaluation"
        subtitle="Manage structured interviews, log rubric feedback, and advance applicants through verified milestones."
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Pipeline Stage Tracker Visualizer */}
        <div className="mocha-card p-6">
          <h3 className="font-serif text-sm font-bold text-silver uppercase tracking-wider mb-4">
            Standard Recruitment Lifecycle Pipeline
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {pipelineStages.map((st, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-mocha-850 border border-silver/15 text-center relative overflow-hidden"
              >
                <span className="text-[10px] text-lavender font-bold block mb-1">
                  0{i + 1}
                </span>
                <span className="font-serif text-xs font-semibold text-silver block leading-tight">
                  {st.name}
                </span>
                <span className="text-[10px] text-silver/50 block mt-1">
                  {st.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mocha-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-silver/70 font-semibold uppercase tracking-wider">
              Filter by Interview Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mocha-input text-xs py-1.5"
            >
              <option value="All">All Interviews</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <span className="text-xs text-silver/60">
            {interviews.length} Scheduled Sessions
          </span>
        </div>

        {/* Scheduled Interviews Table */}
        <div className="mocha-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-silver">
              <thead className="bg-mocha-850 text-silver/80 uppercase tracking-wider text-[10px] font-semibold border-b border-silver/15">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Job Opening</th>
                  <th className="py-3 px-4">Interviewer</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Session Status</th>
                  <th className="py-3 px-4 text-center">Score / Rating</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/10">
                {interviews.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-silver/60">
                      <CalendarCheck className="w-8 h-8 text-lavender/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-silver">No Interviews Scheduled</p>
                      <p className="text-xs text-silver/50 mt-0.5">There are no candidate interview sessions recorded matching this filter.</p>
                    </td>
                  </tr>
                ) : (
                  interviews.map((iv) => (
                    <tr key={iv.id} className="hover:bg-mocha-850/50 transition-colors">
                      
                      <td className="py-3.5 px-4 font-semibold text-silver text-sm">
                        {iv.candidate_name}
                      </td>

                      <td className="py-3.5 px-4 text-silver/80">
                        {iv.job_title}
                      </td>

                      <td className="py-3.5 px-4 text-silver/70">
                        {iv.interviewer_name}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-silver font-medium">{iv.interview_date}</div>
                        <div className="text-[10px] text-silver/50">{iv.interview_time} UTC</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="badge-lavender text-[11px]">
                          {iv.interview_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          iv.status === 'Scheduled' ? 'bg-lavender/20 border-lavender/40 text-lavender' :
                          iv.status === 'Completed' ? 'bg-silver/20 border-silver/40 text-silver' :
                          'bg-mocha-800 border-silver/20 text-silver/50'
                        }`}>
                          {iv.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {iv.rating ? (
                          <div className="flex items-center justify-center gap-1 text-lavender font-bold">
                            <Star className="w-3.5 h-3.5 fill-lavender text-lavender" />
                            <span>{iv.rating}/5</span>
                          </div>
                        ) : (
                          <span className="text-silver/40 text-[11px]">Pending</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openFeedbackModal(iv)}
                          className="btn-secondary text-[11px] py-1.5 px-3 inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Log Feedback</span>
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Log Interview Feedback Modal */}
      <Modal
        isOpen={!!activeInterview}
        onClose={() => setActiveInterview(null)}
        title={`Interview Evaluation: ${activeInterview?.candidate_name}`}
        subtitle={`Session Type: ${activeInterview?.interview_type} | Position: ${activeInterview?.job_title}`}
      >
        <form onSubmit={handleSaveFeedback} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                Interview Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="mocha-input w-full text-xs"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                Evaluation Rating (1 to 5)
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mocha-input w-full text-xs"
              >
                <option value={5}>5 - Exceptional Competency</option>
                <option value={4}>4 - Exceeds Requirements</option>
                <option value={3}>3 - Meets Requirements</option>
                <option value={2}>2 - Marginal Alignment</option>
                <option value={1}>1 - Did Not Meet Benchmark</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
              Structured Interview Feedback
            </label>
            <textarea
              rows={4}
              required
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Detail candidate's responses on system architecture, algorithms, and practical problem-solving..."
              className="mocha-input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
              Internal Recruiter Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Recommended for offer pending reference check"
              className="mocha-input w-full text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveInterview(null)}
              className="btn-secondary text-xs py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-5"
            >
              Save Evaluation Record
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};


import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Award,
  Briefcase,
  GraduationCap,
  Layers,
  MapPin,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Send
} from 'lucide-react';
import { CircularProgress } from '../../components/CircularProgress';
import { CandidateDossier } from '../../types';
import {
  apiGetCandidateDossier,
  apiExecuteCandidateAction,
  getResumePreviewUrl,
  getResumeDownloadUrl,
  getReportDownloadUrl
} from '../../services/api';

interface CandidateDossierModalProps {
  candidateId: number;
  campaignId: number;
  onClose: () => void;
  onActionSuccess?: () => void;
}

export const CandidateDossierModal: React.FC<CandidateDossierModalProps> = ({
  candidateId,
  campaignId,
  onClose,
  onActionSuccess
}) => {
  const [dossier, setDossier] = useState<CandidateDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'resume' | 'extracted' | 'notes'>('analysis');
  const [newNote, setNewNote] = useState('');
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewDate, setInterviewDate] = useState('2026-11-10');
  const [interviewTime, setInterviewTime] = useState('14:00');
  const [interviewType, setInterviewType] = useState('Technical Screening');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDossier = async () => {
    try {
      setLoading(true);
      const res = await apiGetCandidateDossier(candidateId, campaignId);
      setDossier(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [candidateId, campaignId]);

  const handleAction = async (action: string) => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      await apiExecuteCandidateAction(
        candidateId,
        { action, notes: newNote || undefined },
        campaignId
      );
      setActionMessage(`Application status updated to ${action}.`);
      setNewNote('');
      fetchDossier();
      if (onActionSuccess) onActionSuccess();
    } catch (e: any) {
      console.error(e);
      setActionMessage(e.response?.data?.detail || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await apiExecuteCandidateAction(
        candidateId,
        {
          action: 'schedule_interview',
          notes: newNote,
          interview_details: {
            interview_date: interviewDate,
            interview_time: interviewTime,
            interview_type: interviewType
          }
        },
        campaignId
      );
      setShowInterviewForm(false);
      setNewNote('');
      setActionMessage('Interview scheduled successfully.');
      fetchDossier();
      if (onActionSuccess) onActionSuccess();
    } catch (e: any) {
      console.error(e);
      setActionMessage(e.response?.data?.detail || 'Scheduling failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      setActionLoading(true);
      await apiExecuteCandidateAction(
        candidateId,
        { action: 'note', notes: newNote.trim() },
        campaignId
      );
      setNewNote('');
      fetchDossier();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-mocha-950/80 backdrop-blur-sm">
        <div className="mocha-card p-8 text-center max-w-md w-full">
          <div className="w-10 h-10 border-2 border-lavender border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-serif text-base text-silver">Retrieving Candidate Dossier &amp; Resume...</p>
        </div>
      </div>
    );
  }

  if (!dossier) return null;

  const { candidate, application, resume, matching_analysis, notes, interviews } = dossier;
  const isDeficit = matching_analysis.missing_mandatory_skills?.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-mocha-950/85 backdrop-blur-md overflow-y-auto">
      <div className="mocha-card max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-silver/20 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="p-6 border-b border-silver/15 bg-mocha-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-mocha-800 border border-silver/20 flex items-center justify-center font-serif text-xl font-bold text-lavender">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-2xl font-bold text-silver">{candidate.name}</h2>
                {application.rank_position && (
                  <span className="text-[10px] font-sans font-bold uppercase px-2 py-0.5 rounded-full bg-lavender/20 text-lavender border border-lavender/30">
                    Rank #{application.rank_position}
                  </span>
                )}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-mocha-800 border border-silver/20 text-silver/80">
                  {application.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-silver/60 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-lavender" /> {candidate.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-lavender" /> {candidate.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-lavender" /> {candidate.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-lavender" /> {candidate.total_experience_years} yrs exp
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] uppercase tracking-wider text-silver/60 font-semibold">Overall Compatibility</div>
              <div className="font-serif text-2xl font-bold text-silver">{matching_analysis.overall_score}%</div>
            </div>
            <CircularProgress score={matching_analysis.overall_score} size={46} strokeWidth={4.5} showText={false} />
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-silver/60 hover:text-silver hover:bg-mocha-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionMessage && (
          <div className="px-6 py-2.5 bg-lavender/15 border-b border-lavender/30 text-xs text-lavender flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-silver/60 hover:text-silver p-1 rounded hover:bg-mocha-800 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-silver/15 bg-mocha-900/50 gap-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'analysis', label: 'AI Matching & Evidence', icon: Layers },
            { id: 'resume', label: 'Original Resume Viewer', icon: FileText },
            { id: 'extracted', label: 'Extracted Profile', icon: GraduationCap },
            { id: 'notes', label: `HR Notes & Activity (${notes.length})`, icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 border-b-2 font-medium flex items-center gap-2 transition-all ${
                  isActive
                    ? 'border-lavender text-lavender bg-mocha-850/60'
                    : 'border-transparent text-silver/70 hover:text-silver hover:bg-mocha-850/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: AI MATCHING & EVIDENCE */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              
              {/* Mandatory Deficit Alert */}
              {isDeficit && (
                <div className="p-4 rounded-xl bg-mocha-900 border border-lavender/40 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif text-sm font-bold text-silver">Mandatory Requirement Deficit Detected</h4>
                    <p className="text-xs text-silver/80 mt-1">
                      Candidate is missing mandatory skills: <span className="text-lavender font-semibold">{matching_analysis.missing_mandatory_skills.join(', ')}</span>. Human recruiter evaluation is advised prior to interview advancement.
                    </p>
                  </div>
                </div>
              )}

              {/* 6-Dimensional Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Technical Skills (35%)', score: matching_analysis.skill_score },
                  { label: 'Semantic Fit (25%)', score: matching_analysis.semantic_score },
                  { label: 'Experience (15%)', score: matching_analysis.experience_score },
                  { label: 'Education (10%)', score: matching_analysis.education_score },
                  { label: 'Tooling Stack (10%)', score: matching_analysis.technology_score },
                  { label: 'Domain Fit (5%)', score: matching_analysis.domain_score }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-mocha-900 border border-silver/10 text-center">
                    <div className="font-serif text-lg font-bold text-silver mb-1">{item.score}%</div>
                    <div className="text-[10px] text-silver/60 uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Section Evidence Breakdown Table */}
              <div className="mocha-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base font-bold text-silver flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-lavender" />
                    Section-Level Evidence Attribution
                  </h3>
                  <span className="text-[11px] text-silver/60">Actual resume section sources</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-silver/15 text-silver/60 uppercase tracking-wider">
                        <th className="pb-2">Target Skill / Qualification</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Source Section in Resume</th>
                        <th className="pb-2">Verified Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-silver/10">
                      {Object.entries(matching_analysis.evidence_breakdown || {}).map(([skill, ev], i) => (
                        <tr key={i} className="hover:bg-mocha-800/30">
                          <td className="py-2.5 font-medium text-silver">{skill}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              ev.found ? 'bg-lavender/20 text-lavender border border-lavender/30' : 'bg-mocha-800 text-silver/60'
                            }`}>
                              {ev.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-silver/80">{ev.section}</td>
                          <td className="py-2.5">
                            {ev.found ? (
                              <span className="inline-flex items-center gap-1 text-lavender text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-silver/50 text-[11px]">
                                Not Detected
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strengths & Improvement Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-mocha-900 border border-silver/15">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-lavender mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lavender" />
                    Key Candidate Strengths
                  </h4>
                  <ul className="space-y-2 text-xs text-silver/85">
                    {(matching_analysis.strengths || []).map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-lavender">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-mocha-900 border border-silver/15">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-silver/70 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-lavender" />
                    Areas for Review / Deficits
                  </h4>
                  <ul className="space-y-2 text-xs text-silver/85">
                    {(matching_analysis.improvement_areas || []).map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-lavender">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Natural Language Explanation */}
              <div className="p-4 rounded-xl bg-mocha-900/60 border border-silver/10 text-xs text-silver/80 leading-relaxed font-sans">
                <div className="font-serif font-bold text-silver mb-1">Evaluation Synthesis</div>
                <p>{matching_analysis.explanation}</p>
              </div>

            </div>
          )}

          {/* TAB 2: ORIGINAL RESUME VIEWER */}
          {activeTab === 'resume' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-silver">Original Resume Document</h3>
                  <p className="text-xs text-silver/60">{resume.filename} ({resume.file_type.toUpperCase()})</p>
                </div>
                <div className="flex items-center gap-2">
                  {resume.download_url && (
                    <a
                      href={getResumeDownloadUrl(resume.id)}
                      download
                      className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  )}
                  {resume.preview_url && (
                    <a
                      href={getResumePreviewUrl(resume.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Tab</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Embedded Document Viewer */}
              <div className="w-full h-[520px] rounded-xl border border-silver/20 bg-mocha-900 overflow-hidden">
                {resume.file_type === 'pdf' ? (
                  <iframe
                    src={getResumePreviewUrl(resume.id)}
                    title="Resume Document Preview"
                    className="w-full h-full border-none bg-mocha-950"
                  />
                ) : (
                  <div className="p-6 h-full overflow-y-auto font-mono text-xs text-silver/90 whitespace-pre-wrap leading-relaxed">
                    {resume.raw_text || 'No text representation extracted.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EXTRACTED PROFILE */}
          {activeTab === 'extracted' && (
            <div className="space-y-6">
              
              {/* Technical Skills categorized */}
              <div className="mocha-card p-5">
                <h4 className="font-serif text-sm font-bold text-silver mb-3">Extracted Technical Competencies</h4>
                <div className="flex flex-wrap gap-2">
                  {(resume.parsed_data?.skills || []).map((sk: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-mocha-800 border border-silver/20 text-xs font-medium text-lavender"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education & Experience Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mocha-card p-5">
                  <h4 className="font-serif text-sm font-bold text-silver mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-lavender" />
                    Education &amp; Qualifications
                  </h4>
                  <div className="space-y-2 text-xs">
                    {(resume.parsed_data?.education || []).map((ed: any, i: number) => (
                      <div key={i} className="p-2.5 rounded bg-mocha-850/60 border border-silver/10">
                        <div className="font-semibold text-silver">{ed.degree}</div>
                        <div className="text-silver/70">{ed.institution || 'University Not Detected'}</div>
                        <div className="text-[11px] text-lavender mt-1">Class of: {ed.graduation_year || 'Not detected'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mocha-card p-5">
                  <h4 className="font-serif text-sm font-bold text-silver mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-lavender" />
                    Verified Work Experience
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded bg-mocha-850/60 border border-silver/10">
                      <div className="font-semibold text-silver">{candidate.current_title}</div>
                      <div className="text-silver/70">Total Experience: {candidate.total_experience_years} Years</div>
                      <div className="text-[11px] text-lavender mt-1">Verified work span timeline</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects & Certifications */}
              <div className="mocha-card p-5">
                <h4 className="font-serif text-sm font-bold text-silver mb-3">Projects &amp; Certifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-mocha-850/60 rounded border border-silver/10">
                    <div className="text-lavender font-semibold mb-1">Key Technical Projects</div>
                    <div className="text-silver/80">
                      {resume.parsed_data?.projects?.length > 0 ? 'Document describes verifiable technical project implementations.' : 'No discrete project section detected.'}
                    </div>
                  </div>
                  <div className="p-3 bg-mocha-850/60 rounded border border-silver/10">
                    <div className="text-lavender font-semibold mb-1">Certifications &amp; Credentials</div>
                    <div className="text-silver/80">
                      {resume.parsed_data?.certifications?.length > 0 ? 'Professional credentials or certifications identified in text.' : 'No certifications explicitly detected.'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: HR NOTES & RECRUITER ACTIONS */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-3">
                <label className="text-xs font-semibold text-silver">Add Internal Recruiter Note</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter confidential evaluation note or interview feedback..."
                    className="flex-1 bg-mocha-900 border border-silver/20 rounded-lg px-4 py-2.5 text-xs text-silver focus:outline-none focus:border-lavender"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !newNote.trim()}
                    className="btn-primary text-xs py-2 px-4 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Save Note
                  </button>
                </div>
              </form>

              {/* Notes Timeline */}
              <div className="space-y-3">
                <h4 className="font-serif text-sm font-bold text-silver">Note History ({notes.length})</h4>
                {notes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-silver/50 bg-mocha-900/40 rounded-lg">
                    No notes recorded yet. Add internal feedback above.
                  </div>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="p-3.5 rounded-lg bg-mocha-900 border border-silver/15 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-silver/60">
                        <span className="font-semibold text-lavender">{n.author_name}</span>
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-silver/90">{n.note}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Scheduled Interviews History */}
              <div className="space-y-3 pt-4 border-t border-silver/15">
                <h4 className="font-serif text-sm font-bold text-silver">Scheduled Interviews ({interviews.length})</h4>
                {interviews.length === 0 ? (
                  <div className="p-4 text-center text-xs text-silver/50 bg-mocha-900/40 rounded-lg">
                    No interviews scheduled. Use the Schedule Interview action below.
                  </div>
                ) : (
                  interviews.map((iv) => (
                    <div key={iv.id} className="p-3 rounded-lg bg-mocha-850 border border-silver/15 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-silver">{iv.interview_type} with {iv.interviewer_name}</div>
                        <div className="text-[11px] text-silver/60">{iv.interview_date} at {iv.interview_time}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-lavender/20 text-lavender">
                        {iv.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

        {/* Schedule Interview Modal overlay inside dossier */}
        {showInterviewForm && (
          <div className="p-5 border-t border-silver/15 bg-mocha-900 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-sm font-bold text-silver flex items-center gap-2">
                <Calendar className="w-4 h-4 text-lavender" />
                Schedule Candidate Interview
              </h4>
              <button onClick={() => setShowInterviewForm(false)} className="text-xs text-silver/60 hover:text-silver">Cancel</button>
            </div>

            <form onSubmit={handleScheduleInterview} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-silver/70 block mb-1">Interview Date</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full bg-mocha-850 border border-silver/20 rounded p-2 text-xs text-silver"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-silver/70 block mb-1">Interview Time</label>
                <input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full bg-mocha-850 border border-silver/20 rounded p-2 text-xs text-silver"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-silver/70 block mb-1">Interview Round</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full bg-mocha-850 border border-silver/20 rounded p-2 text-xs text-silver"
                >
                  <option value="Technical Screening">Technical Screening</option>
                  <option value="System Architecture">System Architecture</option>
                  <option value="Executive HR">Executive HR</option>
                  <option value="Culture Fit">Culture Fit</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInterviewForm(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-xs py-2 px-5 shadow-sm"
                >
                  Confirm &amp; Schedule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Actions Toolbar */}
        <div className="p-4 border-t border-silver/15 bg-mocha-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('shortlist')}
              disabled={actionLoading}
              className="btn-primary text-xs py-2 px-3.5 shadow-sm inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Shortlist Candidate</span>
            </button>
            <button
              onClick={() => handleAction('review')}
              disabled={actionLoading}
              className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <span>Move to Review</span>
            </button>
            <button
              onClick={() => setShowInterviewForm(true)}
              disabled={actionLoading}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-mocha-800 border border-silver/20 hover:border-lavender text-silver inline-flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-lavender" />
              <span>Schedule Interview</span>
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={actionLoading}
              className="text-xs px-3 py-2 rounded-lg text-silver/60 hover:text-silver hover:bg-mocha-800 transition-colors"
            >
              Reject
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getReportDownloadUrl(matching_analysis.overall_score ? candidate.id : 1)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-lavender hover:underline inline-flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Executive Report</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  ExternalLink,
  ClipboardList
} from 'lucide-react';
import { Header } from '../../components/Header';
import { apiGetCandidates, getReportDownloadUrl } from '../../services/api';
import { Candidate } from '../../types';

export const HRReports: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await apiGetCandidates({ search: search || undefined, limit: 50 });
        setCandidates(res.data.items);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidates();
  }, [search]);

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Official Candidate Evaluation Reports"
        subtitle="Generate, review, and export PDF dossiers compiled via ReportLab using strict brand typography and styling."
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Banner */}
        <div className="mocha-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mocha-800 border border-silver/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-lavender" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-silver">
                ReportLab Vector PDF Generation
              </h3>
              <p className="text-xs text-silver/60">
                Official dossiers incorporate candidate metadata, component score breakdown, skill gaps, and compliance disclosures.
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-silver/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by candidate or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mocha-input w-full pl-9 py-2 text-xs"
            />
          </div>
        </div>

        {/* Reports Table */}
        <div className="mocha-card overflow-hidden">
          <table className="w-full text-left text-xs text-silver">
            <thead className="bg-mocha-850 text-silver/80 uppercase tracking-wider text-[10px] font-semibold border-b border-silver/15">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Target Position</th>
                <th className="py-3 px-4 text-center">Compatibility Index</th>
                <th className="py-3 px-4">Date Generated</th>
                <th className="py-3 px-4 text-right">PDF Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/10">
              {candidates.flatMap((cand) =>
                cand.applications.map((app) => (
                  <tr key={app.application_id} className="hover:bg-mocha-850/50 transition-colors">
                    
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-silver text-sm">
                        {cand.first_name} {cand.last_name}
                      </div>
                      <div className="text-[11px] text-silver/60">{cand.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-silver/90 font-medium">
                      {app.job_title}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {app.match_score !== null && app.match_score !== undefined ? (
                        <span className="badge-lavender font-bold text-xs">
                          {app.match_score.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="badge-mocha text-[10px]">Evaluated</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-silver/60">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={getReportDownloadUrl(app.application_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </td>

                  </tr>
                ))
              )}
              {candidates.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-silver/60">
                    <ClipboardList className="w-8 h-8 text-lavender/40 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-silver">No Candidate Reports Found</p>
                    <p className="text-xs text-silver/50 mt-0.5">Evaluation reports will automatically appear once candidate resumes are processed.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
};


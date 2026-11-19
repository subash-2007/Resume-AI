import React, { useState, useEffect } from 'react';
import {
  Clock,
  Download,
  FileText,
  FileSearch,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Header } from '../../components/Header';
import { apiGetCandidateHistory, getReportDownloadUrl } from '../../services/api';

export const AnalysisHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiGetCandidateHistory();
        setHistory(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Resume Evaluation History"
        subtitle="Chronological audit records of all job compatibility analyses and ReportLab PDF dossiers."
      />

      <main className="p-8 max-w-6xl mx-auto w-full space-y-6">
        
        <div className="mocha-card overflow-hidden">
          <table className="w-full text-left text-xs text-silver">
            <thead className="bg-mocha-850 text-silver/80 uppercase tracking-wider text-[10px] font-semibold border-b border-silver/15">
              <tr>
                <th className="py-3 px-4">Evaluated Position</th>
                <th className="py-3 px-4">Resume File</th>
                <th className="py-3 px-4 text-center">Compatibility Index</th>
                <th className="py-3 px-4 text-center">Skills Score</th>
                <th className="py-3 px-4">Date Evaluated</th>
                <th className="py-3 px-4 text-right">PDF Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/10">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-silver/60">
                    <Clock className="w-8 h-8 text-lavender/40 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-silver">No Evaluations on Record</p>
                    <p className="text-xs text-silver/50 mt-0.5">Use the Analyze Resume module to evaluate compatibility against job descriptions.</p>
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-mocha-850/50 transition-colors">
                    
                    <td className="py-3.5 px-4 font-semibold text-silver text-sm">
                      {item.job_title}
                    </td>

                    <td className="py-3.5 px-4 text-silver/70">
                      {item.resume_filename}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="badge-lavender font-bold text-xs">
                        {item.overall_score}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-silver/90">
                      {item.skill_score}%
                    </td>

                    <td className="py-3.5 px-4 text-silver/60">
                      {new Date(item.analyzed_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={getReportDownloadUrl(item.id)}
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
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
};


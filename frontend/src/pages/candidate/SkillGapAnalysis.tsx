import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Header } from '../../components/Header';
import { apiGetCandidateHistory } from '../../services/api';

export const SkillGapAnalysis: React.FC = () => {
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

  // Aggregated missing mandatory and preferred skills
  const missingMandatorySet = new Set<string>();
  const missingPreferredSet = new Set<string>();

  history.forEach(item => {
    (item.missing_mandatory_skills || []).forEach((s: string) => missingMandatorySet.add(s));
    (item.missing_preferred_skills || []).forEach((s: string) => missingPreferredSet.add(s));
  });

  const mandatoryGaps = Array.from(missingMandatorySet);
  const preferredGaps = Array.from(missingPreferredSet);

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Skill Gap Remediation &amp; Strategic Roadmap"
        subtitle="Identify competitive qualification shortfalls across evaluated positions and prioritize learning paths."
      />

      <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Banner */}
        <div className="mocha-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mocha-800 border border-silver/15 text-xs text-lavender font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Personalized Remediation Engine</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-silver">
              Bridging Your Market Competency Gaps
            </h2>
            <p className="text-xs text-silver/70 mt-1 max-w-xl">
              We aggregated missing competencies across your evaluated target roles. Addressing mandatory gaps significantly improves ATS clearance and recruiter shortlisting.
            </p>
          </div>

          <Link to="/candidate/analyze" className="btn-primary text-xs py-2 px-4 shadow-sm shrink-0">
            <span>Evaluate Against New Role</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {/* Mandatory Skill Shortfalls */}
        <div className="mocha-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-silver/10 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-silver flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-lavender" />
                <span>Critical Mandatory Competency Gaps ({mandatoryGaps.length})</span>
              </h3>
              <p className="text-xs text-silver/60">
                These skills were listed as essential in target openings. Lack of these skills triggers recruiter deficit warnings.
              </p>
            </div>
            <span className="badge-mocha text-xs text-lavender font-bold border border-lavender/30">
              High Priority
            </span>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-silver/60 text-xs space-y-2">
              <Layers className="w-8 h-8 text-lavender/40 mx-auto" />
              <p>No job evaluations recorded yet. Run a compatibility analysis to identify competency gaps.</p>
              <Link to="/candidate/analyze" className="btn-secondary text-xs py-1.5 px-3 inline-block mt-2">
                Evaluate Target Position
              </Link>
            </div>
          ) : mandatoryGaps.length === 0 ? (
            <div className="py-6 text-center text-silver/60 text-xs">
              <CheckCircle2 className="w-8 h-8 text-lavender mx-auto mb-2" />
              <p>Excellent! No recurring mandatory skill deficits detected across your target positions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mandatoryGaps.map((skill, i) => (
                <div key={i} className="p-4 rounded-xl bg-mocha-850 border border-silver/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-base font-bold text-silver">{skill}</span>
                    <span className="badge-lavender text-[10px] font-semibold">Priority 1</span>
                  </div>
                  <p className="text-xs text-silver/70 leading-relaxed font-sans">
                    Recommended action: Build hands-on project implementations utilizing {skill} and explicitly document practical outcomes in your work history.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preferred Skill Opportunities */}
        <div className="mocha-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-silver/10 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-silver flex items-center gap-2">
                <Layers className="w-4 h-4 text-lavender" />
                <span>Value-Add &amp; Preferred Skill Gaps ({preferredGaps.length})</span>
              </h3>
              <p className="text-xs text-silver/60">
                Secondary competencies that distinguish top candidates without strictly preventing initial qualification.
              </p>
            </div>
            <span className="badge-silver text-xs">Moderate Priority</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preferredGaps.slice(0, 6).map((skill, i) => (
              <div key={i} className="p-4 rounded-xl bg-mocha-850 border border-silver/15 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-base font-bold text-silver">{skill}</span>
                  <span className="badge-silver text-[10px]">Priority 2</span>
                </div>
                <p className="text-xs text-silver/70 leading-relaxed font-sans">
                  Familiarity with {skill} elevates semantic similarity and candidate percentile rankings during peer comparison.
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};


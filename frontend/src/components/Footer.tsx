import React from 'react';
import { Shield, Cpu, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-mocha-950 border-t border-silver/15 text-silver/70 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-silver/10">
          
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-mocha-850 border border-silver/20 flex items-center justify-center">
                <Layers className="w-4 h-4 text-lavender" />
              </div>
              <span className="font-serif text-lg font-bold text-silver">
                Resume<span className="text-lavender">AI</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-silver/70 font-sans">
              Centralized Machine Learning &amp; Natural Language Processing platform delivering explainable resume intelligence and equitable recruitment workflows.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-lavender/80 font-medium">
              <Shield className="w-3.5 h-3.5 text-lavender" />
              Non-Discriminatory Explainable AI
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-silver mb-4 uppercase tracking-wider">
              Recruitment Portal
            </h4>
            <ul className="space-y-2.5 text-xs text-silver/70">
              <li><Link to="/login?role=hr" className="hover:text-lavender transition-colors">HR Recruiter Login</Link></li>
              <li><Link to="/hr/jobs" className="hover:text-lavender transition-colors">Job Architecture</Link></li>
              <li><Link to="/hr/screening" className="hover:text-lavender transition-colors">AI Resume Screening</Link></li>
              <li><Link to="/hr/ranking" className="hover:text-lavender transition-colors">Candidate Ranking Matrix</Link></li>
              <li><Link to="/hr/interviews" className="hover:text-lavender transition-colors">Interview Pipeline</Link></li>
            </ul>
          </div>

          {/* Candidate Experience */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-silver mb-4 uppercase tracking-wider">
              Candidate Portal
            </h4>
            <ul className="space-y-2.5 text-xs text-silver/70">
              <li><Link to="/login?role=candidate" className="hover:text-lavender transition-colors">Candidate Login</Link></li>
              <li><Link to="/register" className="hover:text-lavender transition-colors">Create Candidate Account</Link></li>
              <li><Link to="/candidate/upload" className="hover:text-lavender transition-colors">Resume Upload &amp; Parsing</Link></li>
              <li><Link to="/candidate/analyze" className="hover:text-lavender transition-colors">Semantic Job Compatibility</Link></li>
              <li><Link to="/candidate/skill-gaps" className="hover:text-lavender transition-colors">Skill Gap Remediation</Link></li>
            </ul>
          </div>

          {/* Governance & Architecture */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-silver mb-4 uppercase tracking-wider">
              Architecture &amp; Ethics
            </h4>
            <ul className="space-y-2.5 text-xs text-silver/70">
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-lavender" />
                <span>Sentence Transformers all-MiniLM-L6-v2</span>
              </li>
              <li className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-lavender" />
                <span>TF-IDF Vectorized Cosine Engine</span>
              </li>
              <li><span>Strict 6-Dimension Hybrid Scoring</span></li>
              <li><span>No Protected Characteristic Ingestion</span></li>
              <li><span>Standardized Skill Taxonomy</span></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-silver/50 gap-4">
          <p>© 2026 ResumeAI Enterprise SaaS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-lavender cursor-pointer">Enterprise Security</span>
            <span className="hover:text-lavender cursor-pointer">Privacy Framework</span>
            <span className="hover:text-lavender cursor-pointer">Explainability Charter</span>
          </div>
        </div>
      </div>
    </footer>
  );
};


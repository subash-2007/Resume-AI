import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Briefcase, Award, CheckCircle2, UploadCloud } from 'lucide-react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { apiGetMyResumes } from '../../services/api';
import { Resume } from '../../types';

export const CandidateProfile: React.FC = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGetMyResumes();
        setResumes(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const activeParsed = resumes[0]?.parsed_data;
  const skills: string[] = activeParsed?.skills || [];
  const expYears = activeParsed?.total_experience_years ?? 0;
  const degree = activeParsed?.education?.[0]?.degree || "Not detected";

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Candidate Profile Dossier"
        subtitle="Manage your professional baseline information, extracted competencies, and verified credentials."
      />

      <main className="p-8 max-w-4xl mx-auto w-full space-y-6">
        
        {/* Profile Card */}
        <div className="mocha-card p-8">
          <div className="flex items-center gap-5 border-b border-silver/10 pb-6 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-mocha-800 border border-lavender/40 flex items-center justify-center font-serif text-2xl font-bold text-lavender shadow-md">
              {user?.full_name ? user.full_name.charAt(0) : 'C'}
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-silver">
                {user?.full_name || 'Candidate Profile'}
              </h2>
              <p className="text-xs text-lavender font-medium mt-0.5">
                {expYears > 0 ? `${expYears} Verified Years Experience` : 'Professional Profile'}
              </p>
              <div className="flex items-center gap-4 text-xs text-silver/60 mt-2">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-lavender" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-lavender" />
                  United States (Remote / Hybrid)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
            <div className="p-4 bg-mocha-850 rounded-lg border border-silver/10">
              <span className="text-silver/60 block mb-1">Education Verified:</span>
              <p className="text-sm font-semibold text-silver">{degree}</p>
            </div>
            <div className="p-4 bg-mocha-850 rounded-lg border border-silver/10">
              <span className="text-silver/60 block mb-1">Active Baseline Resume:</span>
              <p className="text-sm font-semibold text-silver">
                {resumes[0]?.filename || 'No resume uploaded yet'}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs uppercase font-semibold text-silver/70 tracking-wider block mb-3">
              Standardized Competencies Extracted by NLP ({skills.length})
            </span>
            {skills.length === 0 ? (
              <div className="p-6 bg-mocha-850 rounded-lg border border-silver/10 text-center space-y-3">
                <p className="text-xs text-silver/60">
                  No skills detected. Upload your resume to extract competencies automatically.
                </p>
                <Link to="/candidate/upload" className="btn-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5 shadow-sm">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Resume Document</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((s, idx) => (
                  <span key={idx} className="badge-lavender text-xs py-1 px-3">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};

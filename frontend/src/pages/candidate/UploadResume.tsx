import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  Trash2
} from 'lucide-react';
import { Header } from '../../components/Header';
import { apiUploadSingleResume, apiGetMyResumes } from '../../services/api';
import { Resume } from '../../types';

export const UploadResume: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchResumes = async () => {
    try {
      const res = await apiGetMyResumes();
      setResumes(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorNotice(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorNotice('Please choose a PDF or DOCX resume to upload.');
      return;
    }

    setIsUploading(true);
    setErrorNotice(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiUploadSingleResume(formData);
      setSuccessResult(res.data);
      setFile(null);
      fetchResumes();
    } catch (e: any) {
      console.error(e);
      setErrorNotice(e.response?.data?.detail || 'Failed to parse resume.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Resume Ingestion &amp; NLP Parsing"
        subtitle="Upload your document in PDF, DOCX, or TXT format to trigger real-time feature extraction."
      />

      <main className="p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Upload Card */}
        <div className="mocha-card p-8">
          <form onSubmit={handleUpload} className="space-y-6">
            
            <div className="border-2 border-dashed border-silver/20 hover:border-lavender rounded-xl p-8 text-center bg-mocha-900/60 transition-colors">
              <UploadCloud className="w-12 h-12 text-lavender mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-silver mb-1">
                Select Your Resume Document
              </h3>
              <p className="text-xs text-silver/60 mb-4 max-w-md mx-auto">
                PyMuPDF (PDF) and python-docx engines extract skills, degrees, and work duration without manual data entry.
              </p>

              <label className="btn-primary text-xs py-2 px-4 cursor-pointer inline-flex items-center gap-2 shadow-sm">
                <FileText className="w-3.5 h-3.5" />
                <span>{file ? file.name : 'Choose PDF / DOCX'}</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {file && (
                <div className="mt-3 text-xs text-silver/70">
                  Ready: <b>{file.name}</b> ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {errorNotice && (
              <div className="p-3 rounded-lg bg-mocha-800 border border-lavender/30 text-xs text-lavender flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-lavender" />
                <span>{errorNotice}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!file || isUploading}
                className="btn-primary text-xs py-2.5 px-6 disabled:opacity-40"
              >
                {isUploading ? 'Extracting Resume Features...' : 'Upload & Parse Resume'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

          </form>
        </div>

        {/* Success / Parsed Detail Banner */}
        {successResult && (
          <div className="mocha-card p-6 space-y-4 border border-lavender/40">
            <div className="flex items-center justify-between border-b border-silver/10 pb-3">
              <h3 className="font-serif text-lg font-bold text-silver flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-lavender" />
                <span>Parsing Verification Completed</span>
              </h3>
              <span className="badge-lavender text-xs">PyMuPDF Ingestion</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                <span className="text-silver/60">Candidate Name:</span>
                <p className="font-semibold text-silver mt-0.5">{successResult.parsed_data?.name || 'Detected'}</p>
              </div>
              <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                <span className="text-silver/60">Email:</span>
                <p className="font-semibold text-silver mt-0.5">{successResult.parsed_data?.email || 'Detected'}</p>
              </div>
              <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                <span className="text-silver/60">Experience Duration:</span>
                <p className="font-semibold text-silver mt-0.5">{successResult.parsed_data?.total_experience_years || 0} Years</p>
              </div>
              <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                <span className="text-silver/60">Degree Level:</span>
                <p className="font-semibold text-silver mt-0.5">
                  {successResult.parsed_data?.education?.[0]?.degree || 'Verified'}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs uppercase font-semibold text-silver/60 tracking-wider block mb-2">
                Identified Competencies ({successResult.parsed_data?.skills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(successResult.parsed_data?.skills || []).map((s: string, idx: number) => (
                  <span key={idx} className="badge-lavender text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Existing Ingested Resumes */}
        <div className="mocha-card p-6">
          <h3 className="font-serif text-lg font-bold text-silver mb-4 border-b border-silver/10 pb-3">
            Your Active Resumes in ResumeAI
          </h3>

          <div className="divide-y divide-silver/10">
            {resumes.map((r) => (
              <div key={r.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-mocha-850 border border-silver/15 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-lavender" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-silver">
                      {r.filename}
                    </h4>
                    <p className="text-xs text-silver/50">
                      Uploaded on {new Date(r.created_at).toLocaleDateString()} • {r.parsed_data?.skills?.length || 0} competencies detected
                    </p>
                  </div>
                </div>

                <span className="badge-silver text-xs">Active Baseline</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};


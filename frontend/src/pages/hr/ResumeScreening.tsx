import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ArrowRight,
  Briefcase,
  Layers,
  Award,
  Clock,
  Eye,
  Trash2
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Modal } from '../../components/Modal';
import { apiGetJobs, apiUploadSingleResume, apiUploadBulkResumes } from '../../services/api';
import { Job } from '../../types';

export const ResumeScreening: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResults, setProcessedResults] = useState<any[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Resume Preview Modal
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await apiGetJobs({ status_filter: 'active' });
        setJobs(res.data);
        if (res.data.length > 0) {
          setSelectedJobId(res.data[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadJobs();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const valid = files.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'txt';
    });

    if (valid.length < files.length) {
      setErrorNotice('Some files were ignored because only PDF, DOCX, and TXT are supported.');
    } else {
      setErrorNotice(null);
    }

    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleStartScreening = async () => {
    if (selectedFiles.length === 0) {
      setErrorNotice('Please select or drag-and-drop at least one resume file.');
      return;
    }
    if (!selectedJobId) {
      setErrorNotice('Please select an active target job opening for screening.');
      return;
    }

    setIsProcessing(true);
    setErrorNotice(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('job_id', selectedJobId.toString());

      const res = await apiUploadBulkResumes(formData);
      setProcessedResults(res.data.processed);
      setSelectedFiles([]);
    } catch (e: any) {
      console.error(e);
      setErrorNotice(e.response?.data?.detail || 'Screening ingestion encountered an error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="AI Resume Screening &amp; Ingestion"
        subtitle="Ingest PDF/DOCX resumes, extract candidate profiles, and run hybrid semantic screening."
      />

      <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Step 1: Job Selection */}
        <div className="mocha-card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-silver flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-lavender" />
                <span>Target Job Opening</span>
              </h3>
              <p className="text-xs text-silver/60 mt-0.5">
                Resumes will be evaluated against this job's requirements and scoring weights.
              </p>
            </div>

            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : '')}
              className="mocha-input text-xs w-full sm:w-80"
            >
              <option value="">Select a Job Opening...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Drag & Drop Ingestion Zone */}
        <div className="mocha-card p-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              isDragging
                ? 'border-lavender bg-mocha-850/80 scale-[1.01]'
                : 'border-silver/25 bg-mocha-900/50 hover:border-lavender/50'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-mocha-800 border border-silver/20 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-7 h-7 text-lavender animate-pulse" />
            </div>

            <h4 className="font-serif text-lg font-bold text-silver mb-1">
              Drag &amp; Drop Resumes Here
            </h4>
            <p className="text-xs text-silver/60 max-w-md mx-auto mb-4 font-sans">
              Support for single or bulk PDF, DOCX, and TXT files. Centralized NLP parser will automatically extract contact info, education, skills, and experience.
            </p>

            <label className="btn-primary text-xs py-2 px-5 cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
              <FileText className="w-3.5 h-3.5" />
              <span>Browse Local Files</span>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </label>
          </div>

          {errorNotice && (
            <div className="mt-4 p-3 rounded-lg bg-mocha-800 border border-lavender/30 text-xs text-lavender flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-lavender" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Staged Files List */}
          {selectedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-silver font-semibold uppercase tracking-wider">
                <span>Staged for Ingestion ({selectedFiles.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-lavender hover:underline capitalize"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-mocha-850 rounded-lg border border-silver/15 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-lavender shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs text-silver truncate font-medium">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-silver/50">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-silver/50 hover:text-lavender p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartScreening}
                  disabled={isProcessing}
                  className="btn-primary text-xs py-2.5 px-6 shadow-md"
                >
                  <Cpu className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? 'Executing NLP Parsing & ML Screening...'
                      : `Process & Screen ${selectedFiles.length} Resume${selectedFiles.length > 1 ? 's' : ''}`}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Screening Results Table */}
        {processedResults.length > 0 && (
          <div className="mocha-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-silver/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-silver">
                  Screening Ingestion Results
                </h3>
                <p className="text-xs text-silver/60">
                  {processedResults.length} candidates evaluated and saved to database.
                </p>
              </div>
              <span className="badge-lavender text-xs">Hybrid ML Screened</span>
            </div>

            <div className="divide-y divide-silver/10">
              {processedResults.map((res, i) => {
                const match = res.match_result;
                const parsed = res.parsed_data;
                const hasDeficit = match?.has_mandatory_deficit;

                return (
                  <div key={i} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-serif text-base font-bold text-silver">
                          {res.candidate_name || parsed?.name || 'Applicant'}
                        </h4>
                        <span className="text-xs text-silver/50">
                          {parsed?.email || res.filename}
                        </span>
                        {hasDeficit && (
                          <span className="badge-mocha text-[10px] text-lavender font-bold">
                            Missing Mandatory Skills
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(parsed?.skills || []).slice(0, 7).map((s: string, sIdx: number) => (
                          <span key={sIdx} className="badge-silver text-[10px]">
                            {s}
                          </span>
                        ))}
                        {(parsed?.skills || []).length > 7 && (
                          <span className="text-[10px] text-silver/50 self-center">
                            +{(parsed?.skills || []).length - 7} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {match && (
                        <div className="text-right">
                          <span className="text-xl font-bold font-sans text-silver">
                            {match.overall_score}%
                          </span>
                          <div className="text-[10px] text-lavender uppercase font-semibold">
                            Compatibility Index
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setPreviewItem(res)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Profile</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* Candidate Parsing Detail Modal */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.candidate_name || 'Candidate Breakdown'}
        subtitle={`Ingested File: ${previewItem?.filename}`}
      >
        {previewItem && (
          <div className="space-y-4">
            
            {/* Extracted Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                <span className="text-silver/60">Email:</span>
                <p className="font-semibold text-silver mt-0.5">{previewItem.parsed_data?.email || 'Not detected'}</p>
              </div>
              <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                <span className="text-silver/60">Phone:</span>
                <p className="font-semibold text-silver mt-0.5">{previewItem.parsed_data?.phone || 'Not detected'}</p>
              </div>
              <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                <span className="text-silver/60">Experience Duration:</span>
                <p className="font-semibold text-silver mt-0.5">{previewItem.parsed_data?.total_experience_years || 0} Years</p>
              </div>
              <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                <span className="text-silver/60">Education Detected:</span>
                <p className="font-semibold text-silver mt-0.5">
                  {previewItem.parsed_data?.education?.[0]?.degree || 'Not detected'}
                </p>
              </div>
            </div>

            {/* Extracted Skills */}
            <div>
              <span className="text-xs uppercase font-semibold text-silver/60 tracking-wider block mb-2">
                All Extracted Competencies ({previewItem.parsed_data?.skills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(previewItem.parsed_data?.skills || []).map((s: string, idx: number) => (
                  <span key={idx} className="badge-lavender text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Match Explanation if screened against job */}
            {previewItem.match_result && (
              <div className="p-4 bg-mocha-850 rounded-lg border border-lavender/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-silver text-sm">Explainable Match Breakdown</span>
                  <span className="badge-silver font-bold text-xs">{previewItem.match_result.overall_score}%</span>
                </div>
                <p className="text-xs text-silver/80 leading-relaxed">
                  {previewItem.match_result.explanation}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewItem(null)}
                className="btn-primary text-xs py-2 px-4"
              >
                Close Inspection
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};


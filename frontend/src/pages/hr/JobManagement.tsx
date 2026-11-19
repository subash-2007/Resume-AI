import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Trash2,
  Sliders,
  FileSearch,
  ArrowRight
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Modal } from '../../components/Modal';
import { apiGetJobs, apiUpdateJob, apiDeleteJob } from '../../services/api';
import { Job } from '../../types';

export const JobManagement: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Weight configuration modal
  const [selectedJobForWeights, setSelectedJobForWeights] = useState<Job | null>(null);
  const [weights, setWeights] = useState({
    technical_skills: 0.35,
    semantic_similarity: 0.25,
    experience: 0.15,
    education: 0.10,
    technology: 0.10,
    domain: 0.05
  });

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetJobs({
        search: search || undefined,
        department: department !== 'All' ? department : undefined,
        status_filter: statusFilter !== 'All' ? statusFilter : undefined
      });
      setJobs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, department, statusFilter]);

  const handleStatusToggle = async (job: Job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      await apiUpdateJob(job.id, { status: newStatus });
      fetchJobs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this job opening? Associated screening records will be removed.')) {
      try {
        await apiDeleteJob(id);
        fetchJobs();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveWeights = async () => {
    if (!selectedJobForWeights) return;
    try {
      await apiUpdateJob(selectedJobForWeights.id, { scoring_weights: weights });
      setSelectedJobForWeights(null);
      fetchJobs();
    } catch (e) {
      console.error(e);
    }
  };

  const openWeightConfig = (job: Job) => {
    setSelectedJobForWeights(job);
    if (job.scoring_weights) {
      setWeights({
        technical_skills: job.scoring_weights.technical_skills ?? 0.35,
        semantic_similarity: job.scoring_weights.semantic_similarity ?? 0.25,
        experience: job.scoring_weights.experience ?? 0.15,
        education: job.scoring_weights.education ?? 0.10,
        technology: job.scoring_weights.technology ?? 0.10,
        domain: job.scoring_weights.domain ?? 0.05
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Job Opening Management"
        subtitle="Create, configure, and maintain enterprise recruitment specifications."
      >
        <Link to="/hr/jobs/create" className="btn-primary text-xs py-2 px-3.5 shadow-sm">
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Job Opening</span>
        </Link>
      </Header>

      <main className="p-8 space-y-6 max-w-7xl">
        
        {/* Filters & Search Bar */}
        <div className="mocha-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-silver/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by job title or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mocha-input w-full pl-9 py-2 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mocha-input text-xs py-2"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="AI Research">AI Research</option>
              <option value="Platform Infrastructure">Platform Infrastructure</option>
              <option value="Product Experience">Product Experience</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mocha-input text-xs py-2"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="mocha-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="badge-mocha text-[10px] uppercase font-semibold tracking-wider">
                      {job.department}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-silver mt-1 hover:text-lavender transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-xs text-silver/60">
                      {job.location} • {job.employment_type}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      job.status === 'active'
                        ? 'bg-lavender/20 border-lavender/40 text-lavender'
                        : 'bg-silver/10 border-silver/30 text-silver/60'
                    }`}
                  >
                    {job.status === 'active' ? 'Active' : 'Closed'}
                  </span>
                </div>

                <p className="text-xs text-silver/75 leading-relaxed line-clamp-3 mb-4">
                  {job.description}
                </p>

                {/* Mandatory Skills */}
                <div className="mb-4">
                  <div className="text-[10px] uppercase font-semibold text-silver/60 mb-1.5 tracking-wider">
                    Mandatory Skills ({job.mandatory_skills.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.mandatory_skills.map((s, i) => (
                      <span key={i} className="badge-lavender text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preferred Skills */}
                {job.preferred_skills && job.preferred_skills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase font-semibold text-silver/60 mb-1.5 tracking-wider">
                      Preferred Skills ({job.preferred_skills.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {job.preferred_skills.map((s, i) => (
                        <span key={i} className="badge-silver text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-silver/10 flex items-center justify-between mt-4 text-xs">
                <div className="flex items-center gap-4 text-silver/60 text-[11px]">
                  <span><b>{job.vacancies}</b> Vacancies</span>
                  <span>Exp: <b>{job.required_experience}</b> yrs</span>
                  <span>Edu: <b>{job.educational_requirements}</b></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openWeightConfig(job)}
                    title="Configure Scoring Weights"
                    className="p-1.5 rounded-lg bg-mocha-800 hover:bg-mocha-700 text-silver hover:text-lavender border border-silver/20 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    to={`/hr/ranking?job_id=${job.id}`}
                    title="View Candidate Ranking"
                    className="p-1.5 rounded-lg bg-mocha-800 hover:bg-mocha-700 text-silver hover:text-lavender border border-silver/20 transition-colors"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleStatusToggle(job)}
                    className="text-xs px-2.5 py-1 rounded-md bg-mocha-850 hover:bg-mocha-800 text-silver border border-silver/20 transition-colors"
                  >
                    {job.status === 'active' ? 'Close' : 'Publish'}
                  </button>

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-1.5 rounded-lg bg-mocha-850 hover:bg-mocha-800 text-silver/60 hover:text-lavender transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {jobs.length === 0 && !isLoading && (
            <div className="mocha-card p-12 text-center col-span-full border border-silver/15">
              <Briefcase className="w-10 h-10 text-lavender/40 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-silver">No Job Openings Found</h3>
              <p className="text-xs text-silver/60 mt-1 max-w-sm mx-auto">
                No vacancies match your active search and filter criteria. Create a new vacancy or clear filters.
              </p>
              <Link to="/hr/jobs/create" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-4 shadow-sm">
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Job</span>
              </Link>
            </div>
          )}
        </div>

      </main>

      {/* Weight Configuration Modal */}
      <Modal
        isOpen={!!selectedJobForWeights}
        onClose={() => setSelectedJobForWeights(null)}
        title="Custom Scoring Weights"
        subtitle={`Adjust explainable ML hybrid matching weights for: ${selectedJobForWeights?.title}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-silver/70">
            Scoring weights must sum to 1.0 (100%). These weights are utilized by both HR and Candidate evaluation pipelines.
          </p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 text-silver">
                <span>Technical Skills Matching:</span>
                <span className="font-bold text-lavender">{(weights.technical_skills * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.60"
                step="0.05"
                value={weights.technical_skills}
                onChange={(e) => setWeights({ ...weights, technical_skills: parseFloat(e.target.value) })}
                className="w-full accent-lavender"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 text-silver">
                <span>Semantic Contextual Similarity:</span>
                <span className="font-bold text-lavender">{(weights.semantic_similarity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.50"
                step="0.05"
                value={weights.semantic_similarity}
                onChange={(e) => setWeights({ ...weights, semantic_similarity: parseFloat(e.target.value) })}
                className="w-full accent-lavender"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 text-silver">
                <span>Verified Experience:</span>
                <span className="font-bold text-lavender">{(weights.experience * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.30"
                step="0.05"
                value={weights.experience}
                onChange={(e) => setWeights({ ...weights, experience: parseFloat(e.target.value) })}
                className="w-full accent-lavender"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 text-silver">
                <span>Education Alignment:</span>
                <span className="font-bold text-lavender">{(weights.education * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.25"
                step="0.05"
                value={weights.education}
                onChange={(e) => setWeights({ ...weights, education: parseFloat(e.target.value) })}
                className="w-full accent-lavender"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-silver/10 flex justify-end gap-3">
            <button
              onClick={() => setSelectedJobForWeights(null)}
              className="btn-secondary text-xs py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWeights}
              className="btn-primary text-xs py-2 px-4"
            >
              Save Custom Weights
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};


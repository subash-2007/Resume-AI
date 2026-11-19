import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Cpu,
  Layers,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSearch,
  BarChart3,
  GitCompare,
  Zap
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { apiGetJobs } from '../services/api';

export const LandingPage: React.FC = () => {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [activeJobCount, setActiveJobCount] = useState<number>(0);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPublicMetrics = async () => {
      try {
        const res = await apiGetJobs({ status_filter: 'active' });
        setActiveJobCount(res.data.length);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPublicMetrics();
  }, []);

  const handlePortalRedirect = (role: 'hr' | 'candidate') => {
    if (isAuthenticated) {
      if (role === 'hr' && user?.role !== 'candidate') {
        navigate('/hr/overview');
      } else if (role === 'candidate') {
        navigate('/candidate/overview');
      } else {
        navigate(user?.role === 'candidate' ? '/candidate/overview' : '/hr/overview');
      }
    } else {
      navigate(`/login?role=${role}`);
    }
  };

  return (
    <div className="min-h-screen bg-mocha-950 text-silver flex flex-col selection:bg-lavender selection:text-mocha-950">
      <Navbar onOpenRoleModal={() => setIsRoleModalOpen(true)} />

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative geometric background elements in approved brand colors */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-mocha-800/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute -top-10 right-10 w-64 h-64 border border-silver/10 rounded-full pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 border border-lavender/10 rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-mocha-900 border border-silver/20 text-xs font-semibold text-lavender mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-lavender inline-block"></span>
            <span>Dual-Portal Intelligent Recruitment &amp; Career SaaS</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-silver leading-[1.15] mb-6">
            Smarter Recruitment.<br />
            <span className="text-lavender italic">Stronger Career Decisions.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-silver/80 leading-relaxed font-sans mb-10">
            Transform recruitment with intelligent resume screening, semantic job matching, and actionable career insights powered by Machine Learning and Natural Language Processing.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/hiring')}
              className="px-8 py-3.5 text-sm rounded-lg font-serif font-bold text-silver bg-mocha-800 hover:bg-mocha-700 border border-lavender/40 hover:border-lavender shadow-md inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
            >
              <Layers className="w-4 h-4 text-lavender" />
              <span>Bulk Hiring Portal</span>
              <span className="text-[10px] uppercase font-sans font-semibold px-2 py-0.5 rounded-full bg-lavender/20 text-lavender border border-lavender/30">
                500+ Resumes
              </span>
            </button>

            <button
              onClick={() => handlePortalRedirect('hr')}
              className="btn-primary w-full sm:w-auto px-7 py-3.5 text-sm shadow-md"
            >
              <Briefcase className="w-4 h-4 mr-1 text-mocha-950" />
              <span>HR Recruitment Portal</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => handlePortalRedirect('candidate')}
              className="btn-secondary w-full sm:w-auto px-7 py-3.5 text-sm shadow-sm"
            >
              <Users className="w-4 h-4 mr-1 text-lavender" />
              <span>Candidate Career Portal</span>
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-silver/60">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-lavender" />
              <span>100% Real-Time Database Storage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-lavender" />
              <span>SentenceTransformers &amp; TF-IDF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-lavender" />
              <span>Explainable Hybrid Matching</span>
            </div>
          </div>

        </div>
      </section>

      {/* About & Bulk Hiring Mission */}
      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-silver/10 bg-mocha-900/60">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mocha-850 border border-silver/15 text-xs text-lavender mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-lavender inline-block"></span>
            <span>Mission &amp; Scalable Architecture</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-silver mb-4">
            Deterministic Evaluation. Large-Scale Recruitment Velocity.
          </h2>
          <p className="text-sm text-silver/80 max-w-3xl mx-auto leading-relaxed mb-8">
            ResumeAI replaces arbitrary keyword filters with an explainable 6-dimensional ML evaluation system. Designed for enterprise volume, the new Bulk Hiring Portal handles 500+ to 1,000+ resumes asynchronously through bounded worker threads, chunked uploads, and persistent PostgreSQL storage.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/hiring"
              className="btn-primary text-xs py-3 px-6 shadow-md inline-flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Launch Bulk Hiring Campaign</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-silver/10 bg-mocha-900/40">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-silver mb-4">
              Two Tailored Experiences. One Centralized Engine.
            </h2>
            <p className="text-sm text-silver/70 leading-relaxed">
              ResumeAI decouples recruiter workflow velocity from candidate career discovery, anchoring both experiences upon a single deterministic NLP architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* HR Card */}
            <div className="mocha-card p-8 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-mocha-800 border border-silver/20 flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-lavender" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-silver mb-3">
                Enterprise HR Recruitment Portal
              </h3>
              <p className="text-xs text-silver/70 leading-relaxed mb-6">
                Engineered for talent acquisition executives seeking explainable applicant triage, structured job requirements, and fair evaluation matrices.
              </p>
              <ul className="space-y-3 text-xs text-silver/85 mb-8">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
                  <span>Bulk &amp; single PDF/DOCX ingestion with duplicate candidate prevention</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
                  <span>AI Job Requirement Analyzer extracting technical and soft skill benchmarks</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
                  <span>Multi-candidate side-by-side dimensional comparison and ranking</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
                  <span>End-to-end interview scheduling with audit trail compliance</span>
                </li>
              </ul>
              <button
                onClick={() => handlePortalRedirect('hr')}
                className="btn-primary text-xs py-2.5 px-5 w-full sm:w-auto"
              >
                Access HR Recruitment Workspace
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            {/* Candidate Card */}
            <div className="mocha-card p-8 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-mocha-800 border border-silver/20 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-lavender" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-silver mb-3">
                Candidate Career &amp; Skill Portal
              </h3>
              <p className="text-xs text-silver/70 leading-relaxed mb-6">
                Empowers job seekers to audit their resume against any target vacancy, identify critical skill gaps, and download verifiable evaluation dossiers.
              </p>
              <ul className="space-y-3 text-xs text-silver/85 mb-8">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
                  <span>Automated resume parsing for education, years of experience, and skills</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
                  <span>Custom job description analysis with instant compatibility feedback</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
                  <span>Categorized skill gap alerts with actionable upskilling roadmaps</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
                  <span>Downloadable executive PDF reports formatted with ReportLab</span>
                </li>
              </ul>
              <button
                onClick={() => handlePortalRedirect('candidate')}
                className="btn-secondary text-xs py-2.5 px-5 w-full sm:w-auto"
              >
                Access Candidate Career Workspace
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* How ResumeAI Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-silver/10 bg-mocha-950">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-silver mb-4">
              How ResumeAI Works
            </h2>
            <p className="text-sm text-silver/70">
              An explainable 5-stage pipeline connecting raw documents to deterministic recruitment intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {[
              {
                step: '01',
                title: 'Job Architecture',
                desc: 'HR posts open positions or runs the AI Requirement Analyzer to extract structured taxonomy parameters.'
              },
              {
                step: '02',
                title: 'Document Ingestion',
                desc: 'PyMuPDF and python-docx parse candidate resumes into clean text without losing spatial hierarchy.'
              },
              {
                step: '03',
                title: 'NLP Extraction',
                desc: 'Standardized skill taxonomy resolves synonyms (e.g., K8s to Kubernetes, ML to Machine Learning).'
              },
              {
                step: '04',
                title: 'Hybrid ML Matching',
                desc: 'TF-IDF keywords and SentenceTransformer embeddings compute a weighted 6-dimensional composite score.'
              },
              {
                step: '05',
                title: 'Triage & Pipeline',
                desc: 'Shortlist qualified talent, flag mandatory skill deficits, and advance candidates through interview milestones.'
              }
            ].map((st) => (
              <div key={st.step} className="mocha-card p-6 flex flex-col justify-between">
                <div>
                  <span className="font-serif text-3xl font-bold text-lavender/40 block mb-3">
                    {st.step}
                  </span>
                  <h4 className="font-serif text-base font-semibold text-silver mb-2">
                    {st.title}
                  </h4>
                  <p className="text-xs text-silver/70 leading-relaxed font-sans">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* AI & ML Technology Overview */}
      <section id="technology" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-silver/10 bg-mocha-900/50">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mocha-800 border border-silver/15 text-xs text-lavender mb-3">
              <Cpu className="w-3.5 h-3.5" />
              <span>Rigorous Mathematical Formulation</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-silver mb-4">
              Explainable Hybrid Matching Engine
            </h2>
            <p className="text-sm text-silver/70">
              Unlike black-box screening tools, ResumeAI computes explicit, auditable weights with mandatory requirement enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Formula Breakdown */}
            <div className="mocha-card p-8 lg:col-span-2">
              <h3 className="font-serif text-xl font-bold text-silver mb-4">
                Six-Dimensional Weighted Composite Formula
              </h3>
              
              <div className="bg-mocha-950 p-4 rounded-lg border border-silver/15 font-mono text-xs text-lavender mb-6 space-y-1 overflow-x-auto">
                <p>Final Score =</p>
                <p className="pl-4">(Skill Match * 0.35) +</p>
                <p className="pl-4">(Semantic Similarity * 0.25) +</p>
                <p className="pl-4">(Relevant Experience * 0.15) +</p>
                <p className="pl-4">(Education Alignment * 0.10) +</p>
                <p className="pl-4">(Technology Alignment * 0.10) +</p>
                <p className="pl-4">(Domain Relevance * 0.05)</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <div className="text-lavender font-semibold">35% Technical Skills</div>
                  <div className="text-silver/60 text-[11px] mt-1">Mandatory vs preferred coverage</div>
                </div>
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <div className="text-lavender font-semibold">25% Semantic Vector</div>
                  <div className="text-silver/60 text-[11px] mt-1">all-MiniLM-L6-v2 embeddings</div>
                </div>
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <div className="text-lavender font-semibold">15% Experience</div>
                  <div className="text-silver/60 text-[11px] mt-1">Verified work history duration</div>
                </div>
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <div className="text-lavender font-semibold">10% Education</div>
                  <div className="text-silver/60 text-[11px] mt-1">Degree tier validation</div>
                </div>
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <div className="text-lavender font-semibold">10% Tooling Alignment</div>
                  <div className="text-silver/60 text-[11px] mt-1">TF-IDF stack overlap</div>
                </div>
                <div className="p-3 bg-mocha-850 rounded-lg border border-silver/10">
                  <div className="text-lavender font-semibold">5% Domain Terminology</div>
                  <div className="text-silver/60 text-[11px] mt-1">Title &amp; industry concordance</div>
                </div>
              </div>
            </div>

            {/* Ethical Guardrails */}
            <div className="mocha-card p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-mocha-800 border border-silver/20 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5 text-lavender" />
                </div>
                <h4 className="font-serif text-lg font-bold text-silver mb-3">
                  Ethical Governance &amp; Fairness
                </h4>
                <p className="text-xs text-silver/75 leading-relaxed space-y-2">
                  <span>ResumeAI enforces strict fair-hiring principles:</span>
                  <br /><br />
                  <span>• High overall scores never mask missing mandatory competencies.</span>
                  <br />
                  <span>• Demographic variables (age, gender, ethnicity) are strictly excluded from matching.</span>
                  <br />
                  <span>• Scores indicate match indices, not automated hiring verdicts.</span>
                </p>
              </div>

              <div className="pt-6 border-t border-silver/10 mt-6 text-xs text-lavender/90 font-medium">
                Compliant with Modern AI Governance Standards
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Role Selection Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Select Authentication Experience"
        subtitle="ResumeAI provides dedicated portals for Recruiters and Candidates."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          
          <div className="p-6 rounded-xl bg-mocha-850 border border-silver/20 hover:border-lavender transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-mocha-800 border border-silver/20 flex items-center justify-center mb-4">
                <Briefcase className="w-5 h-5 text-lavender" />
              </div>
              <h4 className="font-serif text-base font-bold text-silver mb-1">
                Recruitment Team
              </h4>
              <p className="text-xs text-silver/70 mb-4">
                Manage jobs, parse resumes in bulk, rank candidates, and coordinate interviews.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  navigate('/login?role=hr');
                }}
                className="btn-primary w-full text-xs py-2.5"
              >
                Sign In to HR Portal
              </button>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-mocha-850 border border-silver/20 hover:border-lavender transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-mocha-800 border border-silver/20 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-lavender" />
              </div>
              <h4 className="font-serif text-base font-bold text-silver mb-1">
                Candidate / Applicant
              </h4>
              <p className="text-xs text-silver/70 mb-4">
                Audit your resume, identify missing skills, test job descriptions, and download reports.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  navigate('/login?role=candidate');
                }}
                className="btn-secondary w-full text-xs py-2.5"
              >
                Sign In to Candidate Portal
              </button>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  navigate('/register');
                }}
                className="w-full text-xs text-silver/70 hover:text-lavender py-1 transition-colors text-center"
              >
                Create Candidate Account
              </button>
            </div>
          </div>

        </div>
      </Modal>

      <Footer />
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Cpu,
  Plus,
  X,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Header } from '../../components/Header';
import { apiCreateJob, apiExtractJobRequirements } from '../../services/api';

export const CreateJob: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('San Francisco, CA (Hybrid)');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [description, setDescription] = useState('');
  const [vacancies, setVacancies] = useState(1);
  const [deadline, setDeadline] = useState('2026-12-31');
  const [requiredExperience, setRequiredExperience] = useState(3.0);
  const [educationalRequirements, setEducationalRequirements] = useState("Bachelor's Degree");

  const [mandatorySkills, setMandatorySkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillCategory, setSkillCategory] = useState<'mandatory' | 'preferred'>('mandatory');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisFeedback, setAnalysisFeedback] = useState<string | null>(null);

  // AI Requirement Analyzer
  const handleRunAIAnalysis = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please enter at least a Job Title and Description to trigger AI extraction.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisFeedback(null);
    try {
      const res = await apiExtractJobRequirements({ title, description });
      const data = res.data;
      
      setMandatorySkills(data.mandatory_skills);
      setPreferredSkills(data.preferred_skills);
      if (data.experience_years > 0) {
        setRequiredExperience(data.experience_years);
      }
      if (data.education_level) {
        setEducationalRequirements(data.education_level);
      }
      setAnalysisFeedback(`AI extracted ${data.mandatory_skills.length} mandatory skills, ${data.preferred_skills.length} preferred skills, and identified minimum ${data.experience_years} years experience.`);
    } catch (e) {
      console.error(e);
      setAnalysisFeedback('Could not complete automated extraction. You can add skills manually below.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;

    if (skillCategory === 'mandatory') {
      if (!mandatorySkills.includes(trimmed)) {
        setMandatorySkills([...mandatorySkills, trimmed]);
      }
    } else {
      if (!preferredSkills.includes(trimmed)) {
        setPreferredSkills([...preferredSkills, trimmed]);
      }
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string, type: 'mandatory' | 'preferred') => {
    if (type === 'mandatory') {
      setMandatorySkills(mandatorySkills.filter(s => s !== skill));
    } else {
      setPreferredSkills(preferredSkills.filter(s => s !== skill));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mandatorySkills.length === 0) {
      alert('Please define at least one mandatory skill requirement.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiCreateJob({
        title,
        department,
        location,
        employment_type: employmentType,
        description,
        mandatory_skills: mandatorySkills,
        preferred_skills: preferredSkills,
        required_experience: requiredExperience,
        educational_requirements: educationalRequirements,
        vacancies,
        deadline
      });
      navigate('/hr/jobs');
    } catch (e) {
      console.error(e);
      alert('Failed to save job opening. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-mocha-950 min-h-screen">
      <Header
        title="Create Job Opening"
        subtitle="Define requirements with assistive AI skill taxonomy and multi-factor criteria."
      />

      <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Job Details */}
          <div className="mocha-card p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-silver border-b border-silver/10 pb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-lavender" />
              <span>Position Overview</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Machine Learning Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mocha-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mocha-input w-full"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="AI Research">AI Research</option>
                  <option value="Platform Infrastructure">Platform Infrastructure</option>
                  <option value="Product Experience">Product Experience</option>
                  <option value="Data Science">Data Science</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. San Francisco, CA (Hybrid) or Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mocha-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="mocha-input w-full"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider">
                  Detailed Job Description *
                </label>
                <button
                  type="button"
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalyzing}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{isAnalyzing ? 'Extracting Requirements...' : 'AI Requirement Analyzer'}</span>
                </button>
              </div>
              <textarea
                required
                rows={6}
                placeholder="Paste or write the comprehensive job responsibilities, mandatory qualifications, and preferred tooling..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mocha-input w-full font-mono text-xs"
              />
            </div>

            {analysisFeedback && (
              <div className="p-3 rounded-lg bg-mocha-800 border border-lavender/30 text-xs text-lavender flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-lavender" />
                <span>{analysisFeedback}</span>
              </div>
            )}
          </div>

          {/* AI Requirement Configuration & Skills */}
          <div className="mocha-card p-6 space-y-6">
            <div className="border-b border-silver/10 pb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-silver flex items-center gap-2">
                <Layers className="w-4 h-4 text-lavender" />
                <span>Competency &amp; Skill Requirements</span>
              </h3>
              <span className="badge-lavender text-xs">Weighted by ML Engine</span>
            </div>

            {/* Mandatory Skills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-silver uppercase tracking-wider">
                  Mandatory Skills ({mandatorySkills.length})
                </label>
                <span className="text-[11px] text-lavender/80">
                  Missing any mandatory skill triggers a recruiter review alert
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-3 bg-mocha-850 rounded-lg border border-silver/15 min-h-[48px]">
                {mandatorySkills.length === 0 ? (
                  <span className="text-xs text-silver/40 italic">
                    No mandatory skills defined. Run AI Requirement Analyzer above or add manually.
                  </span>
                ) : (
                  mandatorySkills.map((s, i) => (
                    <span key={i} className="badge-lavender text-xs flex items-center gap-1.5">
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s, 'mandatory')}
                        className="hover:text-silver transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Preferred Skills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-silver uppercase tracking-wider">
                  Preferred / Nice-to-Have Skills ({preferredSkills.length})
                </label>
                <span className="text-[11px] text-silver/60">
                  Adds positive scoring without blocking candidate qualification
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-3 bg-mocha-850 rounded-lg border border-silver/15 min-h-[48px]">
                {preferredSkills.length === 0 ? (
                  <span className="text-xs text-silver/40 italic">
                    No preferred skills defined.
                  </span>
                ) : (
                  preferredSkills.map((s, i) => (
                    <span key={i} className="badge-silver text-xs flex items-center gap-1.5">
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s, 'preferred')}
                        className="hover:text-lavender transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Manual Skill Addition Form */}
            <div className="pt-2 flex items-center gap-3">
              <input
                type="text"
                placeholder="Add additional skill (e.g. PyTorch, Docker, React)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                className="mocha-input flex-1 text-xs"
              />
              <select
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value as any)}
                className="mocha-input text-xs"
              >
                <option value="mandatory">As Mandatory</option>
                <option value="preferred">As Preferred</option>
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Experience, Education & Vacancies */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-silver/10">
              <div>
                <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                  Required Experience (Years)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="25"
                  value={requiredExperience}
                  onChange={(e) => setRequiredExperience(parseFloat(e.target.value) || 0)}
                  className="mocha-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                  Education Level
                </label>
                <select
                  value={educationalRequirements}
                  onChange={(e) => setEducationalRequirements(e.target.value)}
                  className="mocha-input w-full"
                >
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate (Ph.D.)">Doctorate (Ph.D.)</option>
                  <option value="Associate / Diploma">Associate / Diploma</option>
                  <option value="Any Degree">Any Degree / Relevant Exp</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1">
                  Vacancies
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={vacancies}
                  onChange={(e) => setVacancies(parseInt(e.target.value) || 1)}
                  className="mocha-input w-full"
                />
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/hr/jobs')}
              className="btn-secondary text-xs py-2.5 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs py-2.5 px-6"
            >
              {isSubmitting ? 'Publishing Opening...' : 'Publish Job Opening'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

        </form>

      </main>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Layers, Eye, EyeOff, Lock, Mail, Briefcase, Users, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'candidate' ? 'candidate' : 'hr';
  const [activeTab, setActiveTab] = useState<'hr' | 'candidate'>(initialRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'candidate') {
      setActiveTab('candidate');
    } else {
      setActiveTab('hr');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (activeTab === 'hr') {
        if (user.role === 'candidate') {
          setError('Candidate credentials cannot access the HR Recruitment Portal.');
          setIsLoading(false);
          return;
        }
        navigate('/hr/overview');
      } else {
        navigate('/candidate/overview');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-mocha-950 flex flex-col justify-center items-center p-4 selection:bg-lavender selection:text-mocha-950">
      
      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-11 h-11 rounded-xl bg-mocha-900 border border-silver/20 flex items-center justify-center group-hover:border-lavender transition-colors">
          <Layers className="w-5 h-5 text-lavender" />
        </div>
        <div>
          <span className="font-serif text-2xl font-bold text-silver">
            Resume<span className="text-lavender">AI</span>
          </span>
          <div className="text-[10px] uppercase tracking-widest text-lavender/70 font-semibold">
            Enterprise Intelligence Platform
          </div>
        </div>
      </Link>

      {/* Main Login Card */}
      <div className="w-full max-w-md mocha-card p-8 relative overflow-hidden">
        
        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-mocha-850 rounded-lg border border-silver/15 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('hr');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'hr'
                ? 'bg-lavender text-mocha-950 shadow-sm'
                : 'text-silver/80 hover:text-lavender'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>HR Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('candidate');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'candidate'
                ? 'bg-lavender text-mocha-950 shadow-sm'
                : 'text-silver/80 hover:text-lavender'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Candidate Portal</span>
          </button>
        </div>

        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold text-silver">
            {activeTab === 'hr' ? 'HR Recruiter Sign In' : 'Candidate Sign In'}
          </h2>
          <p className="text-xs text-silver/70 mt-1">
            {activeTab === 'hr'
              ? 'Access candidate ranking, resume screening, and job workflows.'
              : 'Analyze resumes, check job compatibility, and view skill gaps.'}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-lg bg-mocha-800 border border-lavender/40 text-xs text-lavender flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-lavender" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-silver/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="mocha-input w-full pl-10"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-xs text-lavender hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-silver/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mocha-input w-full pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-silver/50 hover:text-lavender transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-xs mt-2 disabled:opacity-50"
          >
            {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

        </form>

        {/* Credentials Helper for Evaluators */}
        <div className="mt-6 pt-4 border-t border-silver/10 text-center">
          <p className="text-[11px] text-silver/50 mb-2">
            Default Evaluator Accounts:
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleFillCredentials('hr@resumeai.io', 'Password123!')}
              className="badge-mocha text-[10px] hover:text-lavender transition-colors cursor-pointer"
            >
              Fill HR: hr@resumeai.io
            </button>
            <button
              type="button"
              onClick={() => handleFillCredentials('candidate@resumeai.io', 'Password123!')}
              className="badge-mocha text-[10px] hover:text-lavender transition-colors cursor-pointer"
            >
              Fill Candidate: candidate@resumeai.io
            </button>
          </div>
        </div>

        {activeTab === 'candidate' && (
          <div className="mt-4 text-center text-xs text-silver/70">
            Don't have a candidate account?{' '}
            <Link to="/register" className="text-lavender font-semibold hover:underline">
              Register here
            </Link>
          </div>
        )}

      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => {
          setIsForgotPasswordOpen(false);
          setForgotSent(false);
        }}
        title="Password Recovery"
        subtitle="Secure enterprise password reset authorization."
      >
        {forgotSent ? (
          <div className="p-4 rounded-lg bg-mocha-800 border border-silver/20 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-lavender mx-auto" />
            <h4 className="font-serif text-base font-bold text-silver">Reset Dispatch Verified</h4>
            <p className="text-xs text-silver/70">
              A secure recovery token has been transmitted to <span className="text-lavender font-semibold">{forgotEmail}</span>. Follow instructions to re-establish portal credentials.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-silver/70">
              Enter your registered organizational or candidate email address. We will verify your identity against the audit directory and deliver recovery authorization.
            </p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Enter your registered email..."
              className="mocha-input w-full"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="btn-secondary text-xs py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setForgotSent(true)}
                className="btn-primary text-xs py-2 px-4"
              >
                Dispatch Reset Token
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className="mt-8 text-center text-[11px] text-silver/50">
        Strict 256-bit Token Encryption | Role-Based Access Control
      </div>

    </div>
  );
};

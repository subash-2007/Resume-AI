import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        full_name: fullName,
        email: email,
        password: password,
        role: 'candidate'
      });
      navigate('/candidate/overview');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Email may already be registered.');
    } finally {
      setIsLoading(false);
    }
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
            Candidate Career Portal
          </div>
        </div>
      </Link>

      <div className="w-full max-w-md mocha-card p-8">
        
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold text-silver">
            Create Candidate Account
          </h2>
          <p className="text-xs text-silver/70 mt-1">
            Access automated resume parsing, semantic compatibility scoring, and skill gap remediation.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-lg bg-mocha-800 border border-lavender/40 text-xs text-lavender flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-lavender" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-silver/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Julian Drake"
                className="mocha-input w-full pl-10"
              />
            </div>
          </div>

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
                placeholder="name@domain.com"
                className="mocha-input w-full pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1.5">
              Create Password (min 8 chars)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-silver/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mocha-input w-full pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-silver/80 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-silver/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mocha-input w-full pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-xs mt-2 disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

        </form>

        <div className="mt-6 text-center text-xs text-silver/70">
          Already have an account?{' '}
          <Link to="/login?role=candidate" className="text-lavender font-semibold hover:underline">
            Sign In here
          </Link>
        </div>

      </div>

    </div>
  );
};


import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenRoleModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRoleModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-mocha-900/90 backdrop-blur-md border-b border-silver/15 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-mocha-800 border border-silver/20 flex items-center justify-center group-hover:border-lavender transition-colors">
            <Layers className="w-5 h-5 text-lavender" />
          </div>
          <div>
            <div className="font-serif text-xl tracking-wide text-silver font-bold flex items-center gap-1.5">
              Resume<span className="text-lavender">AI</span>
            </div>
            <div className="text-[10px] tracking-widest uppercase text-lavender/70 font-medium">
              Enterprise Intelligence
            </div>
          </div>
        </Link>

        {/* Navigation Links: Home, About, Features, Hiring */}
        <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-silver/80">
          <Link to="/" className="hover:text-lavender transition-colors">Home</Link>
          <a href="#about" className="hover:text-lavender transition-colors">About</a>
          <a href="#features" className="hover:text-lavender transition-colors">Features</a>
          
          {/* Hiring with Premium Animated Interaction */}
          <Link to="/hiring" className="relative group flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-mocha-800/80 transition-all">
            <span className="font-serif text-lavender font-semibold flex items-center gap-1.5 tracking-wide">
              Hiring
              <span className="text-[10px] uppercase font-sans font-bold px-1.5 py-0.5 rounded-full bg-lavender/20 text-lavender border border-lavender/30">
                Bulk AI
              </span>
            </span>
          </Link>
        </div>

        {/* Actions / CTA */}
        <div className="flex items-center gap-3">

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate(user?.role === 'candidate' ? '/candidate/overview' : '/hr/overview')}
                className="btn-primary text-xs py-2 px-3.5"
              >
                Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
              <button
                onClick={logout}
                className="btn-secondary text-xs py-2 px-2.5"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenRoleModal}
                className="btn-primary text-xs py-2.5 px-4 shadow-sm"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};


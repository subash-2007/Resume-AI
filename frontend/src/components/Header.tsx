import React from 'react';
import { Search, Building2, Shield, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, children }) => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-mocha-900 border-b border-silver/15 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="font-serif text-xl font-bold text-silver tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-lavender/80 font-sans mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {children}

        {/* Organization / Role Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-mocha-800 border border-silver/15 text-xs text-silver">
          <Building2 className="w-3.5 h-3.5 text-lavender" />
          <span className="font-medium text-silver/90">Aethelgard Enterprise</span>
          <span className="w-1 h-1 rounded-full bg-lavender/60"></span>
          <span className="text-lavender font-semibold capitalize text-[11px]">
            {user?.role?.replace('_', ' ') || 'User'}
          </span>
        </div>

        {/* Non-discriminatory notice pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lavender/10 border border-lavender/20 text-[11px] text-lavender font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>Fair &amp; Explainable AI</span>
        </div>
      </div>
    </header>
  );
};


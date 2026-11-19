import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  FileSearch,
  Users,
  Award,
  GitCompare,
  CalendarCheck,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  UploadCloud,
  Layers,
  Clock,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  portalType: 'hr' | 'candidate';
}

export const Sidebar: React.FC<SidebarProps> = ({ portalType }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hrNavItems = [
    { name: 'Overview', path: '/hr/overview', icon: LayoutDashboard },
    { name: 'Job Management', path: '/hr/jobs', icon: Briefcase },
    { name: 'Create Job', path: '/hr/jobs/create', icon: PlusCircle },
    { name: 'Resume Screening', path: '/hr/screening', icon: FileSearch },
    { name: 'All Candidates', path: '/hr/candidates', icon: Users },
    { name: 'Candidate Ranking', path: '/hr/ranking', icon: Award },
    { name: 'Candidate Comparison', path: '/hr/compare', icon: GitCompare },
    { name: 'Interview Management', path: '/hr/interviews', icon: CalendarCheck },
    { name: 'Recruitment Analytics', path: '/hr/analytics', icon: BarChart3 },
    { name: 'Reports', path: '/hr/reports', icon: FileText },
    { name: 'Settings', path: '/hr/settings', icon: Settings },
  ];

  const candidateNavItems = [
    { name: 'Overview', path: '/candidate/overview', icon: LayoutDashboard },
    { name: 'My Profile', path: '/candidate/profile', icon: UserCircle },
    { name: 'Upload Resume', path: '/candidate/upload', icon: UploadCloud },
    { name: 'Analyze Resume', path: '/candidate/analyze', icon: FileSearch },
    { name: 'Job Matching', path: '/candidate/matching', icon: Briefcase },
    { name: 'Skill Gap Analysis', path: '/candidate/skill-gaps', icon: Layers },
    { name: 'Analysis History', path: '/candidate/history', icon: Clock },
    { name: 'My Reports', path: '/candidate/reports', icon: FileText },
    { name: 'Settings', path: '/candidate/settings', icon: Settings },
  ];

  const items = portalType === 'hr' ? hrNavItems : candidateNavItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-mocha-900 border-r border-silver/15 flex flex-col h-screen fixed left-0 top-0 z-40 select-none">
      
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-silver/15 gap-3 bg-mocha-900">
        <div className="w-9 h-9 rounded-lg bg-mocha-800 border border-silver/20 flex items-center justify-center">
          <Layers className="w-4 h-4 text-lavender" />
        </div>
        <div>
          <div className="font-serif text-lg font-bold text-silver tracking-tight">
            Resume<span className="text-lavender">AI</span>
          </div>
          <div className="text-[10px] tracking-wider uppercase text-lavender/80 font-semibold">
            {portalType === 'hr' ? 'HR Intelligence' : 'Candidate Portal'}
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-lavender text-mocha-950 font-semibold shadow-sm'
                    : 'text-silver/85 hover:bg-mocha-800 hover:text-lavender'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout Button */}
      <div className="p-4 border-t border-silver/15 bg-mocha-950/60">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-mocha-800 border border-lavender/30 flex items-center justify-center text-xs font-bold text-lavender">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-silver truncate">
              {user?.full_name || 'Active User'}
            </div>
            <div className="text-[10px] text-lavender/70 truncate capitalize">
              {user?.role?.replace('_', ' ') || portalType}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-mocha-850 hover:bg-mocha-800 text-silver hover:text-lavender border border-silver/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
};


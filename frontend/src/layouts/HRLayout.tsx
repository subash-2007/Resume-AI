import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export const HRLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mocha-950 flex flex-col items-center justify-center gap-3 text-silver">
        <Loader2 className="w-6 h-6 animate-spin text-lavender" />
        <span className="text-xs text-silver/70 tracking-wide font-sans">
          Loading Enterprise HR Workspace...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?role=hr" replace />;
  }

  // Prevent Candidates from accessing HR routes
  if (user?.role === 'candidate') {
    return <Navigate to="/candidate/overview" replace />;
  }

  return (
    <div className="min-h-screen bg-mocha-950 flex flex-col md:flex-row">
      <Sidebar portalType="hr" />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <Outlet />
      </div>
    </div>
  );
};


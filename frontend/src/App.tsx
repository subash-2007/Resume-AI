import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BulkHiringPortal } from './pages/hiring/BulkHiringPortal';

// HR Layout & Pages
import { HRLayout } from './layouts/HRLayout';
import { HRDashboard } from './pages/hr/HRDashboard';
import { JobManagement } from './pages/hr/JobManagement';
import { CreateJob } from './pages/hr/CreateJob';
import { ResumeScreening } from './pages/hr/ResumeScreening';
import { AllCandidates } from './pages/hr/AllCandidates';
import { CandidateRankingPage } from './pages/hr/CandidateRanking';
import { CandidateComparisonPage } from './pages/hr/CandidateComparison';
import { InterviewManagement } from './pages/hr/InterviewManagement';
import { RecruitmentAnalytics } from './pages/hr/RecruitmentAnalytics';
import { HRReports } from './pages/hr/HRReports';

// Candidate Layout & Pages
import { CandidateLayout } from './layouts/CandidateLayout';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { CandidateProfile } from './pages/candidate/CandidateProfile';
import { UploadResume } from './pages/candidate/UploadResume';
import { AnalyzeResume } from './pages/candidate/AnalyzeResume';
import { SkillGapAnalysis } from './pages/candidate/SkillGapAnalysis';
import { AnalysisHistory } from './pages/candidate/AnalysisHistory';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/hiring" element={<BulkHiringPortal />} />
          <Route path="/hiring-portal" element={<Navigate to="/hiring" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* HR Recruitment Portal Routes */}
          <Route path="/hr" element={<HRLayout />}>
            <Route index element={<Navigate to="/hr/overview" replace />} />
            <Route path="overview" element={<HRDashboard />} />
            <Route path="jobs" element={<JobManagement />} />
            <Route path="jobs/create" element={<CreateJob />} />
            <Route path="screening" element={<ResumeScreening />} />
            <Route path="candidates" element={<AllCandidates />} />
            <Route path="ranking" element={<CandidateRankingPage />} />
            <Route path="compare" element={<CandidateComparisonPage />} />
            <Route path="interviews" element={<InterviewManagement />} />
            <Route path="analytics" element={<RecruitmentAnalytics />} />
            <Route path="reports" element={<HRReports />} />
            <Route path="settings" element={<HRDashboard />} />
          </Route>

          {/* Candidate Portal Routes */}
          <Route path="/candidate" element={<CandidateLayout />}>
            <Route index element={<Navigate to="/candidate/overview" replace />} />
            <Route path="overview" element={<CandidateDashboard />} />
            <Route path="profile" element={<CandidateProfile />} />
            <Route path="upload" element={<UploadResume />} />
            <Route path="analyze" element={<AnalyzeResume />} />
            <Route path="matching" element={<AnalyzeResume />} />
            <Route path="skill-gaps" element={<SkillGapAnalysis />} />
            <Route path="history" element={<AnalysisHistory />} />
            <Route path="reports" element={<AnalysisHistory />} />
            <Route path="settings" element={<CandidateProfile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

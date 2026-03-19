import React from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';
import TermosPage from './components/TermosPage';
import BlogHome from './components/BlogHome';
import BlogPost from './components/BlogPost';
import ConsultantInvite from './components/ConsultantInvite';
import InterviewLanding from './components/InterviewLanding';
import InterviewReport from './components/InterviewReport';
import ScrollToTop from './components/ScrollToTop';
import LoginPage from './components/LoginPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import ScannerContainer from './components/ScannerContainer';
import ConsultantLandingPage from './components/ConsultantLandingPage';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './hooks/useToast';
import ToastContainer from './components/ToastContainer';

function RedirectToFriendlyUrl() {
  const { code } = useParams();
  return <Navigate to={`/p/${code}`} replace />;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <ToastContainer />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/p/:code" element={<LandingPage />} />
            <Route path="/scanner" element={<ScannerContainer />} />
            <Route path="/scanner/:code" element={<ScannerContainer />} />
            <Route path="/queroserparceiro" element={<ConsultantLandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/parceiro" 
              element={
                <ProtectedRoute>
                  <RecruiterDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/convite" element={<ConsultantInvite />} />
            <Route path="/parceiro/:code" element={<RedirectToFriendlyUrl />} />
            <Route path="/termos" element={<TermosPage />} />
            <Route path="/blog" element={<BlogHome />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/entrevista" element={<InterviewLanding />} />
            <Route path="/entrevista/resultado/:sessionId" element={<InterviewReport />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

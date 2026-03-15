import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/parceiro" element={<RecruiterDashboard />} />
        <Route path="/convite" element={<ConsultantInvite />} />
        <Route path="/parceiro/:code" element={<LandingPage />} />
        <Route path="/termos" element={<TermosPage />} />
        <Route path="/blog" element={<BlogHome />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/entrevista" element={<InterviewLanding />} />
        <Route path="/entrevista/resultado/:sessionId" element={<InterviewReport />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

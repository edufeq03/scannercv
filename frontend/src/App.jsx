import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';
import TermosPage from './components/TermosPage';
import BlogHome from './components/BlogHome';
import ConsultantInvite from './components/ConsultantInvite';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/parceiro" element={<RecruiterDashboard />} />
        <Route path="/convite" element={<ConsultantInvite />} />
        <Route path="/termos" element={<TermosPage />} />
        <Route path="/blog" element={<BlogHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

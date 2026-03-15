import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, ArrowRight, ShieldCheck, Sparkles, BarChart3, Mail, Smartphone, ArrowUpRight, Target, AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function LandingPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', lgpd: false });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [isMatchLoading, setIsMatchLoading] = useState(false);
  const [partnerRef, setPartnerRef] = useState("");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setPartnerRef(ref);
      localStorage.setItem('partnerRef', ref);
    } else {
      const storedRef = localStorage.getItem('partnerRef');
      if (storedRef) setPartnerRef(storedRef);
    }
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert("Por favor, envie apenas arquivos em formato PDF.");
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitMessage(data.detail);
          return;
        }
        throw new Error(data.detail || 'Falha ao analisar o currículo');
      }

      setResult(data.result);
      setRateLimitMessage("");
      
      // Smooth scroll to result
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao processar o arquivo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.email || !leadForm.phone || !leadForm.lgpd) {
      alert("Por favor, preencha todos os campos e aceite os termos LGPD.");
      return;
    }
    setIsSubmittingLead(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', leadForm.name);
      formData.append('email', leadForm.email);
      formData.append('phone', leadForm.phone);
      if (partnerRef) {
          formData.append('source', partnerRef);
      }

      const response = await fetch('/api/lead', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Erro na requisição');
      setLeadSuccess(true);
    } catch (err) {
      alert("Ocorreu um erro ao enviar os dados. Tente novamente.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleMatch = async () => {
    if (!file || !jobDescription.trim()) return;
    setIsMatchLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('job_description', jobDescription);
      const response = await fetch('/api/match', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Erro na análise');
      setMatchResult(data.match);
      setTimeout(() => document.getElementById('match-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      alert('Erro ao analisar compatibilidade: ' + err.message);
    } finally {
      setIsMatchLoading(false);
    }
  };

  return (
    <div className="min-h-screen animate-mesh selection:bg-orange-100">
      <Navbar />

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFDD4A] text-[#094074] text-[10px] font-black tracking-widest uppercase mb-8 shadow-sm">
            <Sparkles size={12} fill="currentColor" />
            <span>TECNOLOGIA DE IA APLICADA À CARREIRA</span>
          </div>
          
          <h1 className="font-outfit text-4xl md:text-6xl font-semibold tracking-tight text-[#094074] text-center mb-6 antialiased leading-tight max-w-4xl">
            Seu currículo é <span className="text-gradient">relevante</span> <br className="hidden md:block" /> para os recrutadores?
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 mb-14 text-center max-w-xl mx-auto leading-relaxed font-normal">
            Muitas empresas usam filtros automáticos que rejeitam currículos antes mesmo de um humano vê-los. Descubra agora se o seu PDF sobrevive a essa triagem.
          </p>

          {/* Upload Area */}
          <div className="w-full max-w-2xl mx-auto mb-20 relative">
            {/* Aesthetic Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#FFDD4A]/20 to-[#5ADBFF]/20 blur-3xl opacity-50 -z-10" />
            
            <form 
              className={`relative group border-2 border-dashed rounded-[40px] p-12 md:p-20 transition-all duration-500 ease-out glass hover:shadow-2xl hover:shadow-[#094074]/10 ${
                dragActive ? 'border-[#094074] bg-[#094074]/5 scale-[1.02]' : 'border-slate-300 hover:border-[#FE9000]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onSubmit={(e) => e.preventDefault()}
            >
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept="application/pdf"
                onChange={handleChange}
              />
              
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
                {!file ? (
                  <>
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-[#FE9000] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                      <div className="relative p-7 bg-[#094074] rounded-[28px] text-white shadow-2xl shadow-[#094074]/30 group-hover:bg-[#FE9000] group-hover:-translate-y-2 transition-all duration-500">
                        <UploadCloud size={48} strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="font-outfit text-3xl font-black mb-2 text-[#094074] uppercase tracking-tight">Avaliar currículo</h3>
                    <p className="text-sm text-slate-500 text-center font-medium">Arraste seu PDF ou clique para selecionar. <br/> Grátis, seguro e instantâneo.</p>
                  </>
                ) : (
                  <>
                    <div className="p-7 bg-[#FE9000] rounded-[28px] text-white shadow-2xl shadow-[#FE9000]/30 mb-8 animate-in zoom-in-50 duration-500">
                      <FileText size={48} strokeWidth={2.5} />
                    </div>
                    <h3 className="font-outfit text-2xl font-black mb-2 text-[#094074] break-all uppercase tracking-tight">{file.name}</h3>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100">
                      <CheckCircle size={16} /> Arquivo Pronto
                    </div>
                  </>
                )}
              </label>

              {file && !result && !rateLimitMessage && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xs animate-in slide-in-from-top-4 fade-in duration-700">
                  <button 
                    onClick={handleScan}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#094074] text-white text-lg font-black rounded-2xl shadow-2xl hover:bg-black hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none uppercase tracking-[0.2em]"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        ESCANEAR
                        <ArrowUpRight size={24} strokeWidth={3} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {rateLimitMessage && (
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md animate-in slide-in-from-top-4 fade-in duration-700">
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 shadow-xl">
                    <ShieldCheck className="text-red-500 shrink-0" size={20} />
                    <p className="text-xs text-red-600 font-bold leading-tight">{rateLimitMessage}</p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Results Section - High Contrast Dark Mode */}
        {result && (
          <div id="result-section" className="max-w-5xl mx-auto mt-32 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-dark-brand rounded-[48px] overflow-hidden border border-white/10 shadow-[0_40px_100px_-20px_rgba(9,64,116,0.6)]">
              <div className="p-10 md:p-20">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-16">
                  <div className="max-w-lg">
                    <div className="inline-block px-3 py-1 bg-[#FE9000] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-md mb-6 shadow-lg shadow-[#FE9000]/20">
                      Análise Estrutural
                    </div>
                    <h2 className="font-outfit text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter leading-none">Seu Primeiro <br/> Diagnóstico</h2>
                    <p className="text-[#5ADBFF] text-lg font-medium leading-relaxed">{result.message}</p>
                  </div>
                  
                  <div className="flex items-center gap-8 p-8 glass-dark rounded-[32px] border border-white/5 shadow-2xl relative">
                    <div className="absolute -top-4 -right-4 bg-[#FE9000] p-2 rounded-xl shadow-xl text-white animate-pulse">
                      <Sparkles size={20} />
                    </div>
                    <div className="relative flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="#FE9000" strokeWidth="12" className="transition-all duration-1500" strokeDasharray={351.8} strokeDashoffset={351.8 - (351.8 * result.score_estrutural / 100)} strokeLinecap="round" />
                      </svg>
                      <span className="absolute font-outfit text-4xl font-black text-white">{result.score_estrutural}</span>
                    </div>
                    <div>
                      <div className="font-outfit font-black text-[#FFDD4A] uppercase tracking-[0.2em] text-xs mb-1">ATS Score</div>
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Saúde Estrutural</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
                  {result.analise_itens.map((item, idx) => (
                    <div key={idx} className="flex gap-5 p-7 rounded-[28px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 group">
                      <div className="flex-shrink-0">
                        {item.presente ? (
                          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                            <CheckCircle size={24} />
                          </div>
                        ) : (
                          <div className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 shadow-lg shadow-red-500/5">
                            <ShieldCheck size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-white text-sm group-hover:text-[#FE9000] transition-colors uppercase tracking-tight mb-1">{item.item}</h4>
                        <p className="text-white/50 text-xs font-medium leading-relaxed">{item.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Lead Form - High Contrast Conversion */}
                <div className="relative p-1 bg-gradient-to-br from-[#FE9000] via-[#FFDD4A] to-[#FE9000] rounded-[40px] shadow-2xl shadow-[#FE9000]/20">
                  <div className="bg-white rounded-[39px] p-10 md:p-14">
                    {leadSuccess ? (
                      <div className="text-center py-10 animate-in zoom-in-95 duration-700">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200">
                          <CheckCircle size={48} strokeWidth={3} />
                        </div>
                        <h3 className="font-outfit text-4xl font-black text-[#094074] mb-4 uppercase tracking-tighter">Relatório solicitado!</h3>
                        <p className="text-slate-600 text-lg font-medium">Prepare o e-mail: em menos de 2 minutos você receberá seu plano tático para conquistar a próxima vaga.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col xl:flex-row gap-16 items-center">
                        <div className="flex-1 text-center xl:text-left">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#094074] text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-lg mb-6">
                            VIP ANALYSIS
                          </div>
                          <h3 className="font-outfit text-4xl md:text-5xl font-black text-[#094074] mb-4 leading-none uppercase tracking-tighter">Quer o seu <br className="hidden md:block" /> Plano Tático?</h3>
                          <p className="text-slate-500 text-lg font-medium leading-relaxed">
                            Nossa IA fará uma análise profunda com dicas reais de como reescrever cada parte do seu currículo. Receba um PDF estratégico direto no seu e-mail.
                          </p>
                        </div>
                        
                        <div className="w-full xl:w-[450px] flex-shrink-0">
                          <form onSubmit={handleLeadSubmit} className="space-y-4">
                            <div className="space-y-4">
                              <input type="text" placeholder="Seu Nome Completo" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 text-base font-bold" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} required />
                              <input type="email" placeholder="Seu melhor E-mail" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 text-base font-bold" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} required />
                              <input type="tel" placeholder="Seu WhatsApp (ddd)" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 text-base font-bold" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} required />
                            </div>
                            
                            <label className="flex items-start gap-4 py-3 cursor-pointer group">
                              <input type="checkbox" className="mt-1.5 w-5 h-5 rounded-md border-2 border-slate-200 text-[#FE9000] focus:ring-[#FE9000] cursor-pointer" checked={leadForm.lgpd} onChange={e => setLeadForm({...leadForm, lgpd: e.target.checked})} required />
                              <span className="text-[11px] font-black text-slate-400 leading-tight tracking-widest group-hover:text-slate-700 transition-colors uppercase">
                                Aceito receber o relatório e mensagens estratégicas da ScannerCV.
                              </span>
                            </label>

                            <button 
                              type="submit"
                              disabled={isSubmittingLead || !leadForm.lgpd}
                              className="w-full flex items-center justify-center gap-3 px-8 py-6 bg-[#FE9000] text-white text-xl font-black rounded-2xl hover:bg-[#094074] shadow-2xl shadow-[#FE9000]/30 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-[0.25em]"
                            >
                              {isSubmittingLead ? 'PROCESSANDO...' : 'REVER MEU CV AGORA'}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Match Section — appears after ATS scan */}
        {result && (
          <div className="max-w-5xl mx-auto mt-12 px-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-10 md:p-14 hover:border-[#094074] transition-all duration-500">
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#FE9000] to-[#FFDD4A] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FE9000]/20">
                  <Target className="text-white" size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFDD4A] text-[#094074] text-[10px] font-black uppercase tracking-widest rounded-full mb-2">
                    <Zap size={10} fill="currentColor" /> NOVO — Match com Vaga
                  </div>
                  <h2 className="font-outfit text-2xl md:text-3xl font-bold text-[#094074] leading-tight">
                    Tem uma vaga em mente? Veja se você está preparado.
                  </h2>
                  <p className="text-slate-500 text-sm mt-1 font-normal">Cole a descrição da vaga e nossa IA identifica seus gaps em segundos.</p>
                </div>
              </div>

              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Cole aqui a descrição completa da vaga (requisitos, responsabilidades, skills desejadas)..."
                rows={6}
                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-300 bg-slate-50/50 text-sm font-normal text-slate-700 resize-none mb-6 leading-relaxed"
              />

              <button
                onClick={handleMatch}
                disabled={isMatchLoading || jobDescription.trim().length < 50}
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#094074] text-white font-bold rounded-2xl hover:bg-[#FE9000] shadow-xl shadow-[#094074]/20 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-sm uppercase tracking-widest"
              >
                {isMatchLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Target size={18} /> Analisar Compatibilidade</>
                )}
              </button>

              {jobDescription.trim().length > 0 && jobDescription.trim().length < 50 && (
                <p className="text-xs text-slate-400 mt-3">Cole a descrição completa da vaga para ativar a análise.</p>
              )}
            </div>

            {/* Match Result */}
            {matchResult && (
              <div id="match-section" className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-dark-brand rounded-[40px] overflow-hidden border border-white/10 shadow-[0_30px_80px_-20px_rgba(9,64,116,0.5)] p-10 md:p-14">
                  
                  {/* Header Row — Score + Summary */}
                  <div className="flex flex-col lg:flex-row gap-10 items-center mb-12">
                    <div className="relative flex-shrink-0 flex items-center justify-center">
                      <svg className="w-36 h-36 -rotate-90">
                        <circle cx="72" cy="72" r="60" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                        <circle cx="72" cy="72" r="60" fill="transparent" stroke={matchResult.score_compatibilidade >= 70 ? '#10b981' : matchResult.score_compatibilidade >= 40 ? '#FE9000' : '#ef4444'} strokeWidth="12" strokeDasharray={376.99} strokeDashoffset={376.99 - (376.99 * matchResult.score_compatibilidade / 100)} strokeLinecap="round" className="transition-all duration-1500" />
                      </svg>
                      <div className="absolute text-center">
                        <div className="font-outfit text-4xl font-bold text-white">{matchResult.score_compatibilidade}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Match</div>
                      </div>
                    </div>
                    <div className="flex-1 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FE9000] text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-4">
                        <Target size={10} /> Compatibilidade com a Vaga
                      </div>
                      <h3 className="font-outfit text-3xl font-bold text-white mb-3 leading-tight">{matchResult.resumo}</h3>
                      <p className="text-[#5ADBFF] text-sm font-normal leading-relaxed">{matchResult.recomendacao_geral}</p>
                    </div>
                  </div>

                  {/* Keywords Present */}
                  {matchResult.palavras_chave_presentes?.length > 0 && (
                    <div className="mb-10">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="text-emerald-400" size={18} />
                        <h4 className="text-white font-bold text-sm uppercase tracking-widest">Você já tem estes requisitos</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.palavras_chave_presentes.map((kw, i) => (
                          <span key={i} className="px-4 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gaps */}
                  {matchResult.gaps?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-5">
                        <AlertTriangle className="text-[#FE9000]" size={18} />
                        <h4 className="text-white font-bold text-sm uppercase tracking-widest">Gaps a desenvolver</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matchResult.gaps.map((gap, i) => {
                          const colors = {
                            'Alta': 'border-red-500/30 bg-red-500/5 text-red-400',
                            'Média': 'border-[#FE9000]/30 bg-[#FE9000]/5 text-[#FE9000]',
                            'Baixa': 'border-slate-500/30 bg-white/5 text-slate-400',
                          };
                          const badgeColors = { 'Alta': 'bg-red-500/20 text-red-400', 'Média': 'bg-[#FE9000]/20 text-[#FE9000]', 'Baixa': 'bg-slate-500/20 text-slate-400' };
                          return (
                            <div key={i} className={`p-6 rounded-2xl border ${colors[gap.importancia] || colors['Baixa']}`}>
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h5 className="text-white font-semibold text-sm">{gap.habilidade}</h5>
                                <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColors[gap.importancia] || badgeColors['Baixa']}`}>{gap.importancia}</span>
                              </div>
                              <p className="text-white/50 text-xs font-normal leading-relaxed">{gap.sugestao}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* How it Works / Step by Step Section */}
        <section id="features" className="py-24 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[#FE9000] font-black text-[10px] uppercase tracking-[0.3em]">Passo a Passo</span>
            <h2 className="font-outfit text-3xl md:text-5xl font-black text-[#094074] mt-2 uppercase tracking-tighter">Como funciona o ScannerCV?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[120px] left-[15%] right-[15%] h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent -z-10" />
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-3xl border-2 border-slate-100 shadow-xl flex items-center justify-center text-[#094074] mb-8 group hover:border-[#094074] transition-all duration-300">
                <UploadCloud size={32} />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#094074] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">1</div>
              </div>
              <h4 className="font-outfit text-xl font-bold text-slate-900 mb-4">Upload Seguro</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Você envia seu currículo em PDF. Seus dados são processados com total sigilo e não são compartilhados.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-3xl border-2 border-slate-100 shadow-xl flex items-center justify-center text-[#FE9000] mb-8 hover:border-[#FE9000] transition-all duration-300">
                <Target size={32} />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#FE9000] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">2</div>
              </div>
              <h4 className="font-outfit text-xl font-bold text-slate-900 mb-4">Análise por IA</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Nossa IA simula o olhar de um Tech Recruiter e identifica se o seu currículo passa nos filtros dos sistemas ATS.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-3xl border-2 border-slate-100 shadow-xl flex items-center justify-center text-emerald-500 mb-8 hover:border-emerald-500 transition-all duration-300">
                <FileText size={32} />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">3</div>
              </div>
              <h4 className="font-outfit text-xl font-bold text-slate-900 mb-4">Relatório Tático</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Em segundos, você recebe um diagnóstico estrutural e pode solicitar o plano de ação profundo por e-mail.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Benefits / Features - Light High Contrast */}
      <section id="vantagens" className="py-32 px-6 relative bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-outfit text-4xl md:text-6xl font-black text-[#094074] uppercase tracking-tighter mb-4">Vantagens Reais</h2>
            <div className="w-24 h-2 bg-[#FE9000] mx-auto rounded-full" />
            <p className="mt-6 text-slate-500 max-w-2xl mx-auto font-medium">ScannerCV não é só um contador de palavras. É um mentor de carreira automatizado que entende contexto e impacto.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="group p-12 rounded-[40px] bg-slate-50 border-2 border-transparent hover:border-[#094074] transition-all duration-500 shadow-sm hover:shadow-2xl">
              <div className="w-16 h-16 bg-[#094074] group-hover:bg-[#FE9000] rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-all duration-500 mb-10 shadow-xl">
                <BarChart3 size={32} strokeWidth={2.5} />
              </div>
              <h3 className="font-outfit text-2xl font-black mb-4 text-[#094074] uppercase tracking-tight">Visão Técnica</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Descubra se as informações mais importantes aparecem rápido ou se estão escondidas sob uma estrutura ruim.</p>
            </div>

            <div className="group p-12 rounded-[40px] bg-slate-50 border-2 border-transparent hover:border-[#FE9000] transition-all duration-500 shadow-sm hover:shadow-2xl">
              <div className="w-16 h-16 bg-[#3C6997] group-hover:bg-[#094074] rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-all duration-500 mb-10 shadow-xl">
                <Mail size={32} strokeWidth={2.5} />
              </div>
              <h3 className="font-outfit text-2xl font-black mb-4 text-[#094074] uppercase tracking-tight">Plano Tático</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Receba sugestões diretas de como melhorar seus textos para atrair as melhores vagas e salários.</p>
            </div>

            <div className="group p-12 rounded-[40px] bg-slate-50 border-2 border-transparent hover:border-[#FFDD4A] transition-all duration-500 shadow-sm hover:shadow-2xl">
              <div className="w-16 h-16 bg-slate-900 group-hover:bg-[#FE9000] rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-all duration-500 mb-10 shadow-xl">
                <Smartphone size={32} strokeWidth={2.5} />
              </div>
              <h3 className="font-outfit text-2xl font-black mb-4 text-[#094074] uppercase tracking-tight">Foco em Resultados</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Aprenda a destacar seus resultados e conquistas em vez de apenas listar tarefas chatas e repetitivas.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

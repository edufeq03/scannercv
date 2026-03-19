import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronRight, X, AlertCircle, Target, Zap, TrendingUp, CheckCircle2, CheckCircle, AlertTriangle, UploadCloud, FileText, ShieldCheck, ArrowUpRight, Star, MessageSquare, Users } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Navbar from './Navbar';
import Footer from './Footer';
import StoryCarousel from './StoryCarousel';

export default function ScannerContainer() {
  const { addToast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', cargo: '', area: '', vaga_alvo: '', lgpd: false });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [specialists, setSpecialists] = useState([]);
  const [isSpecialistsLoading, setIsSpecialistsLoading] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [isMatchLoading, setIsMatchLoading] = useState(false);
  const { code } = useParams();
  const [partnerRef, setPartnerRef] = useState("");
  const [intent, setIntent] = useState(null);
  const [isIntentSubmitting, setIsIntentSubmitting] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const [isCarouselComplete, setIsCarouselComplete] = useState(false);

  useEffect(() => {
    // 1. Prioritize path parameter (e.g. /p/my-code)
    if (code) {
      setPartnerRef(code);
      localStorage.setItem('partnerRef', code);
      return;
    }

    // 2. Fallback to query parameter (e.g. /?ref=my-code)
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setPartnerRef(ref);
      localStorage.setItem('partnerRef', ref);
    } else {
      // 3. Last fallback to localStorage
      const storedRef = localStorage.getItem('partnerRef');
      if (storedRef) setPartnerRef(storedRef);
    }
  }, [code]);

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
      addToast("Por favor, envie apenas arquivos em formato PDF.", 'warning');
    }
  };

  const handleScan = async () => {
    if (!file) return;
    console.log("[Scanner] handleScan iniciado para:", file.name);
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      console.log("[Scanner] Status da resposta /api/scan:", response.status, response.ok);
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
      setShowCarousel(true);
      
      // Smooth scroll to result
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("[Scanner] Erro no handleScan:", error);
      addToast("Ocorreu um erro ao processar o arquivo.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.email || !leadForm.phone || !leadForm.lgpd) {
      addToast("Por favor, preencha todos os campos e aceite os termos LGPD.", 'warning');
      return;
    }
    setIsSubmittingLead(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', leadForm.name);
      formData.append('email', leadForm.email);
      formData.append('phone', leadForm.phone);
      formData.append('cargo', leadForm.cargo);
      formData.append('area', leadForm.area);
      formData.append('vaga_alvo', leadForm.vaga_alvo);
      if (partnerRef) {
          formData.append('source', partnerRef);
      }

      const response = await fetch('/api/lead', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Erro na requisição');
      setLeadSuccess(true);
    } catch (_err) {
      addToast("Ocorreu um erro ao enviar os dados. Tente novamente.", 'error');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleCarouselComplete = async (cardsViewed, skipped) => {
    setShowCarousel(false);
    setIsCarouselComplete(true);
    
    // Log engagement
    try {
      await fetch('/api/log-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards_viewed: cardsViewed, skipped }),
      });
    } catch (e) {
      console.error("Erro ao logar carrossel:", e);
    }

    // Scroll to lead form
    setTimeout(() => {
      document.getElementById('lead-form-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleIntent = async (selection) => {
    setIntent(selection);
    setIsIntentSubmitting(true);
    try {
      if (selection === 'Sim') {
        setIsSpecialistsLoading(true);
        const resp = await fetch(`/api/specialists/recommend?area=${encodeURIComponent(leadForm.area || leadForm.cargo)}`);
        const data = await resp.json();
        setSpecialists(data);
        setIsSpecialistsLoading(false);
      }

      await fetch('/api/lead/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadForm.email,
          intent: selection
        }),
      });
      addToast("Preferência registrada com sucesso!", 'success');
      
      // Scroll to top of intent feedback if needed
      setTimeout(() => {
        document.getElementById('intent-feedback')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error("[Scanner] Erro ao registrar intenção:", err);
    } finally {
      setIsIntentSubmitting(false);
      setIsSpecialistsLoading(false);
    }
  };

  const handleSpecialistContact = async (specialistId) => {
    try {
      await fetch('/api/specialists/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_email: leadForm.email,
          specialist_id: specialistId
        }),
      });
      addToast("Interesse registrado! O especialista entrará em contato em breve.", 'success');
      setIntent('ContatoConfirmado');
    } catch (err) {
      addToast("Erro ao contatar especialista.", 'error');
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
      addToast('Erro ao analisar compatibilidade: ' + err.message, 'error');
    } finally {
      setIsMatchLoading(false);
    }
  };

  return (
    <div className="min-h-screen animate-mesh selection:bg-orange-100 bg-slate-50">
      <Navbar />

      {showCarousel && (
        <StoryCarousel 
          result={result} 
          onComplete={(viewed) => handleCarouselComplete(viewed, false)}
          onSkip={(viewed) => handleCarouselComplete(viewed, true)}
        />
      )}

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
            {/* Upload Area */}
            <div className="w-full max-w-2xl mx-auto mb-20 relative">
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
                        <h3 className="font-outfit text-3xl font-black mb-2 text-[#094074] uppercase tracking-tight text-center">Avaliar currículo</h3>
                        <p className="text-sm text-slate-500 text-center font-medium">Arraste seu PDF ou clique para selecionar. <br/> Grátis, seguro e instantâneo.</p>
                    </>
                    ) : (
                    <>
                        <div className="p-7 bg-[#FE9000] rounded-[28px] text-white shadow-2xl shadow-[#FE9000]/30 mb-8 animate-in zoom-in-50 duration-500">
                        <FileText size={48} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-outfit text-2xl font-black mb-2 text-[#094074] break-all uppercase tracking-tight text-center">{file.name}</h3>
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

        {/* Results Section */}
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
                    <p className="text-[#5ADBFF] text-lg font-medium leading-relaxed">{result?.message || 'Processando análise...'}</p>
                  </div>
                  
                  <div className="flex items-center gap-8 p-8 glass-dark rounded-[32px] border border-white/5 shadow-2xl relative">
                    <div className="absolute -top-4 -right-4 bg-[#FE9000] p-2 rounded-xl shadow-xl text-white animate-pulse">
                      <Sparkles size={20} />
                    </div>
                    <div className="relative flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="#FE9000" strokeWidth="12" className="transition-all duration-1500" strokeDasharray={351.8} strokeDashoffset={351.8 - (351.8 * (result?.score_estrutural || 0) / 100)} strokeLinecap="round" />
                      </svg>
                      <span className="absolute font-outfit text-4xl font-black text-white">{result?.score_estrutural || 0}</span>
                    </div>
                    <div>
                      <div className="font-outfit font-black text-[#FFDD4A] uppercase tracking-[0.2em] text-xs mb-1">ATS Score</div>
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Saúde Estrutural</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
                  {(result?.analise_itens || []).map((item, idx) => (
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
                        <h4 className="font-black text-white text-sm group-hover:text-[#FE9000] transition-colors uppercase tracking-tight mb-1">{item.item || 'Critério de Análise'}</h4>
                        <p className="text-white/50 text-xs font-medium leading-relaxed">{item.feedback || 'Sem feedback disponível para este item.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Lead Form */}
                {(isCarouselComplete || leadSuccess) && (
                  <div id="lead-form-section" className="relative p-1 bg-gradient-to-br from-[#FE9000] via-[#FFDD4A] to-[#FE9000] rounded-[40px] shadow-2xl shadow-[#FE9000]/20 animate-in fade-in zoom-in-95 duration-700">
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
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Seu Nome Completo" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 text-base font-bold" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} required />
                                <input type="email" placeholder="Seu melhor E-mail" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 text-base font-bold" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} required />
                                <input type="tel" placeholder="Seu WhatsApp (ddd)" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 text-base font-bold" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} required />
                                <input type="text" placeholder="Cargo Atual / Alvo" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 text-base font-bold" value={leadForm.cargo} onChange={e => setLeadForm({...leadForm, cargo: e.target.value})} required />
                                <input type="text" placeholder="Área de Atuação (ex: Tech)" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 text-base font-bold" value={leadForm.area} onChange={e => setLeadForm({...leadForm, area: e.target.value})} required />
                                <input type="text" placeholder="Vaga Favorita (opcional)" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 text-base font-bold" value={leadForm.vaga_alvo} onChange={e => setLeadForm({...leadForm, vaga_alvo: e.target.value})} />
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
                )}
              </div>
            </div>
          </div>
        )}

        {/* Job Match Section */}
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
                  <h2 className="font-outfit text-2xl md:text-3xl font-bold text-[#094074] leading-tight text-center md:text-left">
                    Tem uma vaga em mente? Veja se você está preparado.
                  </h2>
                </div>
              </div>

              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Cole aqui a descrição completa da vaga..."
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
            </div>

            {matchResult && (
              <div id="match-section" className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-dark-brand rounded-[40px] overflow-hidden border border-white/10 shadow-[0_30px_80px_-20px_rgba(9,64,116,0.5)] p-10 md:p-14">
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
                      <h3 className="font-outfit text-3xl font-bold text-white mb-3 leading-tight">{matchResult?.resumo || 'Resumo da Compatibilidade'}</h3>
                      <p className="text-[#5ADBFF] text-sm font-normal leading-relaxed">{matchResult?.recomendacao_geral || 'Calculando recomendação...'}</p>
                    </div>
                  </div>

                  {(matchResult?.palavras_chave_presentes || []).length > 0 && (
                    <div className="mb-10 text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                        <CheckCircle className="text-emerald-400" size={18} />
                        <h4 className="text-white font-bold text-sm uppercase tracking-widest">Você já tem estes requisitos</h4>
                      </div>
                      <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                        {matchResult.palavras_chave_presentes.map((kw, i) => (
                          <span key={i} className="px-4 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(matchResult?.gaps || []).length > 0 && (
                    <div className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-2 mb-5">
                        <AlertTriangle className="text-[#FE9000]" size={18} />
                        <h4 className="text-white font-bold text-sm uppercase tracking-widest">Gaps a desenvolver</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matchResult.gaps.map((gap, i) => (
                          <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/5 text-left">
                            <h5 className="text-white font-semibold text-sm mb-2">{gap.habilidade}</h5>
                            <p className="text-white/50 text-xs font-normal leading-relaxed">{gap.sugestao}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Intent Trigger Section */}
        {leadSuccess && !intent && (
          <div className="max-w-5xl mx-auto mt-12 px-2 pb-20 animate-in fade-in zoom-in duration-1000">
            <div className="bg-[#094074] rounded-[40px] p-10 md:p-14 text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-[#5ADBFF] to-emerald-400 animate-pulse" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-[#5ADBFF] text-[10px] font-black uppercase tracking-[0.3em] rounded-lg mb-8">
                  DECISÃO ESTRATÉGICA
                </div>
                
                <h3 className="font-outfit text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
                  Você quer ajuda para melhorar seus <br className="hidden md:block" /> resultados mais rápido?
                </h3>
                
                <p className="text-blue-100/60 text-lg font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                  Não adianta ter o diagnóstico se você não souber como agir. Escolha o melhor caminho para o seu momento atual.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {/* Option: Sim */}
                  <button 
                    onClick={() => handleIntent('Sim')}
                    disabled={isIntentSubmitting}
                    className="group/btn p-8 rounded-3xl bg-white hover:bg-emerald-500 transition-all duration-500 text-left flex flex-col h-full active:scale-95 border-b-8 border-slate-200 hover:border-emerald-600"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 group-hover/btn:bg-white flex items-center justify-center mb-6 transition-colors">
                      <Sparkles className="text-white group-hover/btn:text-emerald-500" size={24} />
                    </div>
                    <span className="font-black text-xl text-[#094074] group-hover/btn:text-white mb-2 uppercase tracking-tight">Sim, quero investir</span>
                    <span className="text-xs text-slate-400 group-hover/btn:text-emerald-50 font-bold leading-relaxed uppercase tracking-widest">Falar com especialistas e acelerar minha aprovação.</span>
                  </button>

                  {/* Option: Talvez */}
                  <button 
                    onClick={() => handleIntent('Talvez')}
                    disabled={isIntentSubmitting}
                    className="group/btn p-8 rounded-3xl bg-white/5 hover:bg-white/10 transition-all duration-500 text-left flex flex-col h-full active:scale-95 border border-white/10"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                      <Zap className="text-[#5ADBFF]" size={24} />
                    </div>
                    <span className="font-black text-xl text-white mb-2 uppercase tracking-tight">Talvez depois</span>
                    <span className="text-xs text-blue-100/40 font-bold leading-relaxed uppercase tracking-widest">Me envie dicas por e-mail para eu estudar sozinho por enquanto.</span>
                  </button>

                  {/* Option: Nao */}
                  <button 
                    onClick={() => handleIntent('Nao')}
                    disabled={isIntentSubmitting}
                    className="group/btn p-8 rounded-3xl bg-transparent transition-all duration-500 text-left flex flex-col h-full active:scale-95 opacity-50 hover:opacity-100"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                      <X className="text-white/40" size={24} />
                    </div>
                    <span className="font-black text-xl text-white/60 mb-2 uppercase tracking-tight table">Não por enquanto</span>
                    <span className="text-xs text-white/20 font-bold leading-relaxed uppercase tracking-widest">Vou usar apenas o plano tático gratuito enviado.</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post-Intent Feedback & Marketplace */}
        {intent && (
          <div id="intent-feedback" className="max-w-6xl mx-auto mt-12 px-2 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {intent === 'Sim' || intent === 'ContatoConfirmado' ? (
              <div className="space-y-12">
                <div className="bg-white rounded-[40px] p-10 md:p-14 text-center border-2 border-slate-100 shadow-xl overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50" />
                   
                   <div className="relative z-10">
                      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <Sparkles size={40} />
                      </div>
                      <h3 className="font-outfit text-4xl font-black text-[#094074] uppercase tracking-tighter">
                        {intent === 'ContatoConfirmado' ? 'Interesse Registrado!' : 'Excelente decisão!'}
                      </h3>
                      <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed mt-4">
                        {intent === 'ContatoConfirmado' 
                          ? 'O especialista foi notificado e entrará em contato com você em breve via WhatsApp ou E-mail.' 
                          : 'Selecionamos os melhores especialistas que se encaixam no seu perfil para te ajudar a acelerar sua aprovação.'}
                      </p>
                   </div>
                </div>

                {intent === 'Sim' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {isSpecialistsLoading ? (
                      <div className="col-span-full py-20 text-center">
                        <div className="w-12 h-12 border-4 border-[#094074]/30 border-t-[#094074] rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Buscando melhores consultores...</p>
                      </div>
                    ) : (
                      specialists.map((spec, i) => (
                        <div key={spec.id} className={`bg-white rounded-[2.5rem] border-2 ${spec.plan === 'Premium' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-100'} p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group flex flex-col h-full`}>
                          {spec.plan === 'Premium' && (
                            <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
                              <Star size={10} fill="currentColor" /> Recomendado para você
                            </div>
                          )}
                          
                          <div className="flex items-center gap-6 mb-8">
                            <img src={spec.photo_url} alt={spec.name} className="w-20 h-20 rounded-3xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-500" />
                            <div>
                              <h4 className="font-black text-[#094074] text-xl group-hover:text-emerald-500 transition-colors leading-tight mb-1">{spec.name}</h4>
                              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">{spec.title}</p>
                              <div className="flex items-center gap-1 mt-2">
                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                <span className="text-sm font-black text-slate-700">{spec.rating}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1">
                            <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                              {spec.bio}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mb-8">
                              {JSON.parse(spec.expertise_areas || "[]").map((area, idx) => (
                                <span key={idx} className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-50 mt-auto">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2 text-slate-400">
                                <Users size={16} />
                                <span className="text-xs font-bold leading-none">{spec.total_clients} atendidos</span>
                              </div>
                              <div className="text-emerald-600 font-black text-lg">{spec.price_info}</div>
                            </div>

                            <button 
                              onClick={() => handleSpecialistContact(spec.id)}
                              className="w-full py-5 bg-[#094074] group-hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                            >
                              <MessageSquare size={16} />
                              Quero falar com {spec.name.split(' ')[0]}
                            </button>
                            <p className="text-center mt-4 text-[9px] text-slate-300 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                               <Zap size={10} /> Responsa em média {spec.response_time}h
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : intent === 'Talvez' ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-blue-50 text-[#094074] rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Zap size={40} />
                  </div>
                  <h3 className="font-outfit text-4xl font-black text-[#094074] uppercase tracking-tighter">Tudo bem!</h3>
                  <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                    Você receberá em breve uma sequência de e-mails com dicas exclusivas de como otimizar seu currículo passo a passo. Fique de olho na sua caixa de entrada!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Target size={40} />
                  </div>
                  <h3 className="font-outfit text-4xl font-black text-[#094074] uppercase tracking-tighter">Finalizado com Sucesso</h3>
                  <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                    Seu relatório tático já foi enviado. Aplique as mudanças sugeridas e boa sorte na sua jornada! Estaremos aqui se precisar de ajuda no futuro.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

      <Footer />
    </div>
  );
}

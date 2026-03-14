import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, ArrowRight, ShieldCheck, Sparkles, BarChart3, Mail, Smartphone, ArrowUpRight } from 'lucide-react';

export default function LandingPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', lgpd: false });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");

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

  return (
    <div className="min-h-screen animate-mesh selection:bg-orange-100">
      {/* Navigation / Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-2xl px-6 py-3 border border-white/40">
          <div className="flex items-center gap-2">
            <div className="bg-[#094074] p-1.5 rounded-lg shadow-lg shadow-[#094074]/20">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="font-outfit font-black text-xl tracking-tighter text-slate-900 uppercase">ScannerCV</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-[#094074]/60">
            <a href="#features" className="hover:text-[#094074] transition-colors hover:scale-105 transform">Como funciona</a>
            <a href="#about" className="hover:text-[#094074] transition-colors hover:scale-105 transform">Vantagens</a>
          </div>
          <button onClick={() => window.open('/admin', '_blank')} className="text-xs font-black text-slate-900 hover:text-[#FE9000] transition-all uppercase tracking-widest border-b-2 border-[#FE9000] hover:border-[#094074]">
            Acesso Admin
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFDD4A] text-[#094074] text-[10px] font-black tracking-widest uppercase mb-8 shadow-sm">
            <Sparkles size={12} fill="currentColor" />
            <span>TECNOLOGIA DE IA APLICADA À CARREIRA</span>
          </div>
          
          <h1 className="font-outfit text-4xl md:text-6xl font-black tracking-tighter text-[#094074] text-center mb-6 antialiased leading-tight max-w-4xl">
            Seu currículo é <span className="text-gradient">relevante</span> <br className="hidden md:block" /> para os recrutadores?
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-14 text-center max-w-2xl mx-auto leading-relaxed font-medium">
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
      </main>

      {/* Benefits / Features - Light High Contrast */}
      <section id="features" className="py-32 px-6 relative bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-outfit text-4xl md:text-6xl font-black text-[#094074] uppercase tracking-tighter mb-4">Por que usar o ScannerCV?</h2>
            <div className="w-24 h-2 bg-[#FE9000] mx-auto rounded-full" />
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

      {/* Simple Footer */}
      <footer className="py-16 px-6 bg-[#094074] text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl">
              <Sparkles className="text-[#094074]" size={20} fill="currentColor" />
            </div>
            <span className="font-outfit font-black text-2xl tracking-tighter uppercase">ScannerCV</span>
          </div>
          <div className="text-sm text-white/40 font-black uppercase tracking-[0.3em] text-center">
            © 2026 ScannerCV - Tecnologia para evolução de carreira.
          </div>
        </div>
      </footer>
    </div>
  );
}

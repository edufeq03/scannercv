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

      if (!response.ok) {
        throw new Error('Falha ao analisar o currículo');
      }

      const data = await response.json();
      setResult(data.result);
      
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
    <div className="min-h-screen animate-mesh selection:bg-blue-100">
      {/* Navigation / Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-2xl px-6 py-3 border border-white/40">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="font-outfit font-black text-xl tracking-tighter text-slate-900">ScannerCV</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Como funciona</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">Vantagens</a>
          </div>
          <button onClick={() => window.open('/admin', '_blank')} className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
            Acesso Admin
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold mb-6">
            <Sparkles size={14} />
            <span>NOVO: ANÁLISE PROFUNDA COM IA 2.0</span>
          </div>
          
          <h1 className="font-outfit text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 antialiased leading-tight">
            Seu currículo é <span className="text-gradient">relevante</span> <br className="hidden md:block" /> para os recrutadores?
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Descubra em segundos se o seu CV sobrevive aos sistemas de triagem (ATS) e o que você precisa mudar para ser chamado para entrevistas.
          </p>

          {/* Upload Area */}
          <div className="max-w-2xl mx-auto mb-16">
            <form 
              className={`relative group border-2 border-dashed rounded-3xl p-10 md:p-16 transition-all duration-300 ease-in-out glass hover:shadow-2xl hover:shadow-blue-600/5 ${
                dragActive ? 'border-blue-500 bg-blue-50/30 scale-[1.01]' : 'border-slate-300 hover:border-blue-400'
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
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                      <div className="relative p-6 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/30 group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud size={40} />
                      </div>
                    </div>
                    <h3 className="font-outfit text-2xl font-bold mb-2 text-slate-800">Arraste seu PDF aqui</h3>
                    <p className="text-sm text-slate-500">Ou clique para selecionar um arquivo</p>
                  </>
                ) : (
                  <>
                    <div className="p-6 bg-emerald-500 rounded-2xl text-white shadow-xl shadow-emerald-500/20 mb-6 animate-in zoom-in-50 duration-300">
                      <FileText size={40} />
                    </div>
                    <h3 className="font-outfit text-2xl font-bold mb-2 text-slate-800 break-all">{file.name}</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-bold">
                      <CheckCircle size={16} /> Arquivo Selecionado
                    </div>
                  </>
                )}
              </label>

              {file && !result && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs animate-in slide-in-from-top-4 fade-in duration-500">
                  <button 
                    onClick={handleScan}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white text-lg font-black rounded-2xl shadow-2xl hover:bg-black hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        ESCANEAR AGORA
                        <ArrowUpRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div id="result-section" className="max-w-4xl mx-auto mt-24 animate-in fade-in slide-in-from-bottom-12 duration-700">
            <div className="glass rounded-[32px] overflow-hidden border border-white/40 shadow-2xl">
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                  <div>
                    <h2 className="font-outfit text-3xl font-black text-slate-900 mb-2">Seu Diagnóstico Estrutural</h2>
                    <p className="text-slate-600 max-w-md">{result.message}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 p-6 glass rounded-2xl border border-white/50 shadow-inner">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100" />
                        <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-blue-600 transition-all duration-1000" strokeDasharray={251} strokeDashoffset={251 - (251 * result.score_estrutural / 100)} strokeLinecap="round" />
                      </svg>
                      <span className="absolute font-outfit text-3xl font-black text-slate-900">{result.score_estrutural}</span>
                    </div>
                    <div>
                      <div className="font-outfit font-bold text-slate-800 uppercase tracking-wider text-xs">ATS Score</div>
                      <div className="text-xs text-slate-500 font-medium">Pontuação Estrutural</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                  {result.analise_itens.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-white/50 border border-white/60 hover:border-white transition-colors group">
                      <div className="flex-shrink-0 mt-0.5">
                        {item.presente ? (
                          <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                            <CheckCircle size={18} />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                            <ShieldCheck size={18} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.item}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Lead Form / Conversion */}
                <div className="relative p-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[28px] shadow-2xl shadow-blue-600/20">
                  <div className="bg-white rounded-[26px] p-8 md:p-10">
                    {leadSuccess ? (
                      <div className="text-center py-6 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <CheckCircle size={40} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-outfit text-3xl font-black text-slate-900 mb-2">Raio-X em andamento!</h3>
                        <p className="text-slate-600">Verifique seu e-mail em instantes. Nossa IA está gerando seu relatório premium agora.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-10 items-center">
                        <div className="flex-1">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md mb-4">
                            Premium Analysis
                          </div>
                          <h3 className="font-outfit text-3xl font-black text-slate-900 mb-3 leading-tight">Quer o Relatório Profundo?</h3>
                          <p className="text-slate-600 mb-0 leading-relaxed">
                            Nossa IA fará uma análise sênior (Camada 2) com dicas de mentor de carreira e planos táticos de reescrita. Receba tudo em um PDF exclusivo.
                          </p>
                        </div>
                        
                        <div className="w-full md:w-[380px] flex-shrink-0">
                          <form onSubmit={handleLeadSubmit} className="space-y-3">
                            <input type="text" placeholder="Seu Nome" className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-400 bg-slate-50/50" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} required />
                            <input type="email" placeholder="E-mail" className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-400 bg-slate-50/50" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} required />
                            <input type="tel" placeholder="WhatsApp" className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-400 bg-slate-50/50" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} required />
                            
                            <label className="flex items-start gap-3 py-2 cursor-pointer group">
                              <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={leadForm.lgpd} onChange={e => setLeadForm({...leadForm, lgpd: e.target.checked})} required />
                              <span className="text-[10px] uppercase font-bold text-slate-400 leading-tight tracking-tight group-hover:text-slate-600 transition-colors">
                                Concordo com o envio da análise e recebimento de contatos da ScannerCV.
                              </span>
                            </label>

                            <button 
                              type="submit"
                              disabled={isSubmittingLead || !leadForm.lgpd}
                              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {isSubmittingLead ? 'GERANDO...' : 'SOLICITAR RAIO-X GRÁTIS'}
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

      {/* Benefits / Features */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-10 rounded-[32px] glass hover:bg-blue-600 transition-all duration-500">
              <div className="w-14 h-14 bg-blue-600 group-hover:bg-white rounded-2xl flex items-center justify-center text-white group-hover:text-blue-600 transition-colors mb-8 shadow-xl shadow-blue-600/20">
                <BarChart3 size={28} />
              </div>
              <h3 className="font-outfit text-2xl font-black mb-4 text-slate-900 group-hover:text-white transition-colors">Análise de Dados</h3>
              <p className="text-slate-600 group-hover:text-blue-50 transition-colors leading-relaxed">Cruzamos seu currículo com as exigências técnicas mais comuns do mercado e sistemas ATS.</p>
            </div>

            <div className="group p-10 rounded-[32px] glass hover:bg-indigo-600 transition-all duration-500">
              <div className="w-14 h-14 bg-indigo-600 group-hover:bg-white rounded-2xl flex items-center justify-center text-white group-hover:text-indigo-600 transition-colors mb-8 shadow-xl shadow-indigo-600/20">
                <Mail size={28} />
              </div>
              <h3 className="font-outfit text-2xl font-black mb-4 text-slate-900 group-hover:text-white transition-colors">Relatório no E-mail</h3>
              <p className="text-slate-600 group-hover:text-indigo-50 transition-colors leading-relaxed">Nada de feedbacks genéricos. Enviamos um plano prático para você aplicar e ver resultados.</p>
            </div>

            <div className="group p-10 rounded-[32px] glass hover:bg-slate-900 transition-all duration-500">
              <div className="w-14 h-14 bg-slate-900 group-hover:bg-white rounded-2xl flex items-center justify-center text-white group-hover:text-slate-900 transition-colors mb-8 shadow-xl shadow-slate-900/20">
                <Smartphone size={28} />
              </div>
              <h3 className="font-outfit text-2xl font-black mb-4 text-slate-900 group-hover:text-white transition-colors">Suporte WhatsApp</h3>
              <p className="text-slate-600 group-hover:text-slate-400 transition-colors leading-relaxed">Conectamos você com mentores e vagas estratégicas através da nossa rede exclusiva.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
            <div className="bg-slate-900 p-1 rounded">
              <Sparkles className="text-white" size={14} />
            </div>
            <span className="font-outfit font-black tracking-tighter text-slate-900">ScannerCV</span>
          </div>
          <div className="text-sm text-slate-400 font-medium">
            © 2026 ScannerCV - Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

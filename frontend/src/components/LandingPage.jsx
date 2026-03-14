import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', lgpd: false });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const navigate = useNavigate();

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

      const response = await fetch('http://localhost:8080/api/scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha ao analisar o currículo');
      }

      const data = await response.json();
      setResult(data.result);
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

      const response = await fetch('http://localhost:8080/api/lead', {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      
      <div className="max-w-3xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 antialiased leading-tight">
          Seu currículo é <span className="text-blue-600">relevante</span> para os recrutadores?
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Faça o upload do seu CV em PDF e receba uma análise instantânea baseada nos padrões esperados pelo mercado.
        </p>

        <form 
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ease-in-out bg-white shadow-sm ${
            dragActive ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' : 'border-slate-300 hover:border-blue-400'
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
                <div className="p-4 bg-blue-100 rounded-full mb-4 text-blue-600">
                  <UploadCloud size={40} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-800">Clique para enviar ou arraste o arquivo</h3>
                <p className="text-sm text-slate-500">Apenas arquivos PDF (máx. 5MB)</p>
              </>
            ) : (
              <>
                <div className="p-4 bg-green-100 rounded-full mb-4 text-green-600">
                  <FileText size={40} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-800 break-all">{file.name}</h3>
                <p className="text-sm text-green-600 font-medium flex items-center gap-1 justify-center">
                  <CheckCircle size={16} /> Arquivo pronto para análise
                </p>
              </>
            )}
          </label>
        </form>

        {file && !result && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={handleScan}
              disabled={isLoading}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-full overflow-hidden shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  Analisar Meu Currículo
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-left animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Resultado Preliminar</h2>
            <p className="text-slate-600 mb-6">{result.message}</p>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-24 h-24 rounded-full border-8 border-blue-100 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-8 border-blue-600 border-t-transparent -rotate-45" style={{ transform: `rotate(${(result.score_estrutural / 100) * 180 - 135}deg)` }} />
                <span className="text-2xl font-black text-slate-800">{result.score_estrutural}</span>
              </div>
              <div>
                <div className="font-semibold text-slate-700">Score Estrutural</div>
                <div className="text-sm text-slate-500">Baseado em padrões ATS</div>
              </div>
            </div>

            <div className="space-y-4">
              {result.analise_itens.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="mt-1">
                    {item.presente ? <CheckCircle className="text-green-500" size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 font-bold text-xs">!</div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{item.item}</h4>
                    <p className="text-sm text-slate-600 mt-1">{item.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 pt-8 border-t border-slate-200">
              {leadSuccess ? (
                <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center">
                  <CheckCircle className="text-green-500 mx-auto mb-3" size={40} />
                  <h3 className="text-xl font-bold text-green-800 mb-2">Análise Profunda Solicitada!</h3>
                  <p className="text-green-700">Dentro de 2 minutos você receberá o PDF com o raio-x completo do seu currículo no seu e-mail.</p>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Quer um relatório profundo?</h3>
                  <p className="text-sm text-slate-600 mb-6">Nossa IA fará um raio-x completo (Camada 2) e enviaremos um PDF detalhado com dicas práticas de como reescrever seu CV direto no seu e-mail.</p>
                  
                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Seu Nome" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} required />
                      <input type="email" placeholder="Seu melhor E-mail" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} required />
                    </div>
                    <input type="tel" placeholder="WhatsApp (DDD + Número)" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} required />
                    
                    <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                      <div className="relative flex items-start pt-1">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={leadForm.lgpd} onChange={e => setLeadForm({...leadForm, lgpd: e.target.checked})} required />
                      </div>
                      <span className="text-sm text-slate-500 leading-tight">
                        Eu concordo com os Termos de Uso e Política de Privacidade e aceito receber a análise do meu currículo por e-mail e mensagens da ScannerCV no WhatsApp.
                      </span>
                    </label>

                    <button 
                      type="submit"
                      disabled={isSubmittingLead || !leadForm.lgpd}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmittingLead ? 'Processando envio...' : 'Receber Relatório Completo Grátis no E-mail'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <div className="max-w-4xl text-left grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 px-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-blue-600 font-bold text-xl mb-3">1. Upload Simples</div>
          <p className="text-slate-600">Envie seu currículo atual em formato PDF. Sem cadastros prévios ou formulários longos.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-blue-600 font-bold text-xl mb-3">2. Análise Estrutural</div>
          <p className="text-slate-600">Nosso Scanner verifica os fatores cruciais que definem se um currículo chama a atenção ou é descartado.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-blue-600 font-bold text-xl mb-3">3. Feedback Direto</div>
          <p className="text-slate-600">Receba um relatório imediato do seu desempenho estrutural e decida se quer um raio-x profundo.</p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Shield, Sparkles, Briefcase, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ConsultantInvite() {
  const [formData, setFormData] = useState({ name: '', email: '', code: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/recruiter/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          code: formData.code.toLowerCase().replace(/[^a-z0-9_]/g, '')
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Falha ao aceitar o convite.');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Parceria Confirmada!</h1>
        <p className="text-slate-600 max-w-md mx-auto mb-4">
          Seu código <strong>{formData.code}</strong> foi enviado para avaliação.
        </p>
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl w-full max-w-md mb-8 text-left shadow-sm">
          <h4 className="text-[#094074] font-bold mb-2 uppercase tracking-tighter">Próximos Passos:</h4>
          <ul className="text-slate-600 text-sm space-y-2">
            <li>📧 Verifique seu e-mail (<strong>{formData.email}</strong>).</li>
            <li>🔑 Você recebeu uma <strong>senha temporária</strong> para o primeiro acesso.</li>
            <li>📋 O termo assinado foi enviado para nossa auditoria.</li>
          </ul>
        </div>
        <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 bg-[#094074] text-white font-bold rounded-xl hover:bg-[#073059] transition-all">
          Ir para Tela de Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-lg flex flex-col md:flex-row">
          
          {/* Informações LGPD / Responsabilidades */}
          <div className="w-full md:w-5/12 bg-[#094074] text-white p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div>
              <Briefcase size={32} className="text-[#5ADBFF] mb-6" />
              <h2 className="text-3xl font-bold mb-4 leading-tight">Convite Oficial de Parceria</h2>
              <p className="text-blue-100/90 mb-8 text-sm leading-relaxed">
                Bem-vindo ao programa de consultores parceiros da ScannerCV. Entenda suas responsabilidades.
              </p>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <Shield size={20} className="text-[#FE9000] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-blue-50">Sigilo e LGPD</h4>
                    <p className="text-xs text-blue-100/70 mt-1">Os dados dos leads (telefone e e-mail) são exclusivos para a prestação de sua consultoria. É terminantemente proibida a venda, repasse ou disparo de spam para essas listas.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <FileText size={20} className="text-[#FE9000] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-blue-50">Termo de Aceite</h4>
                    <p className="text-xs text-blue-100/70 mt-1">Ao ativar seu código, um PDF com seus dados, IP e data da assinatura digital será enviado à nossa área administrativa.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="mt-12 text-[10px] text-blue-200 opacity-60">
              Plataforma ScannerCV &copy; {new Date().getFullYear()}
            </div>
          </div>

          {/* Formulário de Aceite */}
          <div className="w-full md:w-7/12 p-10 lg:p-14">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Aceitar Convite</h3>
            <p className="text-slate-500 mb-8 font-medium">Preencha seus dados para gerar seu código único de recrutador.</p>

            {error && <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: Maria Consultoria"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#094074] focus:border-transparent outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">E-mail Profissional</label>
                <input 
                  type="email" 
                  required
                  placeholder="contato@mariaconsultoria.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#094074] focus:border-transparent outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Código de Acesso Desejado</label>
                <p className="text-[11px] text-slate-500 mb-2">Este código será seu identificador único no sistema.</p>
                <input 
                  type="text" 
                  required
                  placeholder="ex: maria2026"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#094074] focus:border-transparent outline-none transition-all lowercase"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                />
              </div>

              <div className="mt-8">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#094074] text-white font-bold rounded-xl hover:bg-[#073059] disabled:bg-slate-300 transition-colors uppercase tracking-wider text-sm flex justify-center items-center shadow-md shadow-[#094074]/20"
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin mr-2" size={18} /> Aceitando Termos e Processando...</>
                  ) : (
                    "Aceitar Termos LGPD e Gerar Código"
                  )}
                </button>
                <p className="text-[10px] text-slate-400 mt-4 text-center">Ao clicar neste botão, você confirma ciência e concordância legal com o sigilo dos dados gerados.</p>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

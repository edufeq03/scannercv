import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sparkles, ArrowUpRight, CheckCircle, Target, Zap, ShieldCheck, FileText, BarChart3, Mail, Smartphone, ArrowRight, UploadCloud } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function LandingPage() {
  const { code } = useParams();

  useEffect(() => {
    // Save partner reference if present
    if (code) {
      localStorage.setItem('partnerRef', code);
    } else {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) localStorage.setItem('partnerRef', ref);
    }
  }, [code]);

  return (
    <div className="min-h-screen animate-mesh selection:bg-orange-100 bg-white">
      <Navbar />

      {/* Section 1 — Hero */}
      <main className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFDD4A] text-[#094074] text-[10px] font-black tracking-widest uppercase mb-8 shadow-sm">
            <Sparkles size={12} fill="currentColor" />
            <span>PLATAFORMA DE DIAGNÓSTICO DE CARREIRA</span>
          </div>
          
          <h1 className="font-outfit text-4xl md:text-7xl font-black tracking-tighter text-[#094074] text-center mb-6 antialiased leading-[1.1] max-w-5xl uppercase">
            Seu currículo pode estar te <span className="text-gradient">eliminando</span> antes mesmo da entrevista.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 mb-12 text-center max-w-2xl mx-auto leading-relaxed font-normal">
            Descubra exatamente por que você não está sendo chamado — e o que fazer para mudar isso agora.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link 
              to="/scanner"
              className="inline-flex items-center justify-center gap-3 px-10 py-6 bg-[#094074] text-white text-xl font-black rounded-2xl shadow-2xl hover:bg-black hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-[0.1em]"
            >
              Analisar meu currículo agora
              <ArrowUpRight size={28} strokeWidth={3} />
            </Link>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Gratuito. Resultado em menos de 2 minutos. Sem cadastro.
            </p>
          </div>
        </div>
      </main>

      {/* Section 2 — Quebra de crença */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[40px] p-10 md:p-16 border border-slate-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Target size={120} />
            </div>
            <h2 className="font-outfit text-2xl md:text-4xl font-black text-[#094074] mb-8 leading-tight">
                A maioria das pessoas acha que não consegue entrevistas por falta de experiência. 
                <br/><span className="text-[#FE9000]">Na prática, o problema costuma ser outro:</span>
            </h2>
            
            <ul className="space-y-6 mb-12">
                {[
                    "Currículos mal posicionados para a vaga",
                    "Falta de aderência ao que o recrutador busca",
                    "Eliminação automática por sistemas de triagem (ATS) antes de qualquer humano ler"
                ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                        <div className="mt-1 bg-red-100 text-red-500 p-1 rounded-full">
                            <ArrowRight size={16} strokeWidth={3} />
                        </div>
                        <span className="text-lg text-slate-700 font-bold">{item}</span>
                    </li>
                ))}
            </ul>

            <Link to="/scanner" className="text-[#094074] font-black uppercase tracking-widest text-sm hover:underline flex items-center gap-2">
                Quero descobrir meu problema <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3 — O que você vai receber */}
      <section id="vantagens" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
            <h2 className="font-outfit text-3xl md:text-5xl font-black text-[#094074] uppercase tracking-tighter">O que você vai receber</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
                { title: "Análise do currículo", desc: "Score detalhado com os erros que estão te eliminando", icon: <FileText /> },
                { title: "Compatibilidade com a vaga", desc: "Veja quanto do que o recrutador busca você está entregando", icon: <Target /> },
                { title: "Gap de habilidades", desc: "O que você precisa aprender ou destacar para chegar lá", icon: <Zap /> },
                { title: "Direção prática", desc: "Conexão com especialistas baseada no seu perfil, não em lista aleatória", icon: <ArrowUpRight /> }
            ].map((item, i) => (
                <div key={i} className="p-8 rounded-[32px] border-2 border-slate-100 hover:border-[#094074] transition-all duration-300 bg-white shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 text-[#094074] rounded-2xl flex items-center justify-center mb-6">
                        {item.icon}
                    </div>
                    <h4 className="font-outfit font-black text-[#094074] mb-3 uppercase tracking-tight leading-tight">{item.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Section 4 — Como funciona */}
      <section className="py-24 bg-[#094074] text-white px-6">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="font-outfit text-3xl md:text-5xl font-black uppercase tracking-tighter">Como funciona</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                {[
                    { step: "1. Envie seu currículo", desc: "PDF ou DOCX. Informe a vaga ou cargo desejado.", icon: <UploadCloud size={40} /> },
                    { step: "2. Receba seu diagnóstico", desc: "Score, compatibilidade, gaps e impacto real explicado em linguagem humana.", icon: <Sparkles size={40} /> },
                    { step: "3. Escolha seu caminho", desc: "Continue sozinho com o plano de ação, ou acesse especialistas recomendados para você.", icon: <CheckCircle size={40} /> }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className="mb-6 text-[#5ADBFF]">
                            {item.icon}
                        </div>
                        <h4 className="font-outfit text-xl font-bold mb-4">{item.step}</h4>
                        <p className="text-blue-100/70 text-sm leading-relaxed max-w-xs">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Section 5 — Transição */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-outfit text-3xl md:text-5xl font-black text-[#094074] mb-8 leading-tight uppercase tracking-tight">
                Imagine descobrir que você está sendo filtrado por um detalhe simples — e corrigir isso hoje.
            </h2>
            <p className="text-xl text-slate-500 mb-12 font-medium">Você tem duas opções:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div className="p-10 rounded-[40px] border-2 border-slate-100 text-left hover:bg-slate-50 transition-all">
                    <p className="text-slate-400 font-bold mb-4">OPÇÃO 1</p>
                    <p className="text-lg text-slate-700 font-bold">Continuar tentando sozinho e repetir os mesmos erros.</p>
                </div>
                <div className="p-10 rounded-[40px] border-2 border-[#FE9000] text-left bg-[#FE9000]/5 hover:bg-[#FE9000]/10 transition-all">
                    <p className="text-[#FE9000] font-bold mb-4">OPÇÃO 2</p>
                    <p className="text-lg text-[#094074] font-bold">Acelerar seu resultado com ajuda de quem faz isso todos os dias.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Section 6 — CTA Final */}
      <section className="py-24 bg-dark-brand px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#094074]/0 via-[#FE9000]/5 to-[#094074]/0 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="font-outfit text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter">Você já sabe que algo precisa mudar.</h2>
            <p className="text-[#5ADBFF] text-xl mb-12 font-bold uppercase tracking-widest">A diferença é: continuar tentando sozinho... ou agir com estratégia.</p>
            
            <Link 
              to="/scanner"
              className="inline-flex items-center justify-center gap-3 px-12 py-7 bg-[#FE9000] text-white text-2xl font-black rounded-3xl shadow-2xl hover:bg-white hover:text-[#FE9000] transition-all active:scale-95 uppercase tracking-widest"
            >
              Começar agora — é gratuito
            </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

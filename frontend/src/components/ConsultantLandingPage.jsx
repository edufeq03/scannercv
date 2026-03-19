import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Briefcase, FileText, CheckCircle, ArrowRight, Zap, BarChart3, Users, DollarSign } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ConsultantLandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-100">
      <Navbar />

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black tracking-widest uppercase mb-8">
              <Users size={14} />
              <span>PARA CONSULTORES DE CARREIRA E RECRUTADORES</span>
            </div>
            
            <h1 className="font-outfit text-4xl md:text-6xl font-black tracking-tighter text-[#094074] mb-8 leading-tight uppercase">
              Transforme Leads em <span className="text-[#FE9000]">Clientes Prontos</span> para Comprar.
            </h1>
            
            <p className="text-lg text-slate-500 mb-12 leading-relaxed font-medium">
              O ScannerCV pré-qualifica candidatos através de IA e entrega o diagnóstico pronto. <br/> 
              Você foca no que importa: <strong>ajudar profissionais a evoluirem.</strong>
            </p>

            <Link 
              to="/convite"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#094074] text-white text-lg font-black rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 uppercase tracking-widest"
            >
              Quero ser um parceiro
              <ArrowRight size={22} />
            </Link>
          </div>
          
          <div className="flex-1 relative">
            <div className="absolute -inset-10 bg-blue-100/50 blur-3xl rounded-full -z-10 animate-pulse" />
            <div className="bg-slate-50 border border-slate-200 rounded-[40px] p-8 shadow-2xl">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Automação</p>
                            <p className="text-sm font-black text-[#094074]">Triagem Inteligente via IA</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-[#FE9000]/10 text-[#FE9000] rounded-xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Qualificação</p>
                            <p className="text-sm font-black text-[#094074]">Leads com intenção real</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monetização</p>
                            <p className="text-sm font-black text-[#094074]">Marketplace Exclusivo</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* Benefits */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="font-outfit text-3xl md:text-5xl font-black text-[#094074] uppercase tracking-tighter">Por que ser um parceiro?</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { title: "Diagnóstico Automático", desc: "Seu cliente chega com um relatório pesado já em mãos, sabendo exatamente onde estão os gaps.", icon: <FileText /> },
                    { title: "Visibilidade", desc: "Apareça no nosso marketplace para candidatos que buscam ajuda especializada após o diagnóstico.", icon: <Shield /> },
                    { title: "Gestão Simplificada", desc: "Painel exclusivo para gerenciar seus leads e acompanhar seu desempenho.", icon: <BarChart3 /> }
                ].map((item, i) => (
                    <div key={i} className="p-10 bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                            {item.icon}
                        </div>
                        <h4 className="font-outfit font-black text-[#094074] mb-4 uppercase tracking-tight">{item.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center">
        <h2 className="font-outfit text-3xl md:text-5xl font-black text-[#094074] mb-8 uppercase tracking-tighter">Pronto para escalar sua consultoria?</h2>
        <Link 
          to="/convite"
          className="inline-flex items-center justify-center gap-3 px-12 py-6 bg-[#FE9000] text-white text-xl font-black rounded-2xl shadow-2xl hover:bg-[#094074] transition-all active:scale-95 uppercase tracking-widest"
        >
          Começar Agora
        </Link>
      </section>

      <Footer />
    </div>
  );
}

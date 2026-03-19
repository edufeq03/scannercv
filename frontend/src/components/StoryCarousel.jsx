import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ChevronRight, X, AlertCircle, Target, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function StoryCarousel({ result, onComplete, onSkip }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const score = result?.score_estrutural || 0;
  const gaps = result?.analise_itens?.filter(item => !item.presente) || [];

  const slides = [
    {
      title: "O que esse número significa?",
      subtitle: `Seu score é ${score}/100`,
      content: score < 50 
        ? "Isso é um sinal de alerta crítico. Currículos com este score costumam ser descartados nos primeiros 6 segundos pelos filtros automáticos (ATS)."
        : score < 75
        ? "Você está no caminho, mas ainda corre riscos. A cada 10 vagas, você provavelmente é ignorado em 6 delas antes mesmo de um humano ler seu perfil."
        : "Seu currículo é forte, mas a competição no topo é feroz. Pequenos ajustes de palavras-chave podem ser a diferença entre o 'não' e o convite.",
      icon: <AlertCircle className="text-red-500" size={48} />,
      color: "bg-red-50",
      textColor: "text-red-900"
    },
    {
      title: "Por que isso acontece?",
      subtitle: "Não é culpa sua, é o sistema.",
      content: "Empresas recebem centenas de currículos e usam robôs (ATS) para escanear palavras-chave. Se o seu documento não estiver 'escaneável', você é eliminado sem que ninguém sequer saiba quem você é.",
      icon: <Target className="text-blue-500" size={48} />,
      color: "bg-blue-50",
      textColor: "text-blue-900"
    },
    {
      title: "O gap que está te travando",
      subtitle: "Identificamos pontos críticos no seu perfil:",
      content: (
        <ul className="space-y-3 mt-4">
          {gaps.slice(0, 3).map((gap, i) => (
            <li key={i} className="flex items-start gap-2 text-sm font-medium">
              <X size={16} className="text-red-500 mt-1 shrink-0" />
              <span>{gap.item}: {gap.feedback}</span>
            </li>
          ))}
          {gaps.length === 0 && (
            <li className="flex items-start gap-2 text-sm font-medium">
              <CheckCircle2 size={16} className="text-emerald-500 mt-1 shrink-0" />
              <span>Sua estrutura está excelente, mas o conteúdo pode ser mais estratégico.</span>
            </li>
          )}
        </ul>
      ),
      icon: <Zap className="text-amber-500" size={48} />,
      color: "bg-amber-50",
      textColor: "text-amber-900"
    },
    {
      title: "O que muda com ajuda?",
      subtitle: "A estratégia vence o esforço.",
      content: "Candidatos que utilizam uma revisão estratégica aumentam em até 3x suas chances de serem chamados. O que você precisa não é de mais experiência, é de um posicionamento melhor.",
      icon: <TrendingUp className="text-emerald-500" size={48} />,
      color: "bg-emerald-50",
      textColor: "text-emerald-900"
    },
    {
      title: "Sua escolha agora",
      subtitle: "Você tem dois caminhos:",
      content: (
        <div className="space-y-4 mt-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200">
            <p className="font-bold text-[#094074]">Caminho 1: Sozinho</p>
            <p className="text-xs text-slate-500">Tentar corrigir por conta própria com o plano gratuito.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#094074] text-white">
            <p className="font-bold">Caminho 2: Expert</p>
            <p className="text-xs text-blue-100">Acelerar seu resultado com ajuda de consultores parceiros.</p>
          </div>
        </div>
      ),
      icon: <Sparkles className="text-[#094074]" size={48} />,
      color: "bg-slate-50",
      textColor: "text-slate-900"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete(currentSlide + 1, false);
    }
  };

  const skip = () => {
    onSkip(currentSlide + 1);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* ProgressBar */}
        <div className="absolute top-0 left-0 w-full h-1 flex gap-1 px-4 pt-6">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-full flex-1 rounded-full transition-all duration-500 ${i <= currentSlide ? 'bg-[#094074]' : 'bg-slate-100'}`}
            />
          ))}
        </div>

        {/* Close/Skip Button */}
        <button 
          onClick={skip}
          className="absolute top-10 right-6 text-[10px] tracking-widest font-black text-slate-400 hover:text-slate-600 transition-all uppercase"
        >
          PULAR
        </button>

        {/* Slide Container */}
        <div className="flex-1 relative overflow-hidden mt-12">
          <div 
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, i) => (
              <div key={i} className="w-full shrink-0 px-8 py-10 flex flex-col items-center text-center">
                 <div className={`w-16 h-16 ${slide.color} rounded-2xl flex items-center justify-center mb-6`}>
                    {React.cloneElement(slide.icon, { size: 32 })}
                 </div>
                 
                 <h2 className={`font-outfit text-2xl font-black mb-2 uppercase tracking-tight leading-tight ${slide.textColor}`}>
                  {slide.title}
                 </h2>
                 <p className="text-sm font-bold text-slate-400 mb-6 lowercase tracking-tight">
                  {slide.subtitle}
                 </p>
                 
                 <div className="text-slate-600 text-base leading-relaxed font-medium">
                  {typeof slide.content === 'string' ? <p>{slide.content}</p> : slide.content}
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-8 pt-0 flex flex-col items-center">
          <button 
            onClick={nextSlide}
            className="w-full py-5 bg-[#094074] text-white text-base font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-[#07305a] active:scale-[0.98] transition-all uppercase tracking-widest"
          >
            {currentSlide === slides.length - 1 ? "Ver meu diagnóstico" : "Próximo"}
            <ChevronRight size={20} />
          </button>
          <p className="mt-4 text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">
            Passo {currentSlide + 1} de {slides.length}
          </p>
        </div>
      </div>
    </div>
  );
}

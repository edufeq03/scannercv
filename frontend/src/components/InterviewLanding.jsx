import React, { useState } from 'react';
import { Mic, MessageSquare, Send, Globe, Sparkles, ArrowRight, CheckCircle, Clock, Target } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const LANGUAGES = [
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

const TEXTS = {
  pt: {
    heroTag: 'SIMULAÇÃO DE ENTREVISTA COM IA',
    heroTitle: 'Treine para sua',
    heroTitleHighlight: 'entrevista',
    heroTitleEnd: 'dos sonhos',
    heroSubtitle: 'Nossa IA simula uma entrevista técnica real com base na vaga que você deseja. Responda por texto ou áudio no WhatsApp e receba um relatório de desempenho completo.',
    phoneLabel: 'Seu WhatsApp (com DDD)',
    phonePlaceholder: '+55 11 99999-9999',
    jobLabel: 'Descrição da Vaga',
    jobPlaceholder: 'Cole aqui a descrição completa da vaga (cargo, requisitos, responsabilidades...)',
    questionsLabel: 'Número de perguntas',
    startButton: 'INICIAR SIMULAÇÃO',
    startingButton: 'CRIANDO CENÁRIO...',
    step1Title: 'Cole a Vaga',
    step1Desc: 'Copie a descrição da vaga dos sonhos e cole aqui. Nossa IA criará um cenário realista.',
    step2Title: 'Responda no WhatsApp',
    step2Desc: 'Receba perguntas progressivas e responda por texto ou áudio 🎙️ — como uma entrevista real.',
    step3Title: 'Veja seu Relatório',
    step3Desc: 'Receba um score de desempenho, pontos fortes, áreas de melhoria e dicas práticas.',
    howItWorks: 'Como Funciona',
    features: 'Por que treinar com o ScannerCV?',
    feat1Title: 'Cenário Realista',
    feat1Desc: 'A IA cria um cenário contextualizado com empresa, cargo e fase de entrevista baseado na vaga real.',
    feat2Title: 'Texto ou Áudio',
    feat2Desc: 'Responda no WhatsApp como preferir — por texto ou gravando áudios. A IA transcreve e avalia tudo.',
    feat3Title: 'Multi-Idioma',
    feat3Desc: 'Treine em Português, Inglês ou Espanhol. Perfeito para vagas internacionais.',
    feat4Title: 'Relatório Detalhado',
    feat4Desc: 'Score por pergunta, pontos fortes, gaps e recomendações estratégicas para sua próxima entrevista.',
    minChars: 'Mínimo 50 caracteres para a descrição da vaga.',
    simulationMode: 'Modo Simulação Web',
    simulationDesc: 'Sem WhatsApp? Responda aqui mesmo:',
    questionLabel: 'Pergunta',
    answerPlaceholder: 'Digite sua resposta aqui...',
    submitAnswer: 'Enviar Resposta',
    submitting: 'Avaliando...',
    viewReport: 'Ver Relatório Completo',
    feedbackLabel: 'Feedback',
    scoreLabel: 'Score',
  },
  en: {
    heroTag: 'AI INTERVIEW SIMULATION',
    heroTitle: 'Train for your',
    heroTitleHighlight: 'dream',
    heroTitleEnd: 'interview',
    heroSubtitle: 'Our AI simulates a real technical interview based on the job you want. Answer by text or audio on WhatsApp and get a complete performance report.',
    phoneLabel: 'Your WhatsApp (with country code)',
    phonePlaceholder: '+1 555 123-4567',
    jobLabel: 'Job Description',
    jobPlaceholder: 'Paste the complete job description here (role, requirements, responsibilities...)',
    questionsLabel: 'Number of questions',
    startButton: 'START SIMULATION',
    startingButton: 'CREATING SCENARIO...',
    step1Title: 'Paste the Job',
    step1Desc: 'Copy the dream job description and paste it here. Our AI will create a realistic scenario.',
    step2Title: 'Answer on WhatsApp',
    step2Desc: 'Receive progressive questions and answer by text or audio 🎙️ — like a real interview.',
    step3Title: 'See your Report',
    step3Desc: 'Get a performance score, strengths, improvement areas and practical tips.',
    howItWorks: 'How It Works',
    features: 'Why train with ScannerCV?',
    feat1Title: 'Realistic Scenario',
    feat1Desc: 'AI creates a contextualized scenario with company, role and interview stage based on the real job.',
    feat2Title: 'Text or Audio',
    feat2Desc: 'Answer on WhatsApp as you prefer — by text or recording audio. AI transcribes and evaluates everything.',
    feat3Title: 'Multi-Language',
    feat3Desc: 'Train in Portuguese, English or Spanish. Perfect for international positions.',
    feat4Title: 'Detailed Report',
    feat4Desc: 'Score per question, strengths, gaps and strategic recommendations for your next interview.',
    minChars: 'Minimum 50 characters for the job description.',
    simulationMode: 'Web Simulation Mode',
    simulationDesc: 'No WhatsApp? Answer right here:',
    questionLabel: 'Question',
    answerPlaceholder: 'Type your answer here...',
    submitAnswer: 'Submit Answer',
    submitting: 'Evaluating...',
    viewReport: 'View Full Report',
    feedbackLabel: 'Feedback',
    scoreLabel: 'Score',
  },
  es: {
    heroTag: 'SIMULACIÓN DE ENTREVISTA CON IA',
    heroTitle: 'Entrena para tu',
    heroTitleHighlight: 'entrevista',
    heroTitleEnd: 'soñada',
    heroSubtitle: 'Nuestra IA simula una entrevista técnica real basada en el puesto que deseas. Responde por texto o audio en WhatsApp y recibe un informe completo de desempeño.',
    phoneLabel: 'Tu WhatsApp (con código de país)',
    phonePlaceholder: '+34 612 345 678',
    jobLabel: 'Descripción del Puesto',
    jobPlaceholder: 'Pega aquí la descripción completa del puesto (cargo, requisitos, responsabilidades...)',
    questionsLabel: 'Número de preguntas',
    startButton: 'INICIAR SIMULACIÓN',
    startingButton: 'CREANDO ESCENARIO...',
    step1Title: 'Pega la Vacante',
    step1Desc: 'Copia la descripción del puesto soñado y pégala aquí. Nuestra IA creará un escenario realista.',
    step2Title: 'Responde en WhatsApp',
    step2Desc: 'Recibe preguntas progresivas y responde por texto o audio 🎙️ — como una entrevista real.',
    step3Title: 'Ve tu Informe',
    step3Desc: 'Obtén una puntuación, fortalezas, áreas de mejora y consejos prácticos.',
    howItWorks: 'Cómo Funciona',
    features: '¿Por qué entrenar con ScannerCV?',
    feat1Title: 'Escenario Realista',
    feat1Desc: 'La IA crea un escenario con empresa, cargo y fase de entrevista basado en el puesto real.',
    feat2Title: 'Texto o Audio',
    feat2Desc: 'Responde en WhatsApp como prefieras — por texto o grabando audio. La IA transcribe y evalúa todo.',
    feat3Title: 'Multi-Idioma',
    feat3Desc: 'Entrena en Portugués, Inglés o Español. Perfecto para puestos internacionales.',
    feat4Title: 'Informe Detallado',
    feat4Desc: 'Puntuación por pregunta, fortalezas, gaps y recomendaciones estratégicas para tu próxima entrevista.',
    minChars: 'Mínimo 50 caracteres para la descripción del puesto.',
    simulationMode: 'Modo Simulación Web',
    simulationDesc: '¿Sin WhatsApp? Responde aquí mismo:',
    questionLabel: 'Pregunta',
    answerPlaceholder: 'Escribe tu respuesta aquí...',
    submitAnswer: 'Enviar Respuesta',
    submitting: 'Evaluando...',
    viewReport: 'Ver Informe Completo',
    feedbackLabel: 'Feedback',
    scoreLabel: 'Puntuación',
  },
};

export default function InterviewLanding() {
  const [language, setLanguage] = useState('pt');
  const [phone, setPhone] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [nQuestions, setNQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerHistory, setAnswerHistory] = useState([]);

  const t = TEXTS[language];

  const handleStart = async () => {
    if (jobDescription.trim().length < 50) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone || 'web-simulation',
          language,
          job_description: jobDescription,
          n_questions: nQuestions,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error starting interview');
      setSession(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !session) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          answer: currentAnswer,
          message_type: 'text',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error submitting answer');

      setAnswerHistory([...answerHistory, {
        question: session.status === 'active' ? (session.next_question || session.first_question) : session.first_question,
        questionNumber: data.question_answered,
        answer: currentAnswer,
        score: data.score,
        feedback: data.feedback,
        transition: data.transition,
      }]);

      if (data.status === 'completed') {
        setSession({ ...session, status: 'completed', report: data.report });
      } else {
        setSession({
          ...session,
          status: data.status,
          first_question: data.next_question,
          next_question: data.next_question,
          current_question: data.next_question_number,
        });
      }
      setCurrentAnswer('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render: Simulation Mode (after session started) ─────────────────────
  if (session) {
    const currentQ = session.next_question || session.first_question;
    const isCompleted = session.status === 'completed';

    return (
      <div className="min-h-screen animate-mesh selection:bg-orange-100">
        <Navbar />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            {/* Scenario Header */}
            <div className="bg-dark-brand rounded-[32px] p-8 md:p-12 mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
              {/* WhatsApp Notice if phone was provided */}
              {session.phone && session.phone !== 'web-simulation' && (
                <div className="absolute top-0 right-0 left-0 bg-emerald-500 py-2 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-500">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                    {language === 'pt' ? 'Verifique seu WhatsApp! O bot já te chamou.' : language === 'en' ? 'Check your WhatsApp! The bot has messaged you.' : '¡Revisa tu WhatsApp! El bot te ha contactado.'}
                  </span>
                </div>
              )}
              
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FE9000] text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-4 mt-4">
                <Mic size={10} /> {t.simulationMode}
              </div>
              <h2 className="font-outfit text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-tight">
                {session.scenario?.cargo || 'Interview'} — {session.scenario?.empresa || ''}
              </h2>
              <p className="text-[#5ADBFF] text-sm font-medium">{session.scenario?.cenario || ''}</p>
              <div className="flex items-center gap-4 mt-6 text-white/40 text-xs font-bold uppercase tracking-widest">
                <span>{t.questionLabel} {session.current_question || 1} / {session.total_questions}</span>
                <span>•</span>
                <span>{LANGUAGES.find(l => l.code === language)?.flag} {language.toUpperCase()}</span>
              </div>
            </div>

            {/* Answer History */}
            {answerHistory.map((item, idx) => (
              <div key={idx} className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-[#094074] uppercase tracking-widest">{t.questionLabel} {item.questionNumber}</span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium mb-4 italic">"{item.question}"</p>
                  <div className="bg-white rounded-xl p-4 border border-slate-100 mb-3">
                    <p className="text-sm text-slate-600">{item.answer}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-black ${item.score >= 70 ? 'bg-emerald-100 text-emerald-600' : item.score >= 40 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                      {t.scoreLabel}: {item.score}/100
                    </div>
                    <p className="text-xs text-slate-500 flex-1">{item.feedback}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Current Question + Answer Input */}
            {!isCompleted && (
              <div className="bg-white rounded-[32px] p-8 md:p-12 border-2 border-dashed border-[#094074]/20 shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 bg-[#094074] rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-[#FE9000] uppercase tracking-widest">{t.questionLabel} {session.current_question || 1} / {session.total_questions}</span>
                    <p className="text-lg font-bold text-[#094074] mt-1">{currentQ}</p>
                  </div>
                </div>

                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={t.answerPlaceholder}
                  rows={5}
                  className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-300 bg-slate-50/50 text-sm font-normal text-slate-700 resize-none mb-4 leading-relaxed"
                />

                <button
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || !currentAnswer.trim()}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#094074] text-white font-bold rounded-2xl hover:bg-[#FE9000] shadow-xl shadow-[#094074]/20 transition-all active:scale-95 disabled:opacity-40 text-sm uppercase tracking-widest"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send size={16} /> {t.submitAnswer}</>
                  )}
                </button>
              </div>
            )}

            {/* Completed — Link to Report */}
            {isCompleted && (
              <div className="bg-white rounded-[32px] p-8 md:p-12 border-2 border-emerald-200 shadow-xl text-center animate-in zoom-in-95 duration-700">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
                  <CheckCircle size={40} strokeWidth={3} />
                </div>
                <h3 className="font-outfit text-3xl font-black text-[#094074] mb-3 uppercase tracking-tight">
                  {language === 'pt' ? 'Entrevista Concluída!' : language === 'en' ? 'Interview Complete!' : '¡Entrevista Completada!'}
                </h3>
                {session.report && (
                  <p className="text-5xl font-black text-[#FE9000] mb-4">{session.report.overall_score}/100</p>
                )}
                <a
                  href={`/entrevista/resultado/${session.session_id}`}
                  className="inline-flex items-center gap-3 px-10 py-5 bg-[#094074] text-white text-lg font-black rounded-2xl shadow-2xl hover:bg-[#FE9000] transition-all uppercase tracking-widest mt-4"
                >
                  {t.viewReport} <ArrowRight size={20} />
                </a>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Render: Landing (before session) ──────────────────────────────────────
  return (
    <div className="min-h-screen animate-mesh selection:bg-orange-100">
      <Navbar />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center">

          {/* Language Selector */}
          <div className="flex items-center gap-2 mb-6">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  language === lang.code
                    ? 'bg-[#094074] text-white shadow-lg shadow-[#094074]/20'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-[#094074]'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>

          {/* Hero */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFDD4A] text-[#094074] text-[10px] font-black tracking-widest uppercase mb-8 shadow-sm">
            <Mic size={12} />
            <span>{t.heroTag}</span>
          </div>

          <h1 className="font-outfit text-4xl md:text-6xl font-black tracking-tighter text-[#094074] text-center mb-6 antialiased leading-tight max-w-4xl uppercase">
            {t.heroTitle} <span className="text-gradient">{t.heroTitleHighlight}</span> <br className="hidden md:block" />{t.heroTitleEnd}
          </h1>

          <p className="text-base md:text-lg text-slate-500 mb-14 text-center max-w-xl mx-auto leading-relaxed font-normal">
            {t.heroSubtitle}
          </p>

          {/* Form */}
          <div className="w-full max-w-2xl mx-auto mb-20 relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#FFDD4A]/20 to-[#5ADBFF]/20 blur-3xl opacity-50 -z-10" />

            <div className="relative glass rounded-[40px] p-8 md:p-12 border border-slate-200 shadow-2xl">

              {/* Phone */}
              <label className="block mb-6">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">{t.phoneLabel}</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 text-base font-bold"
                />
              </label>

              {/* Job Description */}
              <label className="block mb-6">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">{t.jobLabel}</span>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={t.jobPlaceholder}
                  rows={6}
                  className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-[#094074] outline-none transition-all placeholder:text-slate-300 bg-slate-50/50 text-sm font-normal text-slate-700 resize-none leading-relaxed"
                />
                {jobDescription.trim().length > 0 && jobDescription.trim().length < 50 && (
                  <p className="text-xs text-slate-400 mt-2">{t.minChars}</p>
                )}
              </label>

              {/* Questions Slider */}
              <label className="block mb-8">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                  {t.questionsLabel}: <span className="text-[#FE9000]">{nQuestions}</span>
                </span>
                <input
                  type="range"
                  min={3}
                  max={8}
                  value={nQuestions}
                  onChange={(e) => setNQuestions(Number(e.target.value))}
                  className="w-full accent-[#094074]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                  <span>3</span><span>5</span><span>8</span>
                </div>
              </label>

              {/* Start Button */}
              <button
                onClick={handleStart}
                disabled={isLoading || jobDescription.trim().length < 50}
                className="w-full flex items-center justify-center gap-3 px-8 py-6 bg-[#094074] text-white text-xl font-black rounded-2xl shadow-2xl shadow-[#094074]/30 hover:bg-[#FE9000] transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none uppercase tracking-[0.2em]"
              >
                {isLoading ? (
                  <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> {t.startingButton}</>
                ) : (
                  <><Mic size={24} /> {t.startButton}</>
                )}
              </button>
            </div>
          </div>

          {/* How it Works */}
          <section className="py-24 max-w-6xl mx-auto w-full">
            <div className="text-center mb-16">
              <span className="text-[#FE9000] font-black text-[10px] uppercase tracking-[0.3em]">{t.howItWorks}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-[120px] left-[15%] right-[15%] h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent -z-10" />

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-3xl border-2 border-slate-100 shadow-xl flex items-center justify-center text-[#094074] mb-8 relative">
                  <Target size={32} />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#094074] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">1</div>
                </div>
                <h4 className="font-outfit text-xl font-bold text-slate-900 mb-4">{t.step1Title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{t.step1Desc}</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-3xl border-2 border-slate-100 shadow-xl flex items-center justify-center text-[#FE9000] mb-8 relative">
                  <Mic size={32} />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#FE9000] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">2</div>
                </div>
                <h4 className="font-outfit text-xl font-bold text-slate-900 mb-4">{t.step2Title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{t.step2Desc}</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-3xl border-2 border-slate-100 shadow-xl flex items-center justify-center text-emerald-500 mb-8 relative">
                  <CheckCircle size={32} />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">3</div>
                </div>
                <h4 className="font-outfit text-xl font-bold text-slate-900 mb-4">{t.step3Title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{t.step3Desc}</p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-20 max-w-7xl mx-auto w-full">
            <div className="text-center mb-16">
              <h2 className="font-outfit text-3xl md:text-5xl font-black text-[#094074] uppercase tracking-tighter mb-4">{t.features}</h2>
              <div className="w-24 h-2 bg-[#FE9000] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <Target size={28} />, title: t.feat1Title, desc: t.feat1Desc, color: '#094074' },
                { icon: <Mic size={28} />, title: t.feat2Title, desc: t.feat2Desc, color: '#FE9000' },
                { icon: <Globe size={28} />, title: t.feat3Title, desc: t.feat3Desc, color: '#3C6997' },
                { icon: <Sparkles size={28} />, title: t.feat4Title, desc: t.feat4Desc, color: '#10b981' },
              ].map((feat, idx) => (
                <div key={idx} className="group p-8 rounded-[28px] bg-white border-2 border-transparent hover:border-slate-200 transition-all duration-500 shadow-sm hover:shadow-xl">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: feat.color }}
                  >
                    {feat.icon}
                  </div>
                  <h3 className="font-outfit text-lg font-black mb-2 text-[#094074] uppercase tracking-tight">{feat.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

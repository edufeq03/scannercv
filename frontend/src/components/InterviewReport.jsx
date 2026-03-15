import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, ArrowLeft, Mic, MessageSquare, Clock, Sparkles, Target, TrendingUp } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const LABELS = {
  pt: {
    loading: 'Carregando relatório...',
    notFound: 'Sessão não encontrada.',
    backHome: 'Voltar ao início',
    tryAgain: 'Simular outra entrevista',
    reportTitle: 'Relatório de Entrevista',
    overallScore: 'Score Geral',
    performance: 'Desempenho',
    strengths: 'Pontos Fortes',
    improvements: 'Áreas de Melhoria',
    analysis: 'Análise Detalhada',
    recommendation: 'Recomendação',
    qaTitle: 'Perguntas e Respostas',
    question: 'Pergunta',
    yourAnswer: 'Sua Resposta',
    feedback: 'Feedback do Entrevistador',
    score: 'Score',
    viaAudio: 'Respondido por áudio',
    viaText: 'Respondido por texto',
    audioDuration: 'Duração',
    inProgress: 'Entrevista em andamento...',
    inProgressDesc: 'Esta entrevista ainda não foi concluída. Continue respondendo no WhatsApp ou na página de simulação.',
    jobDesc: 'Vaga Analisada',
    scenario: 'Cenário',
  },
  en: {
    loading: 'Loading report...',
    notFound: 'Session not found.',
    backHome: 'Back to home',
    tryAgain: 'Simulate another interview',
    reportTitle: 'Interview Report',
    overallScore: 'Overall Score',
    performance: 'Performance',
    strengths: 'Strengths',
    improvements: 'Areas for Improvement',
    analysis: 'Detailed Analysis',
    recommendation: 'Recommendation',
    qaTitle: 'Questions and Answers',
    question: 'Question',
    yourAnswer: 'Your Answer',
    feedback: 'Interviewer Feedback',
    score: 'Score',
    viaAudio: 'Answered by audio',
    viaText: 'Answered by text',
    audioDuration: 'Duration',
    inProgress: 'Interview in progress...',
    inProgressDesc: 'This interview has not been completed yet. Continue answering on WhatsApp or the simulation page.',
    jobDesc: 'Job Analyzed',
    scenario: 'Scenario',
  },
  es: {
    loading: 'Cargando informe...',
    notFound: 'Sesión no encontrada.',
    backHome: 'Volver al inicio',
    tryAgain: 'Simular otra entrevista',
    reportTitle: 'Informe de Entrevista',
    overallScore: 'Puntuación General',
    performance: 'Desempeño',
    strengths: 'Fortalezas',
    improvements: 'Áreas de Mejora',
    analysis: 'Análisis Detallado',
    recommendation: 'Recomendación',
    qaTitle: 'Preguntas y Respuestas',
    question: 'Pregunta',
    yourAnswer: 'Tu Respuesta',
    feedback: 'Feedback del Entrevistador',
    score: 'Puntuación',
    viaAudio: 'Respondido por audio',
    viaText: 'Respondido por texto',
    audioDuration: 'Duración',
    inProgress: 'Entrevista en curso...',
    inProgressDesc: 'Esta entrevista aún no se ha completado. Continúa respondiendo en WhatsApp o en la página de simulación.',
    jobDesc: 'Puesto Analizado',
    scenario: 'Escenario',
  },
};

export default function InterviewReport() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/interview/report/${sessionId}`);
        if (!response.ok) throw new Error('Not found');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen animate-mesh flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#094074]/20 border-t-[#094074] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-bold">{LABELS.pt.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen animate-mesh">
        <Navbar />
        <div className="pt-32 pb-20 px-6 text-center">
          <h2 className="font-outfit text-3xl font-black text-[#094074] mb-4">{LABELS.pt.notFound}</h2>
          <Link to="/entrevista" className="text-[#FE9000] font-bold hover:underline">{LABELS.pt.backHome}</Link>
        </div>
      </div>
    );
  }

  const lang = data.language || 'pt';
  const t = LABELS[lang] || LABELS.pt;
  const report = data.report;
  const scenario = data.scenario || {};

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 70) return { bg: 'bg-emerald-500', text: 'text-emerald-500', ring: '#10b981' };
    if (score >= 40) return { bg: 'bg-[#FE9000]', text: 'text-[#FE9000]', ring: '#FE9000' };
    return { bg: 'bg-red-500', text: 'text-red-500', ring: '#ef4444' };
  };

  const scoreColor = report ? getScoreColor(report.overall_score) : getScoreColor(0);

  // In-progress screen
  if (data.status === 'active') {
    return (
      <div className="min-h-screen animate-mesh">
        <Navbar />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-[#FFDD4A] text-[#094074] rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl animate-pulse">
              <Clock size={40} />
            </div>
            <h2 className="font-outfit text-3xl font-black text-[#094074] mb-4 uppercase tracking-tight">{t.inProgress}</h2>
            <p className="text-slate-500 text-lg mb-8">{t.inProgressDesc}</p>
            <Link to="/entrevista" className="inline-flex items-center gap-2 text-[#094074] font-bold hover:text-[#FE9000] transition-colors">
              <ArrowLeft size={16} /> {t.backHome}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-mesh selection:bg-orange-100">
      <Navbar />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Report Header */}
          <div className="bg-dark-brand rounded-[48px] overflow-hidden border border-white/10 shadow-[0_40px_100px_-20px_rgba(9,64,116,0.6)] mb-10">
            <div className="p-10 md:p-20">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-12">
                <div className="max-w-lg">
                  <div className="inline-block px-3 py-1 bg-[#FE9000] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-md mb-6 shadow-lg shadow-[#FE9000]/20">
                    {t.reportTitle}
                  </div>
                  <h2 className="font-outfit text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tighter leading-none">
                    {scenario.cargo || 'Interview'}
                  </h2>
                  <p className="text-[#5ADBFF] text-base font-medium mb-2">{scenario.empresa} — {scenario.fase}</p>
                  <p className="text-white/50 text-sm">{scenario.cenario}</p>
                </div>

                {/* Score Circle */}
                {report && (
                  <div className="flex items-center gap-8 p-8 glass-dark rounded-[32px] border border-white/5 shadow-2xl">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                        <circle
                          cx="64" cy="64" r="56" fill="transparent"
                          stroke={scoreColor.ring}
                          strokeWidth="12"
                          className="transition-all duration-1500"
                          strokeDasharray={351.8}
                          strokeDashoffset={351.8 - (351.8 * report.overall_score / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute font-outfit text-4xl font-black text-white">{report.overall_score}</span>
                    </div>
                    <div>
                      <div className="font-outfit font-black text-[#FFDD4A] uppercase tracking-[0.2em] text-xs mb-1">{t.overallScore}</div>
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t.performance}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Strengths + Improvements */}
              {report && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <div className="p-6 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="text-emerald-400" size={18} />
                      <h4 className="text-white font-bold text-sm uppercase tracking-widest">{t.strengths}</h4>
                    </div>
                    <ul className="space-y-2">
                      {(report.strengths || []).map((s, i) => (
                        <li key={i} className="text-emerald-300/80 text-sm font-medium flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 rounded-[24px] bg-[#FE9000]/10 border border-[#FE9000]/20">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="text-[#FE9000]" size={18} />
                      <h4 className="text-white font-bold text-sm uppercase tracking-widest">{t.improvements}</h4>
                    </div>
                    <ul className="space-y-2">
                      {(report.improvements || []).map((s, i) => (
                        <li key={i} className="text-[#FE9000]/80 text-sm font-medium flex items-start gap-2">
                          <span className="text-[#FE9000] mt-1">→</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Detailed Feedback */}
              {report && report.detailed_feedback && (
                <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/5 mb-6">
                  <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sparkles className="text-[#FFDD4A]" size={14} /> {t.analysis}
                  </h4>
                  <p className="text-white/70 text-sm leading-relaxed">{report.detailed_feedback}</p>
                </div>
              )}

              {/* Recommendation */}
              {report && report.recommendation && (
                <div className="p-6 rounded-[24px] bg-[#094074]/50 border border-[#5ADBFF]/20">
                  <h4 className="text-[#5ADBFF] font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp size={14} /> {t.recommendation}
                  </h4>
                  <p className="text-white/80 text-sm leading-relaxed">{report.recommendation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Q&A Section */}
          {data.qa_pairs && data.qa_pairs.length > 0 && (
            <div className="mb-10">
              <h3 className="font-outfit text-2xl font-black text-[#094074] mb-6 uppercase tracking-tight">{t.qaTitle}</h3>

              <div className="space-y-4">
                {data.qa_pairs.map((qa, idx) => {
                  const qScoreColor = getScoreColor(qa.score || 0);
                  return (
                    <div key={idx} className="bg-white rounded-[24px] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                      {/* Question */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 bg-[#094074] rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {qa.question_number || idx + 1}
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-[#094074] uppercase tracking-widest">{t.question} {qa.question_number || idx + 1}</span>
                          <p className="text-sm font-bold text-slate-800 mt-1">{qa.question}</p>
                        </div>
                      </div>

                      {/* Answer */}
                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.yourAnswer}</span>
                          {qa.message_type === 'audio' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded-full">
                              <Mic size={8} /> {t.viaAudio}
                              {qa.audio_duration && <span>({Math.round(qa.audio_duration)}s)</span>}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">
                              <MessageSquare size={8} /> {t.viaText}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{qa.answer}</p>
                      </div>

                      {/* Score + Feedback */}
                      <div className="flex items-start gap-4">
                        <div className={`px-3 py-1.5 rounded-full text-xs font-black ${
                          (qa.score || 0) >= 70 ? 'bg-emerald-100 text-emerald-600' :
                          (qa.score || 0) >= 40 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {qa.score || 0}/100
                        </div>
                        {qa.feedback && (
                          <p className="text-xs text-slate-500 flex-1 leading-relaxed">{qa.feedback}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center py-12">
            <Link
              to="/entrevista"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#094074] text-white text-lg font-black rounded-2xl shadow-2xl shadow-[#094074]/30 hover:bg-[#FE9000] transition-all uppercase tracking-widest"
            >
              <Target size={20} /> {t.tryAgain}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

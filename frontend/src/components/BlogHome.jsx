import React from 'react';
import { Sparkles, ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const BLOG_POSTS = [
  {
    id: 'como-passar-na-gupy-dicas',
    title: 'Como passar nos filtros da Gupy em 2026',
    excerpt: 'Entenda como os sistemas ATS avaliam seu currículo escondido por trás de robôs e palavras-chave.',
    date: '15 de Março, 2026',
    category: 'Vagas & Plataformas'
  },
  {
    id: 'verbos-de-acao-no-curriculo',
    title: 'O poder dos verbos de ação para impressionar Recrutadores',
    excerpt: 'Troque o "fui responsável por" por verbos que demonstram impacto e resultados reais (Método STAR).',
    date: '10 de Março, 2026',
    category: 'Escrita Estratégica'
  },
  {
    id: 'resumo-profissional-exemplos',
    title: '5 exemplos de Resumo Profissional que dão certo',
    excerpt: 'Pare de escrever que você "busca novos desafios". Veja o que os Tech Recruiters querem ler no topo da primeira página.',
    date: '02 de Março, 2026',
    category: 'Dicas de Currículo'
  }
];

export default function BlogHome() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-orange-50 text-[#FE9000] rounded-[24px] mb-6 shadow-sm">
             <BookOpen size={32} />
          </div>
          <h1 className="font-outfit text-4xl md:text-5xl font-black text-[#094074] mb-4 uppercase tracking-tighter">Blog de Carreira</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">Dicas, hacks e estratégias testadas para hackear os processos seletivos e acelerar sua contratação.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.map(post => (
            <Link to={`/blog/${post.id}`} key={post.id} className="group bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#094074] transition-all duration-300 flex flex-col h-full">
              <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-md mb-4 self-start">
                {post.category}
              </div>
              <h2 className="font-outfit text-xl font-bold text-slate-900 mb-3 group-hover:text-[#094074] transition-colors line-clamp-2 leading-tight">
                {post.title}
              </h2>
              <p className="text-slate-500 text-sm mb-6 flex-grow line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-medium">{post.date}</span>
                <span className="text-[#FE9000] group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={20} />
                </span>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Placeholder for SEO Content expansion */}
        <div className="mt-20 p-10 bg-[#094074] rounded-[40px] text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
          <h3 className="font-outfit text-2xl font-bold mb-3 relative z-10">Queremos escrever sobre o seu desafio.</h3>
          <p className="text-[#5ADBFF] mb-6 relative z-10">O que está bloqueando sua evolução profissional agora?</p>
          <a href="mailto:contato@scannercv.com" className="inline-flex px-6 py-3 bg-[#FE9000] text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-white hover:text-[#094074] transition-colors relative z-10">
            Sugerir Pauta
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

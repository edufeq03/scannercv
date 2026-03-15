import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag, Loader2, Sparkles, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Navbar from './Navbar';
import Footer from './Footer';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then(res => {
        if (!res.ok) throw new Error('Postagem não encontrada');
        return res.json();
      })
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching post:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
          <p className="text-slate-400 font-medium">Buscando conteúdo...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 pt-40 pb-20 text-center">
          <div className="inline-flex items-center justify-center p-6 bg-red-50 text-red-500 rounded-full mb-6">
            <Sparkles size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 uppercase">Opa! Conteúdo não encontrado.</h1>
          <p className="text-slate-500 mb-8">Essa postagem pode ter sido removida ou o link está incorreto.</p>
          <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-[#094074] text-white font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-blue-700 transition-all">
            <ArrowLeft size={16} /> Voltar ao Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-32 pb-20">
        {/* Header Artística */}
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <Link to="/blog" className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-8 hover:gap-4 transition-all">
            <ArrowLeft size={16} /> Voltar ao Blog
          </Link>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#FE9000]/10 text-[#FE9000] text-[10px] font-black uppercase tracking-widest rounded-md">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Calendar size={14} /> {post.date}
              </span>
            </div>
            
            <h1 className="font-outfit text-4xl md:text-5xl lg:text-6xl font-black text-[#094074] leading-[1.1] tracking-tighter">
              {post.title}
            </h1>
            
            <p className="text-xl text-slate-500 font-medium leading-relaxed border-l-4 border-slate-100 pl-6 italic">
              {post.excerpt}
            </p>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-slate prose-lg max-w-none 
            prose-headings:font-outfit prose-headings:font-black prose-headings:text-[#094074] prose-headings:uppercase prose-headings:tracking-tighter
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-li:text-slate-600
            prose-strong:text-slate-900 prose-strong:font-black
            prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
            bg-slate-50/50 p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
          
          {/* Footer do Post */}
          <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-[#094074] rounded-full flex items-center justify-center text-white font-black text-xl">S</div>
               <div>
                 <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Escrito por</p>
                 <p className="text-sm font-bold text-slate-900">Equipe ScannerCV</p>
               </div>
            </div>
            
            <button 
              onClick={() => {
                navigator.share({
                  title: post.title,
                  url: window.location.href
                }).catch(() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copiado!');
                });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              <Share2 size={16} /> Compartilhar Insight
            </button>
          </div>
        </div>
      </main>

      {/* Call to Action Final */}
      <section className="bg-slate-900 py-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FE9000]/10 blur-[120px] rounded-full translate-x-1/2" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-outfit text-3xl md:text-4xl font-black text-white mb-6 uppercase tracking-tighter">
            Seu currículo está pronto para o próximo nível?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Não deixe sua carreira ao acaso. Use nossa inteligência artificial para garantir que você passe em qualquer filtro.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/" className="w-full sm:w-auto px-10 py-4 bg-[#FE9000] text-white font-black rounded-[20px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-orange-500/20">
              Analisar Meu CV Grátis
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

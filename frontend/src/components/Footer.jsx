import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-16 lg:py-20 mt-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-[#094074] p-1.5 rounded-lg shadow-lg shadow-[#094074]/20">
                <Sparkles className="text-white" size={18} />
              </div>
              <span className="font-outfit font-bold text-xl tracking-tight text-slate-900">ScannerCV</span>
            </div>
            <p className="text-slate-500 max-w-md text-sm leading-relaxed mb-6">
              Ajudamos profissionais a hackear os sistemas de recrutamento através de inteligência artificial de ponta, tornando currículos invisíveis em perfis irresistíveis.
            </p>
          </div>
          
          <div>
            <h5 className="font-outfit font-black text-xs uppercase tracking-widest text-slate-900 mb-6">Plataforma</h5>
            <ul className="space-y-4 text-sm font-semibold text-slate-500">
              <li><Link to="/#features" className="hover:text-[#094074] transition-colors">Como Funciona</Link></li>
              <li><Link to="/blog" className="hover:text-[#094074] transition-colors">Blog de Carreira</Link></li>
              <li><Link to="/parceiro" className="hover:text-[#094074] transition-colors">Área do Parceiro</Link></li>
              <li><Link to="/convite" className="text-xs text-slate-400 hover:text-[#094074] transition-colors">Novas Parcerias (Convite)</Link></li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-outfit font-black text-xs uppercase tracking-widest text-slate-900 mb-6">Legal</h5>
            <ul className="space-y-4 text-sm font-semibold text-slate-500">
              <li><Link to="/termos" className="hover:text-[#094074] transition-colors">LGPD & Termos</Link></li>
              <li><Link to="/admin" className="hover:text-[#094074] transition-colors">Acesso Admin</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} ScannerCV — Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Status: Operacional IA Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

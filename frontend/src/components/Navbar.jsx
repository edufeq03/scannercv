import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const navLinks = [
    { name: 'Como funciona', href: isHome ? '#features' : '/#features' },
    { name: 'Vantagens', href: isHome ? '#vantagens' : '/#vantagens' },
    { name: 'Parceiros', to: '/parceiro' },
    { name: 'Blog', to: '/blog' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-[#094074] p-1.5 rounded-lg shadow-lg shadow-[#094074]/20">
            <Sparkles className="text-white" size={18} />
          </div>
          <span className="font-outfit font-bold text-lg tracking-tight text-slate-900">ScannerCV</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest">
          {navLinks.map((link) => (
            link.to ? (
              <Link 
                key={link.name} 
                to={link.to} 
                className={`${location.pathname === link.to ? 'text-[#094074]' : 'text-slate-400'} hover:text-[#094074] transition-colors`}
              >
                {link.name}
              </Link>
            ) : (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-slate-400 hover:text-[#094074] transition-colors"
              >
                {link.name}
              </a>
            )
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-xs font-semibold text-slate-500 hover:text-[#FE9000] transition-all uppercase tracking-widest">
            Acesso Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}

import React, { useState, useEffect } from 'react';
import { Layout, Users, Calendar, ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecruiterDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authKey, setAuthKey] = useState(localStorage.getItem('recruiter_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (authKey) {
      fetchLeads();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchLeads = async (key = authKey) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/recruiter/leads?recruiter_key=${key}`);
      if (!response.ok) {
        if (response.status === 403) throw new Error('Código de acesso inválido.');
        throw new Error('Erro ao carregar leads da consultoria.');
      }
      const data = await response.json();
      setLeads(data);
      setIsAuthenticated(true);
      localStorage.setItem('recruiter_key', key);
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    fetchLeads(authKey);
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Portal da Consultoria</h1>
            <p className="text-slate-500 mb-6 text-sm italic">ScannerCV Parceiros</p>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
            
            <form onSubmit={handleLogin} className="space-y-4">
                <input 
                    type="password" 
                    placeholder="Seu Código de Acesso"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                    required
                />
                <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-wider text-sm">
                    Acessar meus Leads
                </button>
            </form>
            <Link to="/" className="mt-6 inline-flex items-center text-slate-400 hover:text-slate-600 text-sm gap-2">
                <ArrowLeft size={16} /> Voltar ao site
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Users size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900 leading-tight">Painel do Consultor</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-tighter">Meus Leads Capturados</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">{leads.length} Leads</span>
                <button 
                  onClick={() => { localStorage.removeItem('recruiter_key'); setIsAuthenticated(false); }}
                  className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                >
                    Sair
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Visão Geral</h1>
            <p className="text-slate-600">Acompanhe os candidatos que solicitaram análise do currículo.</p>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-slate-500 font-medium tracking-wide italic">Carregando seus leads...</p>
            </div>
        ) : leads.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700">Nenhum lead encontrado</h3>
                <p className="text-slate-500">Divulgue seu link e comece a capturar análises!</p>
            </div>
        ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidato / Telefone</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50 transition-colors bg-white">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{lead.name}</div>
                                        <div className="text-xs text-slate-500 font-medium">{lead.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{lead.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                                            lead.status === 'Concluído' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

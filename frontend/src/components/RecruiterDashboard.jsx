import React, { useState, useEffect } from 'react';
import { Users, Loader2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RecruiterDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authFetch, logout, recruiter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (recruiter?.must_change_password) {
      navigate('/change-password');
      return;
    }
    fetchLeads();
  }, [recruiter, navigate]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`/api/recruiter/leads`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          navigate('/');
          return;
        }
        throw new Error('Erro ao carregar leads da consultoria.');
      }
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
                <div className="text-right mr-2 hidden md:block">
                  <div className="text-sm font-bold text-slate-900">{recruiter?.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{recruiter?.code}</div>
                </div>
                <span className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">{leads.length} Leads</span>
                <button 
                  onClick={() => { logout(); navigate('/'); }}
                  className="text-sm text-slate-500 hover:text-red-600 transition-colors font-medium"
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

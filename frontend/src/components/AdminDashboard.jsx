import React, { useState, useEffect } from 'react';
import { Layout, Users, FileText, Calendar, ArrowLeft, Loader2, ExternalLink, X, Mail, Smartphone, Target, Briefcase, TrendingUp, Settings, Save, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authKey, setAuthKey] = useState(localStorage.getItem('admin_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState('leads'); // 'leads', 'partners', 'prompts'
  const [partners, setPartners] = useState([]);
  const [isPartnersLoading, setIsPartnersLoading] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [isPromptsLoading, setIsPromptsLoading] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

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
      const response = await fetch(`http://localhost:8080/api/admin/leads?admin_key=${key}`);
      if (!response.ok) {
        if (response.status === 403) throw new Error('Chave de acesso inválida.');
        throw new Error('Erro ao carregar leads.');
      }
      const data = await response.json();
      setLeads(data.leads || data);
      setIsAuthenticated(true);
      localStorage.setItem('admin_key', key);
      
      // Fetch others
      fetchPartners(key);
      fetchPrompts(key);
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrompts = async (key = authKey) => {
    setIsPromptsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/admin/prompts?admin_key=${key}`);
      if (response.ok) {
        const data = await response.json();
        setPrompts(data);
      }
    } catch (err) {
      console.error("Erro ao carregar prompts:", err);
    } finally {
      setIsPromptsLoading(false);
    }
  };

  const savePrompt = async (slug, system, user) => {
    setIsSavingPrompt(true);
    try {
      const formData = new FormData();
      formData.append('admin_key', authKey);
      formData.append('slug', slug);
      formData.append('system_instructions', system);
      formData.append('user_instructions', user);

      const response = await fetch('http://localhost:8080/api/admin/prompts', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        fetchPrompts();
        alert('Prompt atualizado com sucesso!');
      } else {
        alert('Falha ao salvar prompt.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const fetchPartners = async (key = authKey) => {
    setIsPartnersLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/admin/recruiters?admin_key=${key}`);
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      }
    } catch (err) {
      console.error("Erro ao carregar parceiros:", err);
    } finally {
      setIsPartnersLoading(false);
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
            <Layout className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Administrativo</h1>
            <p className="text-slate-500 mb-6 text-sm italic">ScannerCV Manager v1.0</p>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
            
            <form onSubmit={handleLogin} className="space-y-4">
                <input 
                    type="password" 
                    placeholder="Chave de Acesso"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                    required
                />
                <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-wider text-sm">
                    Entrar no Painel
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
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Layout size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900 leading-tight">Painel Admin</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-tighter">ScannerCV Dashboard</p>
                </div>
            </div>
            
            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('leads')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'leads' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Candidatos (Leads)
              </button>
              <button 
                onClick={() => setActiveTab('partners')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'partners' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Parceiros
              </button>
              <button 
                onClick={() => setActiveTab('prompts')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'prompts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Prompts IA
              </button>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">{leads.length} Leads</span>
                <button 
                  onClick={() => { localStorage.removeItem('admin_key'); setIsAuthenticated(false); }}
                  className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                >
                    Sair
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
              {activeTab === 'leads' ? 'Visão Geral de Leads' : 'Gestão de Parceiros'}
            </h1>
            <p className="text-slate-600">
              {activeTab === 'leads' && 'Acompanhe as requisições de análise profunda em tempo real.'}
              {activeTab === 'partners' && 'Gerencie os consultores e acompanhe a taxa de conversão de cada um.'}
              {activeTab === 'prompts' && 'Ajuste as instruções da IA para análise de currículo e match de vagas.'}
            </p>
        </div>
        {loading || (activeTab === 'partners' && isPartnersLoading) ? (
            <div className="flex flex-col items-center justify-center p-20">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-slate-500 font-medium tracking-wide italic italic">Sincronizando dados...</p>
            </div>
        ) : activeTab === 'leads' ? (
            leads.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Nenhum lead encontrado</h3>
                    <p className="text-slate-500">Divulgue seu link e comece a capturar análises!</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome / Contato</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Origem / E-mail</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data do Upload</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors bg-white">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{lead.name}</div>
                                            <div className="text-xs text-slate-500 font-medium">{lead.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-700">{lead.email}</div>
                                            <div className="flex gap-2">
                                              <div className="bg-slate-100 text-[10px] inline-flex px-1.5 py-0.5 rounded font-bold text-slate-500 uppercase mt-1">CV: {lead.filename}</div>
                                              {lead.source && lead.source !== 'orgânico' && (
                                                <div className="bg-purple-100 text-[10px] inline-flex px-1.5 py-0.5 rounded font-bold text-purple-700 uppercase mt-1">Ref: {lead.source}</div>
                                              )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar size={14} className="text-slate-400" />
                                                {new Date(lead.created_at).toLocaleDateString()} {new Date(lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                                                lead.status === 'Concluído' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedLead(lead)}
                                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors" 
                                                title="Ver Detalhes"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
        ) : activeTab === 'partners' ? (
            /* Partners View */
            partners.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                    <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Nenhum parceiro cadastrado</h3>
                    <p className="text-slate-500">Envie o link de convite para começar a formar sua rede.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Consultor</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código / Senha</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Link de Referência</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Conversão</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {partners.map((partner) => (
                                    <tr key={partner.id} className="hover:bg-slate-50 transition-colors bg-white">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{partner.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">ID: #{partner.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-mono text-sm text-[#094074] inline-block font-bold">
                                              {partner.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                                              {window.location.origin}/?ref={partner.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp size={16} className="text-emerald-500" />
                                                <span className="font-bold text-slate-900">{partner.lead_count}</span>
                                                <span className="text-xs text-slate-400">Leads</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-extrabold uppercase tracking-widest">Ativo</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
        ) : (
          /* Prompts View */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl flex items-start gap-4">
              <AlertCircle className="text-[#FE9000] shrink-0" size={24} />
              <div className="text-sm text-orange-800 leading-relaxed">
                <span className="font-bold">Atenção:</span> As alterações nos prompts afetam o comportamento da IA imediatamente. Mantenha as instruções de formato JSON intocadas para evitar erros de resposta no site.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {prompts.map((p) => (
                <div key={p.slug} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings size={18} className="text-slate-400" />
                      <h3 className="font-bold text-slate-900">{p.title}</h3>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Slug: {p.slug}</span>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">System Instructions (Contexto e Formato)</label>
                      <textarea 
                        className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        value={p.system_instructions}
                        onChange={(e) => {
                          const newPrompts = prompts.map(pr => pr.slug === p.slug ? {...pr, system_instructions: e.target.value} : pr);
                          setPrompts(newPrompts);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">User Instructions (Tarefa e Regras de Negócio)</label>
                      <textarea 
                        className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        value={p.user_instructions}
                        onChange={(e) => {
                          const newPrompts = prompts.map(pr => pr.slug === p.slug ? {...pr, user_instructions: e.target.value} : pr);
                          setPrompts(newPrompts);
                        }}
                      />
                    </div>
                  </div>

                  <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                      disabled={isSavingPrompt}
                      onClick={() => savePrompt(p.slug, p.system_instructions, p.user_instructions)}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-[#094074] text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-[#073059] transition-all disabled:opacity-50"
                    >
                      {isSavingPrompt ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Detalhes do Lead</h3>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Candidato</p>
                <p className="text-lg font-bold text-slate-900">{selectedLead.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Mail size={14}/> E-mail</p>
                  <p className="text-base font-medium text-slate-700 break-all">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Smartphone size={14}/> Telefone</p>
                  <p className="text-base font-medium text-slate-700">{selectedLead.phone || 'Não informado'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FileText size={14}/> Currículo</p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-mono break-all">
                  {selectedLead.filename}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Target size={14}/> Origem</p>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${selectedLead.source !== 'orgânico' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                    {selectedLead.source}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Status IA</p>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${selectedLead.status === 'Concluído' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedLead.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

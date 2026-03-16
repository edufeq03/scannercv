import React, { useState, useEffect } from 'react';
import { Layout, Users, FileText, Calendar, ArrowLeft, Loader2, ExternalLink, X, Mail, Smartphone, Target, Briefcase, TrendingUp, Settings, Save, AlertCircle, Plus, Trash2, Edit, Sparkles, BookOpen, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
export default function AdminDashboard() {
  const { token, recruiter, logout, authFetch, isAuthenticated: checkAuth } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [partners, setPartners] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isPartnersLoading, setIsPartnersLoading] = useState(false);
  const [isPromptsLoading, setIsPromptsLoading] = useState(false);
  const [isBlogLoading, setIsBlogLoading] = useState(false);
  
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [newPartner, setNewPartner] = useState({ code: '', name: '', email: '' });
  const [isCreatingPartner, setIsCreatingPartner] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [activeTab, setActiveTab] = useState('metrics');

  useEffect(() => {
    if (!checkAuth() || recruiter?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchLeads();
  }, [token, recruiter]);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`/api/admin/leads`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Erro ao carregar leads.');
      }
      const data = await response.json();
      setLeads(data.leads || data);
      
      // Fetch other data
      fetchMetrics();
      fetchPartners();
      fetchPrompts();
      fetchBlogPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await authFetch(`/api/admin/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    }
  };

  const fetchPartners = async () => {
    setIsPartnersLoading(true);
    try {
      const response = await authFetch(`/api/admin/recruiters`);
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

  const fetchPrompts = async () => {
    setIsPromptsLoading(true);
    try {
      const response = await authFetch(`/api/admin/prompts`);
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

  const fetchBlogPosts = async () => {
    setIsBlogLoading(true);
    try {
      const response = await fetch(`/api/blog`);
      if (response.ok) {
        const data = await response.json();
        setBlogPosts(data);
      }
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
    } finally {
      setIsBlogLoading(false);
    }
  };

  const reprocessLead = async (leadId) => {
    try {
      const response = await authFetch(`/api/admin/leads/${leadId}/reenviar`, {
        method: 'POST'
      });
      if (response.ok) {
        alert("Reanálise solicitada com sucesso!");
        fetchLeads();
      } else {
        alert("Erro ao solicitar reanálise.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    }
  };

  const savePrompt = async (slug, system, user) => {
    setIsSavingPrompt(true);
    try {
      const formData = new FormData();
      formData.append('slug', slug);
      formData.append('system_instructions', system);
      formData.append('user_instructions', user);

      // We still need fetch for FormData, but using centralized token
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
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

  const saveBlogPost = async (postData) => {
    setIsSavingBlog(true);
    try {
      const formData = new FormData();
      if (postData.id) formData.append('id', postData.id);
      formData.append('slug', postData.slug);
      formData.append('title', postData.title);
      formData.append('excerpt', postData.excerpt);
      formData.append('content', postData.content);
      formData.append('category', postData.category);
      formData.append('date', postData.date);

      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        fetchBlogPosts();
        setEditingPost(null);
        alert('Post salvo com sucesso!');
      } else {
        const err = await response.json();
        alert(`Erro: ${err.detail || 'Falha ao salvar post'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    } finally {
      setIsSavingBlog(false);
    }
  };

  const deleteBlogPost = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    try {
      const response = await authFetch(`/api/admin/blog/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchBlogPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateBlogAI = async (topic) => {
    if (!topic) return;
    setIsGeneratingBlog(true);
    try {
      const formData = new FormData();
      formData.append('topic', topic);
      const response = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        setEditingPost({
          ...data,
          date: today,
          slug: topic.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        });
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar conteúdo com IA.');
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const createPartner = async (e) => {
    e.preventDefault();
    setIsCreatingPartner(true);
    try {
      const formData = new FormData();
      formData.append('code', newPartner.code);
      formData.append('name', newPartner.name);
      formData.append('email', newPartner.email);

      const response = await fetch('/api/admin/recruiter-codes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Parceiro criado com sucesso!\nSenha Temporária: ${data.temporary_password}\n(O parceiro também receberá as credenciais por e-mail)`);
        setShowPartnerModal(false);
        setNewPartner({ code: '', name: '', email: '' });
        fetchPartners();
      } else {
        const err = await response.json();
        alert(`Erro: ${err.detail || 'Falha ao criar parceiro'}`);
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setIsCreatingPartner(false);
    }
  };

  const handleEditPartner = (partner) => {
    setEditingPartner(partner);
    setNewPartner({
      code: partner.code,
      name: partner.name,
      email: partner.email || ''
    });
    setShowPartnerModal(true);
  };

  const updatePartner = async (e) => {
    e.preventDefault();
    setIsCreatingPartner(true);
    try {
      const formData = new FormData();
      formData.append('code', newPartner.code);
      formData.append('name', newPartner.name);
      formData.append('email', newPartner.email);

      const response = await fetch(`/api/admin/recruiter-codes/${editingPartner.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert("Parceiro atualizado com sucesso!");
        setShowPartnerModal(false);
        setEditingPartner(null);
        setNewPartner({ code: '', name: '', email: '' });
        fetchPartners();
      } else {
        const err = await response.json();
        alert(`Erro: ${err.detail || 'Falha ao atualizar parceiro'}`);
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setIsCreatingPartner(false);
    }
  };

  const deletePartner = async (partnerId) => {
    if (!confirm("Tem certeza que deseja excluir este parceiro? Esta ação é irreversível.")) return;
    
    try {
      const response = await authFetch(`/api/admin/recruiter-codes/${partnerId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert("Parceiro removido com sucesso.");
        fetchPartners();
        fetchMetrics();
      } else {
        const err = await response.json();
        alert(`Erro: ${err.detail || 'Falha ao excluir parceiro'}`);
      }
    } catch (err) {
      alert("Erro de conexão.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-20 animate-pulse">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#094074] text-white flex-shrink-0 flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-6 border-b border-blue-800/50 flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg text-[#094074] shadow-inner">
            <Layout size={20} />
          </div>
          <span className="font-black uppercase tracking-tighter text-lg">ScannerCV</span>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          {[
            { id: 'metrics', icon: TrendingUp, label: 'Dashboard' },
            { id: 'leads', icon: Users, label: 'Candidatos' },
            { id: 'partners', icon: Briefcase, label: 'Parceiros' },
            { id: 'prompts', icon: Settings, label: 'Prompts IA' },
            { id: 'blog', icon: BookOpen, label: 'Blog' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id ? 'bg-white/10 text-white' : 'text-blue-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800/50 space-y-4">
          <div className="px-4 py-2 bg-blue-900/50 rounded-lg">
             <p className="text-[10px] text-blue-300 uppercase font-black mb-1">Status do Server</p>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold">Online</span>
             </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-300 hover:bg-red-500/10 transition-all"
          >
            <ArrowLeft size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            {activeTab === 'metrics' && <>📈 Métricas e Performance</>}
            {activeTab === 'leads' && <>👥 Gestão de Candidatos</>}
            {activeTab === 'partners' && <>🤝 Rede de Parceiros</>}
            {activeTab === 'prompts' && <>⚙️ Configuração de IA</>}
            {activeTab === 'blog' && <>📝 Content Manager</>}
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                {leads.slice(0, 3).map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {l.name[0]}
                  </div>
                ))}
             </div>
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{leads.length} Leads</span>
          </div>
        </header>

        <main className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 animate-pulse">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando dados...</p>
            </div>
          ) : activeTab === 'metrics' ? (
            /* Metrics View */
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {[
                   { label: 'Total de Leads', value: metrics?.total_leads || 0, icon: Users, color: 'blue' },
                   { label: 'Capturas (Logs)', value: metrics?.total_scans || 0, icon: Target, color: 'purple' },
                   { label: 'Taxa de Conversão', value: `${metrics?.taxa_conversao || 0}%`, icon: TrendingUp, color: 'emerald' },
                   { label: 'Total de Parceiros', value: metrics?.total_parceiros || 0, icon: Briefcase, color: 'orange' },
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all">
                      <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 inline-block mb-4 shadow-sm`}>
                        <stat.icon size={20} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                   </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Atividade Recente (30 dias)</h3>
                  <div className="h-48 flex items-end gap-2">
                    {metrics?.scans_por_dia?.map((d, i) => (
                      <div key={i} className="flex-grow group relative">
                        <div 
                          className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600 shadow-sm" 
                          style={{ height: `${(d.total / Math.max(...metrics.scans_por_dia.map(x=>x.total), 1)) * 100}%` }}
                        ></div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                          {d.total}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400">
                    <span>{metrics?.scans_por_dia?.[0]?.dia || ''}</span>
                    <span>{metrics?.scans_por_dia?.[metrics.scans_por_dia.length-1]?.dia || ''}</span>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Top Fontes de Leads</h3>
                  <div className="space-y-6">
                    {metrics?.top_sources?.map((s, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="w-8 text-[10px] font-black text-slate-400">#{i+1}</span>
                        <div className="flex-grow">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-bold text-slate-700">{s.source}</span>
                            <span className="text-xs font-black text-slate-400">{s.total}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                             <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${(s.total / metrics.total_leads) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'leads' ? (
            /* Leads View */
            leads.length === 0 ? (
                <div className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 p-20 text-center">
                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Sem candidatos</h3>
                    <p className="text-slate-500">Divulgue seu link para começar a receber currículos.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidato</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato / Origem</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status IA</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-slate-900 leading-tight">{lead.name}</div>
                                            <div className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{lead.email}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-slate-700">{lead.phone || 'Sem fone'}</div>
                                            <div className="mt-1 flex gap-2">
                                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded border border-slate-200">{lead.source}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-xs font-bold text-slate-600">{new Date(lead.created_at).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-slate-400">{new Date(lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                                lead.status === 'Concluído' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => reprocessLead(lead.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Reenviar Análise"><Sparkles size={18}/></button>
                                              <button onClick={() => setSelectedLead(lead)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"><ExternalLink size={18}/></button>
                                            </div>
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
            <div className="space-y-6 animate-in fade-in duration-700">
              <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Rede de Parceiros</h3>
                   <p className="text-xs text-slate-500">Gerencie recrutadores e fontes de captura.</p>
                </div>
                <button 
                  onClick={() => setShowPartnerModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#094074] text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-[#FE9000] shadow-xl shadow-blue-100 transition-all"
                >
                  <Plus size={18} /> Adicionar Parceiro
                </button>
              </div>
              {partners.length === 0 ? (
                <div className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 p-20 text-center">
                    <Briefcase className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Nenhum parceiro</h3>
                    <p className="text-slate-500">Forme sua rede de recrutadores para escalar.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultor</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código / Link</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Impacto</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {partners.map((partner) => (
                                    <tr key={partner.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-slate-900 leading-none mb-1">{partner.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">ID: #{partner.id}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="bg-slate-100 px-3 py-1.5 rounded-xl font-mono text-sm text-[#094074] inline-block font-black border border-slate-200 shadow-inner">
                                              {partner.code}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[150px] mt-1 italic">{window.location.origin}/p/{partner.code}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col items-center">
                                                <div className="text-lg font-black text-slate-900">{partner.lead_count}</div>
                                                <div className="text-[10px] font-black text-emerald-500 uppercase">Leads Gerados</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Ativo</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                              <button 
                                                onClick={() => handleEditPartner(partner)} 
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Editar Parceiro"
                                              >
                                                <Edit size={18}/>
                                              </button>
                                              <button 
                                                onClick={() => deletePartner(partner.id)} 
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                title="Excluir Parceiro"
                                              >
                                                <Trash2 size={18}/>
                                              </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}
            </div>
          ) : activeTab === 'prompts' ? (
            /* Prompts View */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex items-start gap-4 shadow-sm">
                <AlertCircle className="text-amber-600 shrink-0" size={24} />
                <div className="text-sm text-amber-900 leading-relaxed font-medium">
                  <span className="font-black uppercase tracking-tighter">Aviso Crítico:</span> Alterações nos prompts alteram a lógica de análise instantaneamente. Teste exaustivamente antes de salvar mudanças estruturais no JSON.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10">
                {prompts.map((p) => (
                  <div key={p.slug} className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-2xl transition-all group">
                    <div className="bg-slate-50/80 px-10 py-5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400 group-hover:text-blue-600 transition-colors">
                          <Settings size={20} />
                        </div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">{p.title}</h3>
                      </div>
                      <span className="text-[10px] font-black uppercase text-white tracking-widest bg-slate-900 px-3 py-1 rounded-full shadow-lg">KEY: {p.slug}</span>
                    </div>
                    
                    <div className="p-10 space-y-8">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">System Context (Instruções de Base)</label>
                        <textarea 
                          className="w-full h-32 p-6 bg-slate-50 border border-slate-200 rounded-[24px] font-mono text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none shadow-inner"
                          value={p.system_instructions}
                          onChange={(e) => {
                            const newPrompts = prompts.map(pr => pr.slug === p.slug ? {...pr, system_instructions: e.target.value} : pr);
                            setPrompts(newPrompts);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">User Analysis Prompt (Regras de Negócio e Saída)</label>
                        <textarea 
                          className="w-full h-80 p-6 bg-slate-50 border border-slate-200 rounded-[32px] font-mono text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none shadow-inner leading-relaxed"
                          value={p.user_instructions}
                          onChange={(e) => {
                            const newPrompts = prompts.map(pr => pr.slug === p.slug ? {...pr, user_instructions: e.target.value} : pr);
                            setPrompts(newPrompts);
                          }}
                        />
                      </div>
                    </div>

                    <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                      <button 
                        disabled={isSavingPrompt}
                        onClick={() => savePrompt(p.slug, p.system_instructions, p.user_instructions)}
                        className="inline-flex items-center gap-3 px-10 py-4 bg-[#094074] text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-[#073059] transition-all disabled:opacity-50 shadow-xl shadow-blue-100"
                      >
                        {isSavingPrompt ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Publicar Alterações
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Blog View */
            <div className="space-y-10 animate-in fade-in duration-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setEditingPost({ title: '', slug: '', excerpt: '', content: '', category: 'Dicas de Carreira', date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) })}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                  <Plus size={20} /> Nova Publicação
                </button>
                
                <div className="w-full md:w-auto flex items-center gap-3 bg-slate-50 p-2 rounded-2xl shadow-inner border border-slate-200 flex-grow max-w-lg">
                  <div className="p-2 text-slate-400"><Sparkles size={20}/></div>
                  <input 
                    id="ai-topic-input"
                    type="text" 
                    placeholder="Sugira um tema (ex: 'Como vencer a Gupy')..." 
                    className="bg-transparent px-2 py-2 text-sm outline-none font-bold text-slate-700 flex-grow"
                  />
                  <button 
                    onClick={() => generateBlogAI(document.getElementById('ai-topic-input').value)}
                    disabled={isGeneratingBlog}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {isGeneratingBlog ? <Loader2 size={16} className="animate-spin" /> : "Gerar com IA"}
                  </button>
                </div>
              </div>

              {blogPosts.length === 0 ? (
                <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-32 text-center shadow-inner">
                    <BookOpen className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">O Blog está vazio</h3>
                    <p className="text-slate-500 font-medium italic mt-2">Clique em "Gerar com IA" para criar seu primeiro tutorial de carreira.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {blogPosts.map(post => (
                    <div key={post.id} className="group bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100 shadow-sm">{post.category}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => setEditingPost(post)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:shadow-lg rounded-xl shadow-sm transition-all"><Edit size={18}/></button>
                          <button onClick={() => deleteBlogPost(post.id)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:shadow-lg rounded-xl shadow-sm transition-all"><Trash2 size={18}/></button>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-3 line-clamp-2 leading-[1.2] tracking-tight">{post.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-grow italic leading-relaxed text-justify">"{post.excerpt}"</p>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-slate-400" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.date}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 bg-slate-50 px-2 py-0.5 rounded">/{post.slug}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Blog Post Editor Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] w-full max-w-5xl max-h-[90vh] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-200 flex flex-col scale-95 animate-in zoom-in-95 duration-500">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-blue-600">
                  <Edit size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#094074] uppercase tracking-tighter leading-none mb-1">
                    {editingPost.id ? 'Refinar Publicação' : 'Produção Criativa'}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Editor de Conteúdo para ScannerCV</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPost(null)} 
                className="p-4 text-slate-400 hover:bg-white hover:shadow-lg hover:text-red-500 rounded-full transition-all"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-10 flex-grow custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-10">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest ml-1">Título do Artigo</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-blue-100 font-black text-slate-800 text-lg transition-all"
                      value={editingPost.title}
                      onChange={e => setEditingPost({...editingPost, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest ml-1">Categoria</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[18px] outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-600"
                        value={editingPost.category}
                        onChange={e => setEditingPost({...editingPost, category: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest ml-1">Slug URL</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[18px] outline-none focus:ring-4 focus:ring-blue-100 font-mono text-xs text-blue-600"
                        value={editingPost.slug}
                        onChange={e => {
                          const sanitized = e.target.value.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\-]/g, '');
                          setEditingPost({...editingPost, slug: sanitized});
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest ml-1">Resumo Curto (Excerpt)</label>
                    <textarea 
                      className="w-full h-32 px-6 py-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-100 resize-none italic text-slate-600 leading-relaxed shadow-inner"
                      value={editingPost.excerpt}
                      onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest ml-1">Conteúdo Principal (Markdown)</label>
                  <textarea 
                    className="flex-grow w-full min-h-[400px] p-8 bg-slate-50 border border-slate-200 rounded-[40px] font-mono text-sm outline-none focus:ring-4 focus:ring-blue-100 leading-relaxed shadow-inner"
                    value={editingPost.content}
                    onChange={e => setEditingPost({...editingPost, content: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-5">
               <button 
                  onClick={() => setEditingPost(null)}
                  className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all border border-transparent hover:bg-white hover:rounded-2xl"
                >
                  Descartar
                </button>
                <div className="flex gap-4">
                  <span className="bg-white px-5 py-4 rounded-2xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} /> {editingPost.date}
                  </span>
                  <button 
                    disabled={isSavingBlog}
                    onClick={() => saveBlogPost(editingPost)}
                    className="inline-flex items-center gap-3 px-12 py-5 bg-[#094074] text-white font-black rounded-[24px] text-[10px] uppercase tracking-widest hover:bg-[#073059] transition-all disabled:opacity-50 shadow-[0_15px_30px_-5px_rgba(9,64,116,0.3)] shadow-blue-200"
                  >
                    {isSavingBlog ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Publicar Agora
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[56px] w-full max-w-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] overflow-hidden border border-slate-200 flex flex-col scale-95 animate-in zoom-in-95 duration-500">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-slate-100 rounded-full mt-4"></div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">Dossiê do Candidato</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Protocolo de Identificação: #{selectedLead.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-4 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-all"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="p-12 space-y-12 overflow-y-auto">
              <div className="bg-slate-50/50 p-8 rounded-[40px] border border-slate-100 shadow-inner">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Nome Completo
                </p>
                <div className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{selectedLead.name}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Mail size={16} className="text-blue-400"/> E-mail Comercial</p>
                  <p className="text-lg font-bold text-slate-700 break-all bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Smartphone size={16} className="text-emerald-400"/> WhatsApp / Fone</p>
                  <p className="text-2xl font-black text-[#094074] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">{selectedLead.phone || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={16} className="text-purple-400"/> Arquivo Processado (.pdf)</p>
                <div className="p-6 bg-slate-900 text-slate-300 rounded-[28px] text-xs font-mono break-all leading-relaxed shadow-xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-2 text-slate-500 text-[10px] font-black border-b border-slate-800 pb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div> STORAGE_PATH
                  </div>
                  {selectedLead.filename}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 pt-10 border-t border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Origem do Fluxo</p>
                  <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-lg ${selectedLead.source !== 'orgânico' ? 'bg-purple-600 text-white border-purple-400' : 'bg-white text-slate-900 border-slate-200'}`}>
                    {selectedLead.source}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Eficiência de Análise</p>
                  <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-lg ${selectedLead.status === 'Concluído' ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-blue-500 text-white border-blue-300'}`}>
                    {selectedLead.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex justify-center">
               <button 
                  onClick={() => setSelectedLead(null)}
                  className="w-full max-w-xs py-5 bg-slate-900 text-white font-black rounded-[28px] text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl hover:shadow-slate-300"
                >
                  Concluir Visualização
                </button>
            </div>
          </div>
        </div>
      )}
      {/* Partner Creation Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col scale-95 animate-in zoom-in-95 duration-500">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-blue-600">
                  {editingPartner ? <Edit size={24} /> : <Plus size={24} />}
                </div>
                <h3 className="text-xl font-black text-[#094074] uppercase tracking-tighter">
                  {editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}
                </h3>
              </div>
               <button 
                onClick={() => {
                  setShowPartnerModal(false);
                  setEditingPartner(null);
                  setNewPartner({ code: '', name: '', email: '' });
                }} 
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={editingPartner ? updatePartner : createPartner} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Nome do Parceiro / Consultoria</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Maria RH"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[18px] outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                  value={newPartner.name}
                  onChange={e => setNewPartner({...newPartner, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">E-mail para Credenciais</label>
                <input 
                  type="email" 
                  required
                  placeholder="contato@parceiro.com"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[18px] outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                  value={newPartner.email}
                  onChange={e => setNewPartner({...newPartner, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Código de Acesso (URL slug)</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: maria2024"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[18px] outline-none focus:ring-4 focus:ring-blue-100 font-mono text-sm text-blue-600 transition-all"
                  value={newPartner.code}
                  onChange={e => setNewPartner({...newPartner, code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                />
                <p className="text-[10px] text-slate-400 mt-2 ml-1">O link será: scannercv.com.br/p/{newPartner.code || '...'}</p>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isCreatingPartner}
                  className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#094074] text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-[#073059] transition-all disabled:opacity-50 shadow-xl shadow-blue-100"
                >
                   {isCreatingPartner ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                  {editingPartner ? 'Salvar Alterações' : 'Criar Parceiro e Enviar E-mail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

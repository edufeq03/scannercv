import React, { useState, useEffect } from "react";
import { User, Lock, Loader2, LogIn, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated, recruiter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated() && recruiter) {
      if (recruiter.role === 'admin') {
        navigate("/admin");
      } else if (recruiter.must_change_password) {
        navigate("/change-password");
      } else {
        navigate("/parceiro");
      }
    }
  }, [isAuthenticated, recruiter, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Falha no login. Verifique suas credenciais.");
      }

      login(data.access_token, data.recruiter);

      if (data.recruiter.role === 'admin') {
        navigate("/admin");
      } else if (data.recruiter.must_change_password) {
        navigate("/change-password");
      } else {
        navigate("/parceiro");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-[#094074] p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Acesso ao Sistema</h1>
          <p className="text-white/70 text-sm">Entre com suas credenciais para acessar o painel.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#094074] focus:border-transparent outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#094074] focus:border-transparent outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#094074] text-white font-bold rounded-xl hover:bg-[#073059] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#094074]/20 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} />
                  Entrar no Painel
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Esqueceu sua senha? Entre em contato com o suporte da ScannerCV.
          </p>
        </div>
      </div>
    </div>
  );
}

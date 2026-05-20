"use client";
import React, { useState } from "react";
import { User, Lock, ArrowRight, UserPlus, Fingerprint } from "lucide-react";

interface AcessoCardProps {
  onLogin: (user: string, pass: string) => void;
  onCadastrar: (user: string, pass: string) => void;
}

export default function AcessoCard({ onLogin, onCadastrar }: AcessoCardProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) return;

    if (isLogin) {
      onLogin(user, pass);
    } else {
      onCadastrar(user, pass);
      setIsLogin(true);
    }
  };

  return (
    /* FUNDO DINÂMICO DA TELA INTEIRA: Muda de cor entre os tons escuros de Emerald e Blue */
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-1000 ${
        isLogin ? "bg-[#0b1120]" : "bg-[#070f22]"
      }`}
    >
      {/* Grid cibernético de fundo */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* TÍTULO PRINCIPAL: Centralizado no topo mudando de cor reativa */}
      <div className="mb-6 text-center select-none z-10 w-full max-w-[420px]">
        <h1
          className={`text-4xl font-black tracking-wider italic uppercase transition-colors duration-700 ${
            isLogin
              ? "text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              : "text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          }`}
        >
          TechLibras
        </h1>
      </div>

      {/* Wrapper com largura idêntica ao card para isolar o Glow de fundo e matar a linha pontilhada horizontal */}
      <div className="relative w-[420px] max-w-full z-10">
        {/* GLOW DE FUNDO REATIVO: Fica preso estritamente atrás do card */}
        <div
          className={`absolute -inset-1 rounded-[3rem] blur-3xl opacity-25 transition-all duration-700 ${
            isLogin ? "bg-emerald-500" : "bg-blue-500"
          }`}
        />

        {/* CORPO DO CARD: Com a rolagem vertical restaurada para as telas menores */}
        <div className="relative bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl w-full max-h-[72vh] overflow-y-auto custom-scrollbar transition-all duration-500">
          {/* Ícone de Topo Dinâmico */}
          <div className="flex justify-center mb-6">
            <div
              className={`p-4 rounded-2xl bg-slate-950 border border-slate-700 shadow-inner transition-colors duration-500 ${
                isLogin ? "text-emerald-500" : "text-blue-500"
              }`}
            >
              {isLogin ? <Fingerprint size={32} /> : <UserPlus size={32} />}
            </div>
          </div>

          {/* Header interno do Card */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase">
              {isLogin ? "System" : "New"}{" "}
              <span className={isLogin ? "text-emerald-500" : "text-blue-500"}>
                {isLogin ? "Access" : "User"}
              </span>
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
              TechLibras Neural Network v2.0
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Campo Usuário */}
              <div className="group/input">
                <label className="text-[10px] text-slate-500 font-black ml-4 uppercase tracking-widest mb-2 block group-focus-within/input:text-white transition-colors">
                  ID de Operador
                </label>
                <div className="relative">
                  <User
                    className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors ${
                      isLogin
                        ? "group-focus-within/input:text-emerald-500"
                        : "group-focus-within/input:text-blue-500"
                    }`}
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="USERNAME"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className={`w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:ring-4 transition-all placeholder:text-slate-800 font-mono text-sm ${
                      isLogin
                        ? "focus:border-emerald-500/50 focus:ring-emerald-500/10"
                        : "focus:border-blue-500/50 focus:ring-blue-500/10"
                    }`}
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="group/input">
                <label className="text-[10px] text-slate-500 font-black ml-4 uppercase tracking-widest mb-2 block group-focus-within/input:text-white transition-colors">
                  Código de Segurança
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors ${
                      isLogin
                        ? "group-focus-within/input:text-emerald-500"
                        : "group-focus-within/input:text-blue-500"
                    }`}
                    size={18}
                  />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className={`w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:ring-4 transition-all placeholder:text-slate-800 font-mono ${
                      isLogin
                        ? "focus:border-emerald-500/50 focus:ring-emerald-500/10"
                        : "focus:border-blue-500/50 focus:ring-blue-500/10"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Botão de Submissão */}
            <button
              type="submit"
              className={`group/btn relative w-full overflow-hidden py-5 rounded-2xl font-black text-white mt-4 transition-all active:scale-95 shadow-2xl ${
                isLogin ? "bg-emerald-600" : "bg-blue-600"
              }`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-3 uppercase tracking-tighter italic text-lg">
                {isLogin ? "Initialize Session" : "Deploy Register"}
                <ArrowRight
                  size={20}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </span>
            </button>
          </form>

          {/* Rodapé com as tags totalmente normalizadas e fechadas */}
          <div className="mt-10 pt-8 border-t border-slate-800/50">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setUser("");
                setPass("");
              }}
              className="w-full group/toggle mb-6"
            >
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold group-hover/toggle:text-slate-300 transition-colors">
                {isLogin ? "Request internal access?" : "Return to terminal?"}
                <span
                  className={`ml-2 underline underline-offset-4 ${
                    isLogin ? "text-emerald-500" : "text-blue-500"
                  }`}
                >
                  {isLogin ? "Create Credentials" : "Sign In"}
                </span>
              </p>
            </button>

            {/* Botão de Bypass sem autenticação */}
            <button
              type="button"
              onClick={() => (window.location.href = "/dashboard")}
              className="w-full py-4 bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
            >
              Acessar terminal sem login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

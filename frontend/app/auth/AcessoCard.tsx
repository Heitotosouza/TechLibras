"use client";
import React, { useState } from "react";
import { User, Lock, ArrowRight, UserPlus, Fingerprint } from "lucide-react";

interface AcessoCardProps {
  isLogin: boolean;
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
  onLogin: (user: string, pass: string) => void;
  onCadastrar: (user: string, pass: string) => void;
  onBypass: () => void;
}

export default function AcessoCard({
  isLogin,
  setIsLogin,
  onLogin,
  onCadastrar,
  onBypass,
}: AcessoCardProps) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.trim()) {
      alert("Por favor, digite o usuário.");
      return;
    }

    if (isLogin) {
      onLogin(user, pass);
    } else {
      if (!pass.trim()) {
        alert("Defina uma senha para o cadastro.");
        return;
      }
      onCadastrar(user, pass);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-1000 ${isLogin ? "bg-[#0b1120]" : "bg-[#070f22]"}`}
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="mb-6 text-center select-none z-10 w-full max-w-[420px]">
        <h1
          className={`text-4xl font-black tracking-wider italic uppercase transition-colors duration-700 ${isLogin ? "text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"}`}
        >
          TechLibras
        </h1>
      </div>

      <div className="relative w-[420px] max-w-full z-10">
        <div
          className={`absolute -inset-1 rounded-[3rem] blur-3xl opacity-25 transition-all duration-700 ${isLogin ? "bg-emerald-500" : "bg-blue-500"}`}
        />

        <div className="relative bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl w-full max-h-[72vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-center mb-6">
            <div
              className={`p-4 rounded-2xl bg-slate-950 border border-slate-700 shadow-inner text-white`}
            >
              {isLogin ? (
                <Fingerprint size={32} className="text-emerald-500" />
              ) : (
                <UserPlus size={32} className="text-blue-500" />
              )}
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase">
              {isLogin ? "System" : "New"}{" "}
              <span className={isLogin ? "text-emerald-500" : "text-blue-500"}>
                {isLogin ? "Access" : "User"}
              </span>
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-black ml-4 uppercase tracking-widest mb-2 block">
                  ID de Operador
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="USERNAME"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white outline-none font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-black ml-4 uppercase tracking-widest mb-2 block">
                  Código de Segurança
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                    size={18}
                  />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white outline-none font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-5 rounded-2xl font-black text-white mt-4 uppercase tracking-tighter italic text-lg ${isLogin ? "bg-emerald-600" : "bg-blue-600"}`}
            >
              <span className="flex items-center justify-center gap-3">
                {isLogin ? "Initialize Session" : "Deploy Register"}
                <ArrowRight size={20} />
              </span>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800/50">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault(); // Impede o envio do formulário no clique
                setIsLogin(!isLogin);
                setUser("");
                setPass("");
              }}
              className="w-full text-center mb-6 block"
            >
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                {isLogin ? "Request internal access?" : "Return to terminal?"}{" "}
                <span
                  className={`ml-2 underline ${isLogin ? "text-emerald-500" : "text-blue-500"}`}
                >
                  {isLogin ? "Create Credentials" : "Sign In"}
                </span>
              </p>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onBypass();
              }}
              className="w-full py-4 bg-slate-950 text-slate-400 border border-slate-800 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Acessar terminal sem login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";

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
    if (!user || !pass) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    if (isLogin) {
  onLogin(user, pass);
} else {
  onCadastrar(user, pass);
  setIsLogin(true); 
}
  };

  return (
    <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl w-full max-w-md transition-all duration-500">
      {/* Header Dinâmico */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-emerald-400 tracking-tighter italic">
          {isLogin ? "BEM-VINDO" : "NOVA CONTA"}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {isLogin
            ? "Entre na sua dashboard ou treine nossa IA"
            : "Cadastre-se para treinar e estudar"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="space-y-4">
          {/* Campo Usuário */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 font-black ml-1 uppercase tracking-widest">
              Usuário
            </label>
            <input
              type="text"
              placeholder="Seu nome de usuário"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="bg-slate-900/50 border border-slate-600 rounded-2xl px-5 py-4 text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-700"
            />
          </div>

          {/* Campo Senha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 font-black ml-1 uppercase tracking-widest">
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="bg-slate-900/50 border border-slate-600 rounded-2xl px-5 py-4 text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-700"
            />
          </div>
        </div>

        {/* Botão de Ação Principal */}
        <button
          type="submit"
          className={`${
            isLogin
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-blue-600 hover:bg-blue-500"
          } py-4 rounded-2xl font-black text-white mt-4 transition-all shadow-lg active:scale-95 uppercase tracking-tight`}
        >
          {isLogin ? "Acessar Sistema" : "Finalizar Cadastro"}
        </button>
      </form>

      {/* Alternador (Toggle) */}
      <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
        <p className="text-sm text-slate-400">
          {isLogin ? "Não possui uma conta?" : "Já faz parte do time?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setUser("");
              setPass("");
            }}
            className={`${
              isLogin ? "text-emerald-400" : "text-blue-400"
            } font-bold hover:underline underline-offset-4`}
          >
            {isLogin ? "Crie uma agora" : "Faça Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

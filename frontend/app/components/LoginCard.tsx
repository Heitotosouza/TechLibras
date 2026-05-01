"use client";
import React, { useState } from "react";

interface LoginCardProps {
  // Alteramos a tipagem para aceitar a função que envia usuário e senha
  onLogin: (user: string, pass: string) => void;
}

export default function LoginCard({ onLogin }: LoginCardProps) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    // Chama a função handleLogin que está no page.tsx
    onLogin(user, pass);
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-96">
      <h2 className="text-2xl font-bold text-emerald-400 mb-2 text-center">
        TechLibras
      </h2>
      <p className="text-slate-400 text-sm text-center mb-6">
        Entre para gerenciar ou treinar a IA
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-bold ml-1 uppercase">
            Usuário
          </label>
          <input
            type="text"
            placeholder="Seu nome de usuário"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-bold ml-1 uppercase">
            Senha
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold text-white mt-2 transition-all shadow-lg active:scale-95"
        >
          ACESSAR SISTEMA
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
        <p className="text-xs text-slate-500">
          Versão 2.0 - Sistema de Segurança Ativo
        </p>
      </div>
    </div>
  );
}

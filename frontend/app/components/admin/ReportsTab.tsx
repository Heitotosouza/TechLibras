"use client";
import React, { useState } from "react";

interface ReportsTabProps {
  users: any[];
  sinais: string[];
}

export default function ReportsTab({ users, sinais }: ReportsTabProps) {
  const [filter, setFilter] = useState({
    user: "all",
    sinal: "all",
    data: "",
  });

  const handleDownload = () => {
    const params = new URLSearchParams({
      user: filter.user,
      sinal: filter.sinal,
      date: filter.data,
    }).toString();

    const url = `http://localhost:8000/admin/export/report?${params}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">
          Relatórios Exportáveis
        </h2>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
          Extração de dados reais do banco para auditoria
        </p>
      </header>

      <section className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FILTRO: USUÁRIO */}
          <div className="space-y-3">
            <label className="text-xs font-black text-emerald-500 uppercase italic">
              Treineiro Específico
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-emerald-500 transition-all"
              value={filter.user}
              onChange={(e) => setFilter({ ...filter, user: e.target.value })}
            >
              <option value="all">Todos os Membros</option>
              {users?.map((u) => (
                <option key={u._id} value={u.username}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          {/* FILTRO: SINAL (DINÂMICO DO BANCO) */}
          <div className="space-y-3">
            <label className="text-xs font-black text-emerald-500 uppercase italic">
              Sinal Específico (Real Atlas)
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-emerald-500 transition-all"
              value={filter.sinal}
              onChange={(e) => setFilter({ ...filter, sinal: e.target.value })}
            >
              <option value="all">Todos os Sinais</option>
              {sinais?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* FILTRO: DATA */}
          <div className="space-y-3">
            <label className="text-xs font-black text-emerald-500 uppercase italic">
              Data Específica
            </label>
            <input
              type="date"
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-emerald-500 transition-all [color-scheme:dark]"
              onChange={(e) => setFilter({ ...filter, data: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="w-full mt-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-6 rounded-3xl text-xl uppercase italic tracking-tighter transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-4"
        >
          <span>📥</span> Gerar Relatório de Análise Profunda
        </button>
      </section>

      {/* Dicas de Auditoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
        <div className="p-8 border border-dashed border-slate-800 rounded-[2rem] text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Sugestão</p>
          <p className="text-white font-bold">
            "Filtre por treineiro para validar o empenho individual no banco"
          </p>
        </div>
        <div className="p-8 border border-dashed border-slate-800 rounded-[2rem] text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Segurança
          </p>
          <p className="text-white font-bold">
            "O PDF gerado contém apenas amostras validadas pelo sistema"
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";

interface ReportsTabProps {
  users: any[];
  sinais: string[];
}

export default function ReportsTab({ users, sinais }: ReportsTabProps) {
  const [filter, setFilter] = useState({ user: "all", sinal: "all", data: "" });

  const handleDownload = () => {
    const params = new URLSearchParams({
      user: filter.user,
      sinal: filter.sinal,
      date: filter.data,
    }).toString();

    // 1. Definição inteligente da URL base do Back-end
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // 2. Junção dinâmica usando as crases (Template Literal)
    const url = `${baseUrl}/admin/export/report?${params}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">
          Relatórios
        </h2>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
          Extração de dados reais
        </p>
      </header>
      <section className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-emerald-500 uppercase italic">
              Membro
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold"
              value={filter.user}
              onChange={(e) => setFilter({ ...filter, user: e.target.value })}
            >
              <option value="all">Todos</option>
              {users?.map((u) => (
                <option key={u._id} value={u.username}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-emerald-500 uppercase italic">
              Sinal
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold"
              value={filter.sinal}
              onChange={(e) => setFilter({ ...filter, sinal: e.target.value })}
            >
              <option value="all">Todos</option>
              {sinais?.map((s, idx) => (
                <option key={idx} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-emerald-500 uppercase italic">
              Data
            </label>
            <input
              type="date"
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold [color-scheme:dark]"
              onChange={(e) => setFilter({ ...filter, data: e.target.value })}
            />
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="w-full mt-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-6 rounded-3xl text-xl uppercase italic transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
        >
          📥 Gerar Relatório
        </button>
      </section>
    </div>
  );
}

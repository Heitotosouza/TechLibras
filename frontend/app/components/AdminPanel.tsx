"use client";
import React, { useState, useEffect, useCallback } from "react";
import CollectTab from "./admin/CollectTab";
import UsersTab from "./admin/UsersTab";
import StatsTab from "./admin/StatsTab";
import ReportsTab from "./admin/ReportsTab";

// Definição de tipos para evitar o erro de 'never[]'
interface User {
  _id: string;
  username: string;
  total_sinais?: number;
  [key: string]: any;
}

interface AdminData {
  users: User[];
  sinais: string[];
  stats: { total: number; meta: number };
}

export default function PanelAdmin() {
  const [abaAtiva, setAbaAtiva] = useState<
    "camera" | "usuarios" | "graficos" | "relatorios"
  >("camera");

  // Estado agora usa a interface AdminData
  const [data, setData] = useState<AdminData>({
    users: [],
    sinais: [],
    stats: { total: 0, meta: 500 },
  });

  const [loading, setLoading] = useState(false);

  const syncData = useCallback(async () => {
    setLoading(true);
    try {
      // Em produção, você usará a URL do Koyeb.
      // Dica: use uma variável de ambiente process.env.NEXT_PUBLIC_API_URL futuramente
      const baseUrl = "http://localhost:8000";

      const [uRes, sRes, sinaisRes] = await Promise.all([
        fetch(`${baseUrl}/admin/ranking`),
        fetch(`${baseUrl}/admin/stats_sinais`),
        fetch(`${baseUrl}/admin/lista-sinais`),
      ]);

      const usersJson = await uRes.json();
      const statsJson = await sRes.json();
      const sinaisJson = await sinaisRes.json();

      setData({
        users: Array.isArray(usersJson) ? usersJson : [],
        stats: statsJson || { total: 0, meta: 500 },
        sinais: Array.isArray(sinaisJson) ? sinaisJson : [],
      });
    } catch (e) {
      console.error("Erro na sincronização:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncData();
  }, [abaAtiva, syncData]);

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
        <div className="p-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_15px_#10b981]" />
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">
              TechLibras
            </h1>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            Master Admin
          </p>
        </div>

        <nav className="flex-1 mt-4">
          {[
            { id: "camera", icon: "🎥", label: "Coleta" },
            { id: "usuarios", icon: "👥", label: "Equipe" },
            { id: "graficos", icon: "📊", label: "Estatísticas" },
            { id: "relatorios", icon: "📄", label: "Relatórios" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAbaAtiva(item.id as any)}
              className={`w-full flex items-center gap-5 px-10 py-6 border-l-4 transition-all ${
                abaAtiva === item.id
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-bold uppercase tracking-widest text-xs">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-white">
              HS
            </div>
            <div>
              <p className="text-xs font-black text-white">HeitorSS</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase">
                Master
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto bg-[#0b1120] p-12 relative custom-scrollbar">
        {abaAtiva === "camera" && <CollectTab stats={data.stats} />}

        {abaAtiva === "usuarios" && (
          <UsersTab users={data.users} loading={loading} onUpdate={syncData} />
        )}

        {abaAtiva === "graficos" && <StatsTab users={data.users} />}

        {abaAtiva === "relatorios" && (
          <ReportsTab users={data.users} sinais={data.sinais} />
        )}
      </main>
    </div>
  );
}

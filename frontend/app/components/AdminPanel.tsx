"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  LogOut,
} from "lucide-react";

import CollectTab from "./admin/CollectTab";
import UsersTab from "./admin/UsersTab";
import StatsTab from "./admin/StatsTab";
import ReportsTab from "./admin/ReportsTab";
import Sidebar from "./Sidebar";

export default function PanelAdmin() {
  const [abaAtiva, setAbaAtiva] = useState("camera");
  const [loading, setLoading] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  const [data, setData] = useState({
    users: [],
    sinais_detalhados: [],
    historico: [],
    stats: { total: 0, meta: 500 },
  });

  const syncData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const baseUrl = "http://localhost:8000";
      const [uRes, sRes, hRes] = await Promise.all([
        fetch(`${baseUrl}/admin/usuarios/lista`),
        fetch(`${baseUrl}/admin/stats_sinais`),
        fetch(`${baseUrl}/historico`),
      ]);

      const [uJ, sJ, hJ] = await Promise.all([
        uRes.json(),
        sRes.json(),
        hRes.json(),
      ]);

      setData({
        users: Array.isArray(uJ) ? uJ : [],
        sinais_detalhados: Array.isArray(sJ) ? sJ : [],
        historico: Array.isArray(hJ) ? hJ : [],
        stats: {
          total: Array.isArray(sJ)
            ? sJ.reduce((acc, curr) => acc + (curr.total || 0), 0)
            : 0,
          meta: 500,
        },
      });
    } catch (e) {
      console.error("Erro na sincronização:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncData(true);
    const interval = setInterval(() => {
      if (abaAtiva === "camera") syncData(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [syncData, abaAtiva]);

  useEffect(() => {
    const saved = localStorage.getItem("techlibras_user");
    if (saved) setUsuarioLogado(JSON.parse(saved));
    else window.location.href = "/";
  }, []);

  const handleAction = async (url: string, method: string, msg: string) => {
    if (!confirm(msg)) return;
    try {
      await fetch(url, { method });
      await syncData(false);
    } catch (error) {
      alert("Erro ao executar ação.");
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0b1120] text-slate-200 font-sans overflow-hidden">
      {/* 1. SIDEBAR ESQUERDA */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-8 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-emerald-500 rounded-full" />
            <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">
              TechLibras
            </h1>
          </div>
          <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest ml-5">
            Admin Management
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            {
              id: "camera",
              icon: <LayoutDashboard size={18} />,
              label: "Coleta",
            },
            { id: "usuarios", icon: <Users size={18} />, label: "Equipe" },
            {
              id: "graficos",
              icon: <BarChart3 size={18} />,
              label: "Estatísticas",
            },
            {
              id: "relatorios",
              icon: <FileText size={18} />,
              label: "Relatórios",
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAbaAtiva(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                abaAtiva === item.id
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
              }`}
            >
              <span
                className={
                  abaAtiva === item.id
                    ? "text-emerald-400"
                    : "group-hover:text-emerald-400"
                }
              >
                {item.icon}
              </span>
              <span className="font-bold uppercase text-[10px] tracking-widest">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 shrink-0">
          <button
            onClick={() => {
              localStorage.removeItem("techlibras_user");
              window.location.href = "/";
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-500 text-[10px] font-black uppercase border border-red-500/10 hover:bg-red-500 hover:text-white transition-all shadow-lg"
          >
            <LogOut size={14} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* 2. ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0b1120] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto w-full">
            {abaAtiva === "camera" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CollectTab
                  stats={data.stats}
                  userRole="ADMIN"
                  currentUser={usuarioLogado?.username}
                  tipoCaptura="ESTATICO"
                  hideHistory={false}
                  customHistoryData={data.historico}
                />
              </div>
            )}
            {abaAtiva === "usuarios" && (
              <UsersTab
                users={data.users}
                loading={loading}
                onUpdate={() => syncData(false)}
              />
            )}
            {abaAtiva === "graficos" && <StatsTab users={data.users} />}
            {abaAtiva === "relatorios" && (
              <ReportsTab
                users={data.users}
                sinais={data.sinais_detalhados.map((s: any) => s.sinal)}
              />
            )}
          </div>
        </div>
      </main>

      {/* 3. SIDEBAR DIREITA (DATASET) - FIXA E SEM CORTES */}
      {abaAtiva === "camera" && (
        <aside className="w-96 shrink-0 border-l border-slate-800 bg-slate-900 flex flex-col h-full">
          {/* Header Superior sutil */}
          <div className="px-8 pt-8 pb-4 shrink-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
              Dataset Details
            </h2>
          </div>

          {/* O componente Sidebar agora controla o próprio scroll internamente */}
          <div className="flex-1 px-8 pb-8 min-h-0">
            <Sidebar
              contagem={data.sinais_detalhados}
              meta={data.stats.meta}
              onRefresh={() => syncData(true)}
              onLimparSinal={(label) =>
                handleAction(
                  `http://localhost:8000/admin/limpar-sinal/${label}`,
                  "DELETE",
                  `Limpar "${label}"?`,
                )
              }
              onLimparBanco={() =>
                handleAction(
                  `http://localhost:8000/admin/reset-banco`,
                  "DELETE",
                  "⚠️ RESETAR TODO O BANCO?",
                )
              }
              loading={loading}
            />
          </div>
        </aside>
      )}
    </div>
  );
}

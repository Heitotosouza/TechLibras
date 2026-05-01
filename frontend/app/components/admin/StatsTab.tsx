"use client";
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function StatsTab({ users }: { users: any[] }) {
  // Filtros
  const [compUsers, setCompUsers] = useState({ user1: "", user2: "" });
  const [selectedSinal, setSelectedSinal] = useState(""); // Começa vazio até carregar do banco
  const [periodo, setPeriodo] = useState("Mensal");

  // Estados de Dados Dinâmicos
  const [listaSinais, setListaSinais] = useState<string[]>([]); // Sinais vindos do Atlas
  const [barData, setBarData] = useState<any>(null);
  const [lineData, setLineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Efeito para carregar os NOMES dos sinais existentes no Banco
  useEffect(() => {
    const fetchSinaisDisponiveis = async () => {
      try {
        const res = await fetch("http://localhost:8000/admin/lista-sinais");
        const sinais = await res.json();
        setListaSinais(sinais);
        if (sinais.length > 0 && !selectedSinal) {
          setSelectedSinal(sinais[0]); // Seleciona o primeiro sinal da lista por padrão
        }
      } catch (e) {
        console.error("Erro ao buscar nomes dos sinais:", e);
      }
    };
    fetchSinaisDisponiveis();
  }, []);

  // 2. Efeito para Carregar Comparativo (Bar Chart)
  useEffect(() => {
    const fetchComparison = async () => {
      if (!compUsers.user1 && !compUsers.user2) return;

      const res = await fetch(
        `http://localhost:8000/admin/stats/comparison?u1=${compUsers.user1}&u2=${compUsers.user2}`,
      );
      const data = await res.json();

      setBarData({
        labels: ["Coletas Totais", "Diversidade de Sinais", "Empenho Geral"],
        datasets: [
          {
            label: compUsers.user1 || "Selecionar Usuário",
            data: data.user1Metrics,
            backgroundColor: "rgba(16, 185, 129, 0.5)",
            borderColor: "#10b981",
            borderWidth: 2,
          },
          {
            label: compUsers.user2 || "Selecionar Usuário",
            data: data.user2Metrics,
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "#3b82f6",
            borderWidth: 2,
          },
        ],
      });
    };
    fetchComparison();
  }, [compUsers]);

  // 3. Efeito para Carregar Tendência (Line Chart)
  useEffect(() => {
    if (!selectedSinal) return;

    const fetchTrend = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8000/admin/stats/trend?periodo=${periodo}&sinal=${selectedSinal}`,
        );
        const data = await res.json();

        setLineData({
          labels: data.labels,
          datasets: [
            {
              fill: true,
              label: `Volume de Coletas: ${selectedSinal}`,
              data: data.values,
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              tension: 0.4,
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTrend();
  }, [selectedSinal, periodo]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#94a3b8",
          font: { weight: "bold" as const, size: 12 },
        },
      },
    },
    scales: {
      y: { grid: { color: "#1e293b" }, ticks: { color: "#64748b" } },
      x: { grid: { display: false }, ticks: { color: "#64748b" } },
    },
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">
          BI & Performance
        </h2>
      </header>

      {/* --- SEÇÃO 1: COMPARATIVO --- */}
      <section className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest">
            Comparativo de Treineiros
          </h3>
          <div className="flex gap-4 items-center bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <select
              className="bg-transparent text-white px-4 py-2 font-bold outline-none cursor-pointer"
              value={compUsers.user1}
              onChange={(e) =>
                setCompUsers({ ...compUsers, user1: e.target.value })
              }
            >
              <option value="">Treineiro 1</option>
              {users.map((u) => (
                <option key={u._id} value={u.username} className="bg-slate-900">
                  {u.username}
                </option>
              ))}
            </select>
            <span className="text-slate-700 font-black italic">VS</span>
            <select
              className="bg-transparent text-white px-4 py-2 font-bold outline-none cursor-pointer"
              value={compUsers.user2}
              onChange={(e) =>
                setCompUsers({ ...compUsers, user2: e.target.value })
              }
            >
              <option value="">Treineiro 2</option>
              {users.map((u) => (
                <option key={u._id} value={u.username} className="bg-slate-900">
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-[400px]">
          {barData ? (
            <Bar data={barData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 font-bold italic uppercase">
              Selecione dois treineiros para comparar performance
            </div>
          )}
        </div>
      </section>

      {/* --- SEÇÃO 2: ANÁLISE DE SINAIS --- */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest">
              Tendência: {selectedSinal || "..."}
            </h3>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {["Diário", "Semanal", "Mensal", "Anual"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                    periodo === p
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[350px]">
            {loading ? (
              <div className="h-full flex items-center justify-center animate-pulse text-emerald-500 font-black italic">
                PROCESSANDO...
              </div>
            ) : lineData ? (
              <Line data={lineData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-bold italic uppercase">
                Sem dados para este sinal
              </div>
            )}
          </div>
        </div>

        {/* --- MENU LATERAL DINÂMICO --- */}
        <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col">
          <h3 className="text-lg font-bold text-white uppercase mb-6 italic tracking-widest">
            Filtrar Sinal
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {listaSinais.length > 0 ? (
              listaSinais.map((sinal) => (
                <button
                  key={sinal}
                  onClick={() => setSelectedSinal(sinal)}
                  className={`w-full text-left p-4 rounded-2xl font-bold transition-all border ${
                    selectedSinal === sinal
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                      : "bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  Sinal: <span className="uppercase">{sinal}</span>
                </button>
              ))
            ) : (
              <p className="text-slate-600 italic text-sm">
                Carregando sinais do Atlas...
              </p>
            )}
          </div>
          <div className="mt-auto pt-6 border-t border-slate-800/50 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase">
                Status
              </p>
              <p className="text-emerald-500 font-black text-sm italic">
                LIVE DATA
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-600 uppercase">
                Atlas Sync
              </p>
              <p className="text-white font-bold text-sm italic">Online</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

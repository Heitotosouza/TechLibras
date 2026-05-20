"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Activity,
  Target,
  Cpu,
  TrendingUp,
  BarChart3,
  Zap,
} from "lucide-react";

interface NeuralData {
  probabilidades: Record<string, number>;
  ativacoes: number[];
  tempo_ms: number;
}

interface Props {
  data: NeuralData | null;
  mode: "BASICA" | "COMPLETA" | "TREINO" | "OFF";
}

export const NeuralMonitor: React.FC<Props> = ({ data, mode }) => {
  const [history, setHistory] = useState<any>(null);
  const [selectedEpoch, setSelectedEpoch] = useState<number | null>(null);
  const [sinalSelecionado, setSinalSelecionado] = useState("GERAL");

  useEffect(() => {
    if (mode === "TREINO") {
      fetch("http://localhost:8000/admin/training-history")
        .then((res) => res.json())
        .then((d) => setHistory(d))
        .catch(() => console.log("Histórico ainda não disponível"));
    }
  }, [mode]);

  const sortedProbabilities = useMemo(() => {
    return Object.entries(data?.probabilidades || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);
  }, [data?.probabilidades]);

  if (mode === "OFF" || (!data && mode !== "TREINO")) return null;
  const maxConfidence = sortedProbabilities[0]?.[1] || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50 }}
      className="absolute top-6 right-6 w-[420px] bg-slate-950/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-7 text-white shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] z-[100] overflow-hidden"
    >
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 blur-[100px] rounded-full transition-colors duration-700 ${
          mode === "TREINO"
            ? "bg-emerald-500/20"
            : maxConfidence > 0.8
              ? "bg-blue-500/20"
              : "bg-red-500/10"
        }`}
      />

      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-3 h-3 rounded-full animate-ping absolute ${maxConfidence > 0.8 ? "bg-emerald-500" : "bg-blue-500"}`}
            />
            <div
              className={`w-3 h-3 rounded-full relative ${maxConfidence > 0.8 ? "bg-emerald-500" : "bg-blue-500"}`}
            />
          </div>
          <div>
            <h3 className="text-[10px] font-black tracking-[0.4em] text-blue-400 uppercase italic leading-none">
              LSTM Thought Engine
            </h3>
            <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">
              v2.0 Neural-Link
            </span>
          </div>
        </div>
        <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <span className="text-[10px] font-mono text-blue-300 font-bold">
            {data?.tempo_ms || 0}ms
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "BASICA" && (
          <motion.div
            key="basica"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
              <Target size={12} className="text-blue-500" /> Decifrando Gesto:
            </p>
            {sortedProbabilities.map(([sinal, valor], i) => (
              <div
                key={sinal}
                className={`p-4 rounded-2xl border transition-all duration-500 ${i === 0 ? "bg-blue-600/10 border-blue-500/50" : "bg-white/5 border-white/5"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-xs font-black uppercase italic ${i === 0 ? "text-blue-400" : "text-slate-400"}`}
                  >
                    {sinal}
                  </span>
                  <span className="font-mono text-[10px] text-white">
                    {(valor * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${valor * 100}%` }}
                    className={`h-full ${i === 0 ? "bg-gradient-to-r from-blue-600 to-cyan-400" : "bg-slate-700"}`}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {mode === "COMPLETA" && (
          <motion.div
            key="avancada"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
              <Cpu size={12} className="text-blue-400" /> Fluxo de Memória (128
              Neurônios):
            </p>
            <div className="grid grid-cols-16 gap-1 mb-6 bg-black/20 p-4 rounded-3xl border border-white/5">
              {(data?.ativacoes || Array(128).fill(0)).map((nivel, i) => (
                <motion.div
                  key={i}
                  animate={{
                    backgroundColor:
                      nivel > 0.4
                        ? "#3b82f6"
                        : nivel > 0.1
                          ? "#1e293b"
                          : "#0f172a",
                    scale: nivel > 0.4 ? 1.2 : 1,
                  }}
                  className="w-2 h-2 rounded-sm"
                />
              ))}
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4 items-start">
              <Zap size={18} className="text-blue-400 shrink-0" />
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                Pulso representa padrão validado. Brilho indica memória
                temporal.
              </p>
            </div>
          </motion.div>
        )}

        {mode === "TREINO" && (
          <motion.div
            key="treino"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between items-center">
                <p className="text-[9px] text-emerald-400 uppercase font-bold tracking-widest flex items-center gap-2">
                  <TrendingUp size={12} /> Telemetria de Treino
                </p>
                <select
                  onChange={(e) => setSinalSelecionado(e.target.value)}
                  className="bg-slate-900 border border-white/10 text-[9px] text-emerald-400 rounded-md px-2 py-1 outline-none"
                >
                  <option value="GERAL">TODOS OS SINAIS</option>
                  {history?.classes?.map((s: string) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-[8px] text-slate-500 uppercase font-bold ml-2">
                  Época:
                </span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  onChange={(e) => setSelectedEpoch(Number(e.target.value) - 1)}
                  className="bg-transparent text-white font-mono text-xs w-12 outline-none border-b border-emerald-500/30 text-center"
                />
              </div>
            </div>

            <div className="h-32 flex items-end gap-[1.5px] border-b border-white/10 pb-2 mb-4">
              {history?.accuracy.map((acc: number, i: number) => (
                <motion.div
                  key={i}
                  className={`flex-1 ${selectedEpoch === i ? "bg-white shadow-[0_0_10px_#fff]" : "bg-emerald-500/40"}`}
                  style={{ height: `${acc * 100}%` }}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl">
                <span className="text-[8px] text-emerald-500/70 block uppercase">
                  Precisão {sinalSelecionado}
                </span>
                <span className="text-lg font-black text-white">
                  {sinalSelecionado === "GERAL"
                    ? `${((history?.accuracy[selectedEpoch ?? 0] || 0) * 100).toFixed(1)}%`
                    : `${((history?.detalhes_sinais[sinalSelecionado]?.precision || 0) * 100).toFixed(1)}%`}
                </span>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-2xl text-right">
                <span className="text-[8px] text-blue-500/70 block uppercase">
                  Loss #{selectedEpoch ? selectedEpoch + 1 : "?"}
                </span>
                <span className="text-lg font-mono text-white">
                  {selectedEpoch !== null
                    ? history?.loss[selectedEpoch]?.toFixed(4)
                    : "---"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex justify-between items-center text-[8px] font-mono text-slate-600 border-t border-white/5 pt-5 relative z-10">
        <span className="flex items-center gap-2">
          <BarChart3 size={10} /> {mode} ANALYSIS
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 tracking-widest uppercase">
          Stable
        </span>
      </div>
    </motion.div>
  );
};

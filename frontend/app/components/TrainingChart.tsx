"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Activity } from "lucide-react";

export default function TrainingChart() {
  const [history, setHistory] = useState<{
    accuracy: number[];
    loss: number[];
  } | null>(null);
  const [selectedEpoch, setSelectedEpoch] = useState<number | null>(null);

  useEffect(() => {
    // 1. Define a URL base inteligente (Render se no ar / localhost se no PC)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // 2. Ajusta a chamada utilizando Template Literals (crases)
    fetch(`${baseUrl}/admin/training-history`)
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) =>
        console.error("Erro ao carregar telemetria de treino:", err),
      );
      );
  }, []);

  if (!history)
    return <div className="text-white">Carregando Histórico...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-6 right-6 w-[500px] bg-slate-950/95 backdrop-blur-2xl border border-emerald-500/30 rounded-[2.5rem] p-8 text-white shadow-2xl z-[110]"
    >
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="text-emerald-400" />
        <h3 className="font-black italic uppercase tracking-tighter text-xl">
          Evolução do Treinamento
        </h3>
      </div>

      <div className="flex items-end gap-[2px] h-40 border-b border-white/10 pb-2">
        {history.accuracy.map((acc, i) => (
          <div
            key={i}
            onMouseEnter={() => setSelectedEpoch(i)}
            className="flex-1 bg-emerald-500/40 hover:bg-emerald-400 cursor-pointer transition-all"
            style={{
              height: `${acc * 100}%`,
              opacity: selectedEpoch === i ? 1 : 0.6,
            }}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold">
            Época Selecionada
          </p>
          <p className="text-2xl font-black text-emerald-400">
            #{selectedEpoch !== null ? selectedEpoch + 1 : "---"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold">
            Precisão (Accuracy)
          </p>
          <p className="text-2xl font-mono text-white">
            {selectedEpoch !== null
              ? (history.accuracy[selectedEpoch] * 100).toFixed(2)
              : "0"}
            %
          </p>
        </div>
      </div>

      <p className="mt-4 text-[9px] text-slate-400 italic">
        * Passe o mouse sobre as barras para ver o desempenho detalhado de cada
        ciclo da rede LSTM.
      </p>
    </motion.div>
  );
}

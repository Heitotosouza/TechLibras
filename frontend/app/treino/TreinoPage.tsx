"use client";
import React, { useState, useRef } from "react";
import CameraIA from "../components/CameraIA";

export default function TreinoPage() {
  const [sinalAlvo, setSinalAlvo] = useState("OI");
  const [status, setStatus] = useState("Aguardando sinal...");
  const [confianca, setConfianca] = useState(0);

  const trainingBuffer = useRef<any[]>([]);

  const validarSinal = async (landmarks: any) => {
    trainingBuffer.current.push(landmarks);

    if (trainingBuffer.current.length >= 20) {
      try {
        const res = await fetch("http://localhost:8000/prever", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequencia: trainingBuffer.current }),
        });

        const data = await res.json();
        setConfianca(data.confianca || 0);

        if (data.sinal === sinalAlvo && data.confianca > 0.8) {
          setStatus("✅ CORRETO!");
          // No acerto, limpamos o buffer para o próximo sinal
          trainingBuffer.current = [];
          setTimeout(() => setStatus("Tente o próximo..."), 2000);
        } else {
          setStatus("Ajuste a posição...");
        }

        // Desliza o buffer para continuar tentando
        trainingBuffer.current.splice(0, 10);
      } catch (e) {
        console.error("Erro no treino:", e);
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">
          Área de Treino
        </h1>
        <p className="text-slate-400 mb-8">
          Sinal alvo:{" "}
          <span className="text-white font-bold text-2xl">{sinalAlvo}</span>
        </p>

        <div className="relative group">
          <CameraIA modo="ESTUDO" onLandmarksUpdate={validarSinal} />

          {/* Overlay de Status e Confiança */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <div
              className={`px-4 py-2 rounded-full border ${status.includes("✅") ? "bg-emerald-900/80 border-emerald-500" : "bg-black/50 border-slate-500"}`}
            >
              {status}
            </div>
            <div className="bg-black/50 px-4 py-2 rounded-full border border-blue-500">
              Precisão: {(confianca * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setSinalAlvo("OBRIGADO");
            trainingBuffer.current = [];
          }}
          className="mt-8 bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl transition-all"
        >
          Próximo Desafio
        </button>
      </div>
    </main>
  );
}

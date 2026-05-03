"use client";
import React, { useState } from "react";
import CameraIA from "../components/CameraIA";

export default function TraducaoPage() {
  const [textoTraduzido, setTextoTraduzido] = useState("");
  const [inputOuvinte, setInputOuvinte] = useState("");

  const traduzirSinalParaTexto = async (landmarks: any) => {
    const res = await fetch("http://localhost:8000/prever", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landmarks }),
    });
    const data = await res.json();
    if (data.sinal) setTextoTraduzido((prev) => prev + " " + data.sinal);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">
        Tradutor Inteligente
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
        {/* Lado do Surdo (Libras -> Texto/Voz) */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <h2 className="text-lg mb-4 text-slate-400">Sinalizador (Surdo)</h2>
          <CameraIA modo="ESTUDO" onLandmarksUpdate={traduzirSinalParaTexto} />
          <div className="mt-4 p-4 bg-slate-900 rounded-xl min-h-[100px] border border-slate-600">
            <p className="text-emerald-400 font-mono">
              {textoTraduzido || "Sinais aparecerão aqui..."}
            </p>
          </div>
        </div>

        {/* Lado do Ouvinte (Texto -> VLibras) */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex flex-col">
          <h2 className="text-lg mb-4 text-slate-400">
            Ouvinte (Texto para Libras)
          </h2>
          <textarea
            value={inputOuvinte}
            onChange={(e) => setInputOuvinte(e.target.value)}
            className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-600 focus:border-blue-500 outline-none resize-none"
            placeholder="Digite algo para o VLibras sinalizar..."
          />
          <button className="mt-4 bg-blue-600 py-3 rounded-xl font-bold">
            Traduzir para Libras
          </button>

          {/* O Widget do VLibras vai capturar o que for digitado aqui automaticamente */}
        </div>
      </div>
    </main>
  );
}

"use client";
import React, { useState } from "react";
import CameraIA from "../components/CameraIA";
import Sidebar from "../components/Sidebar"; // Se quiser manter a sidebar

export default function TreinoPage() {
  const [sinalAlvo, setSinalAlvo] = useState("LETRA A");
  const [status, setStatus] = useState("Aguardando sinal...");

  const validarSinal = async (landmarks: any) => {
    const res = await fetch("http://localhost:8000/prever", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landmarks }),
    });
    const data = await res.json();

    if (data.sinal === sinalAlvo && data.confianca > 0.8) {
      setStatus("✅ CORRETO!");
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      {/* Script do VLibras será injetado aqui via layout ou useEffect */}

      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">
          Área de Treino
        </h1>
        <p className="text-slate-400 mb-8">
          Tente fazer o sinal:{" "}
          <span className="text-white font-bold text-xl">{sinalAlvo}</span>
        </p>

        <div className="relative group">
          <CameraIA modo="ESTUDO" onLandmarksUpdate={validarSinal} />
          <div className="absolute top-4 right-4 bg-black/50 px-4 py-2 rounded-full border border-emerald-500">
            {status}
          </div>
        </div>

        <button className="mt-8 bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl transition-all">
          Pular Sinal
        </button>
      </div>
    </main>
  );
}

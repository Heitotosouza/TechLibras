"use client";
import React, { useState, useRef } from "react";
import CameraIA from "../components/CameraIA";

export default function TraducaoPage() {
  const [textoTraduzido, setTextoTraduzido] = useState("");
  const [inputOuvinte, setInputOuvinte] = useState("");

  // Criamos um buffer para acumular os 20 frames necessários para o LSTM
  const frameBuffer = useRef<any[]>([]);

  // Definição inteligente da URL base do Back-end
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const traduzirSinalParaTexto = async (landmarks: any) => {
    // 1. Adiciona o frame atual ao buffer
    frameBuffer.current.push(landmarks);

    // 2. Quando atingir 20 frames, enviamos para a IA
    if (frameBuffer.current.length >= 20) {
      try {
        const res = await fetch(`${baseUrl}/prever`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequencia: frameBuffer.current }),
        });

        const data = await res.json();

        if (data.status === "success" && data.confianca > 0.85) {
          setTextoTraduzido((prev) => {
            const palavras = prev.trim().split(" ");
            // Evita repetir a mesma palavra se ela acabou de ser detectada
            if (palavras[palavras.length - 1] === data.sinal) return prev;
            return prev + " " + data.sinal;
          });
        }

        // 3. Remove os 5 frames mais antigos (Janela Deslizante)
        // Isso permite que a IA analise o movimento continuamente
        frameBuffer.current.splice(0, 5);
      } catch (error) {
        console.error("Erro na tradução:", error);
        // Evita estouro de memória se a API cair: limpa parcialmente o buffer
        frameBuffer.current.splice(0, 5);
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">
        Tradutor Inteligente
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <h2 className="text-lg mb-4 text-slate-400">Sinalizador (Surdo)</h2>
          <CameraIA modo="ESTUDO" onLandmarksUpdate={traduzirSinalParaTexto} />
          <div className="mt-4 p-4 bg-slate-900 rounded-xl min-h-[100px] border border-slate-600">
            <p className="text-emerald-400 font-mono text-xl">
              {textoTraduzido || "Aguardando movimentos..."}
            </p>
          </div>
          <button
            onClick={() => setTextoTraduzido("")}
            className="mt-2 text-xs text-slate-500 underline"
          >
            Limpar conversa
          </button>
        </div>

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
          <button className="mt-4 bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">
            Traduzir para Libras
          </button>
        </div>
      </div>
    </main>
  );
}

"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Trash2,
  Database,
  Search,
  Camera,
  VideoOff,
  Loader2,
} from "lucide-react";

interface CollectProps {
  stats: { total: number; meta: number };
  userRole?: string;
  currentUser?: string;
  tipoCaptura?: "ESTATICO" | "DINAMICO";
}

export default function CollectTab({
  stats,
  userRole,
  currentUser,
  tipoCaptura = "ESTATICO",
}: CollectProps) {
  const [nomeSinal, setNomeSinal] = useState("");
  const [streamAtiva, setStreamAtiva] = useState(false);
  const [busca, setBusca] = useState("");
  const [listaSinaisFull, setListaSinaisFull] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarksRef = useRef<any>(null);

  const iniciarGravacaoMestre = useCallback(async () => {
    if (!nomeSinal) return;
    if (isRecording) return;

    setIsRecording(true);
    setProgress(0);

    const totalFramesEsperados = 20;
    const framesColetados: any[] = [];
    let ultimaMaoValida: any = null;

    // Dá 1 segundo de preparação para o usuário estabilizar a mão antes de gravar
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const intervalo = setInterval(async () => {
      if (handLandmarksRef.current) {
        // Guarda o frame e atualiza a última posição conhecida
        framesColetados.push(handLandmarksRef.current);
        ultimaMaoValida = handLandmarksRef.current;
      } else if (ultimaMaoValida) {
        // 🛡️ FILTRO ANTI-SUMIÇO: Se a mão sumiu rápido, repete o último frame conhecido
        framesColetados.push(ultimaMaoValida);
      }

      if (framesColetados.length > 0) {
        setProgress(
          Math.round((framesColetados.length / totalFramesEsperados) * 100),
        );
      }

      if (framesColetados.length >= totalFramesEsperados) {
        clearInterval(intervalo);

        // Só envia se realmente conseguimos coletar dados úteis
        if (
          framesColetados.length === totalFramesEsperados &&
          ultimaMaoValida !== null
        ) {
          try {
            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            await fetch(`${baseUrl}/salvar-sinal`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nome: nomeSinal.toUpperCase(),
                autor: currentUser || "Admin",
                tipo: tipoCaptura,
                landmarks:
                  tipoCaptura === "DINAMICO"
                    ? framesColetados
                    : handLandmarksRef.current,
                data_coleta: new Date().toISOString(),
              }),
            });
          } catch (err) {
            console.error("Erro no envio:", err);
          }
        }

        setIsRecording(false);
        carregarSinaisDetalhado();
      }
    }, 60); // ~60ms por frame dá uma janela confortável de 1.2 segundos de movimento
  }, [nomeSinal, isRecording, currentUser, tipoCaptura]);

  // --- ATALHO DE TECLADO (TECLA G) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key.toLowerCase() === "g") {
        iniciarGravacaoMestre();
      }
    };

    window.window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [iniciarGravacaoMestre]);

  // --- MEDIAPIPE (CARREGAMENTO VIA CDN) ---
  useEffect(() => {
    const loadScripts = async () => {
      const scripts = [
        "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
        "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
      ];
      for (const src of scripts) {
        if (!document.querySelector(`script[src="${src}"]`)) {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve) => (script.onload = resolve));
        }
      }
      if (streamAtiva && videoRef.current) {
        const mpHands = (window as any).Hands;
        const mpDrawing = window as any;
        if (!mpHands) return;

        const hands = new mpHands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => {
          if (!canvasRef.current) return;
          const canvasCtx = canvasRef.current.getContext("2d")!;
          canvasCtx.save();
          canvasCtx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height,
          );
          if (
            results.multiHandLandmarks &&
            results.multiHandLandmarks.length > 0
          ) {
            handLandmarksRef.current = results.multiHandLandmarks[0];
            mpDrawing.drawConnectors(
              canvasCtx,
              handLandmarksRef.current,
              mpDrawing.HAND_CONNECTIONS,
              { color: "#10b981", lineWidth: 3 },
            );
            mpDrawing.drawLandmarks(canvasCtx, handLandmarksRef.current, {
              color: "#ffffff",
              lineWidth: 1,
              radius: 2,
            });
          } else {
            handLandmarksRef.current = null;
          }
          canvasCtx.restore();
        });

        const processVideo = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              await hands.send({ image: videoRef.current });
            } catch (e) {}
          }
          requestAnimationFrame(processVideo);
        };
        processVideo();
      }
    };
    loadScripts();
  }, [streamAtiva]);

  // --- UTILITÁRIOS (ATUALIZADO COM URL DINÂMICA) ---
  const carregarSinaisDetalhado = async () => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${baseUrl}/admin/lista-sinais-detalhada`);
      const sinais = await res.json();
      setListaSinaisFull(Array.isArray(sinais) ? sinais : []);
    } catch (err) {
      console.error("Erro ao carregar lista de sinais:", err);
    }
  };

  const ligarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamAtiva(true);
      }
    } catch (err) {}
  };

  useEffect(() => {
    ligarCamera();
    carregarSinaisDetalhado();
  }, []);

  const sinaisFiltrados = listaSinaisFull.filter((s) =>
    s.nome?.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">
            Coleta <span className="text-emerald-500">Live</span>
          </h2>
          <div className="h-2 w-48 bg-emerald-600 mt-2 rounded-full" />
          <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">
            Atalho: Pressione [G] para gravar
          </p>
        </div>
        <div className="text-right text-3xl font-black text-white italic">
          {stats?.total || 0}{" "}
          <span className="text-emerald-500">/ {stats?.meta || 500}</span>
        </div>
      </header>

      <div className="relative aspect-video w-full bg-slate-950 rounded-[3.5rem] border-4 border-slate-800 overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          width={1280}
          height={720}
        />

        {isRecording && (
          <div className="absolute inset-x-10 bottom-10 bg-black/80 backdrop-blur-md p-6 rounded-3xl border border-emerald-500/50 z-10 animate-pulse">
            <div className="flex justify-between mb-3 text-emerald-400 font-black uppercase text-xs">
              <span>Capturando Rajada LSTM: {progress}%</span>
              <Loader2 className="animate-spin" size={16} />
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/90 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col md:flex-row gap-4 shadow-2xl">
        <input
          type="text"
          placeholder="NOME DO SINAL (EX: L)"
          className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-2xl px-8 py-5 font-bold text-white uppercase focus:border-emerald-500 outline-none"
          value={nomeSinal}
          onChange={(e) => setNomeSinal(e.target.value)}
        />
        <button
          onClick={iniciarGravacaoMestre}
          disabled={!nomeSinal || !streamAtiva || isRecording}
          className={`px-12 py-5 rounded-2xl font-black uppercase italic transition-all flex items-center gap-3 ${
            isRecording
              ? "bg-red-600 text-white"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          }`}
        >
          {isRecording ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Camera size={20} />
          )}
          {isRecording ? "Gravando..." : "Gravar (G)"}
        </button>
      </div>

      <section className="bg-slate-900/50 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
          <h3 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
            <Database className="text-emerald-500" /> Histórico de Captura
          </h3>
          <div className="relative w-64">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              size={16}
            />
            <input
              type="text"
              placeholder="BUSCAR..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-[10px] font-bold text-white uppercase outline-none"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-950 z-10 text-slate-600 text-[10px] uppercase font-black">
              <tr>
                <th className="p-6">Sinal</th>
                <th className="p-6">Autor</th>
                <th className="p-6">Tipo</th>
                <th className="p-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sinaisFiltrados.map((sinal) => (
                <tr
                  key={sinal._id}
                  className="hover:bg-slate-800/20 transition-colors group"
                >
                  <td className="p-6">
                    <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-lg font-black text-xs italic">
                      {sinal.nome}
                    </span>
                  </td>
                  <td className="p-6 font-bold text-slate-300 text-sm uppercase">
                    {sinal.autor}
                  </td>
                  <td className="p-6 text-[10px] text-slate-400 font-bold uppercase italic">
                    {sinal.tipo}
                  </td>
                  <td className="p-6 text-center">
                    <button
                      onClick={() => {}}
                      className="text-slate-700 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

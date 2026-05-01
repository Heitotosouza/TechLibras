"use client";
import React, { useState, useRef, useEffect } from "react";

interface CollectProps {
  stats: { total: number; meta: number };
}

export default function CollectTab({ stats }: CollectProps) {
  const [nomeSinal, setNomeSinal] = useState("");
  const [streamAtiva, setStreamAtiva] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const ligarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamAtiva(true);
      }
    } catch (err) {
      console.error("Webcam Error:", err);
    }
  };

  useEffect(() => {
    ligarCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">
            Coleta
          </h2>
          <div className="h-2 w-32 bg-emerald-500 mt-2" />
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            Sinais no MongoDB Atlas
          </p>
          <p className="text-3xl font-black text-emerald-500">
            {stats?.total || 0} / {stats?.meta || 500}
          </p>
        </div>
      </header>

      {/* Container do Vídeo */}
      <div className="relative aspect-video w-full bg-slate-950 rounded-[3rem] border-4 border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center group">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-1000 ${
            streamAtiva ? "opacity-100" : "opacity-0"
          }`}
        />
        
        {!streamAtiva && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-black text-xl italic uppercase tracking-[0.5em]">
              Câmera Offline
            </p>
          </div>
        )}

        <div className="absolute top-8 left-8 bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full">
           <span className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             Live Stream: Active
           </span>
        </div>
      </div>

      {/* Painel de Ação */}
      <div className="bg-slate-900/80 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col md:flex-row gap-4 shadow-2xl">
        <input
          type="text"
          placeholder="NOME DO SINAL (EX: OBRIGADO)"
          className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-2xl px-8 py-5 font-bold text-white uppercase focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700"
          value={nomeSinal}
          onChange={(e) => setNomeSinal(e.target.value)}
        />
        <button 
          onClick={() => alert(`Gravando: ${nomeSinal}`)}
          disabled={!nomeSinal || !streamAtiva}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black px-12 py-5 rounded-2xl uppercase italic active:scale-95 transition-all shadow-lg"
        >
          Gravar Amostra
        </button>
      </div>
    </div>
  );
}
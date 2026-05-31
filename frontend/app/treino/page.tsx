"use client";
import React, { useState, useRef, useEffect } from "react";
import CameraIA from "../components/CameraIA";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, List, ArrowLeft, BrainCircuit, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TreinoPage() {
  const router = useRouter();
  const [modoTreino, setModoTreino] = useState<
    "menu" | "sorteado" | "escolhido"
  >("menu");
  const [listaSinais, setListaSinais] = useState<string[]>([]); // Sinais vindos do DB
  const [sinalAlvo, setSinalAlvo] = useState("");
  const [status, setStatus] = useState("Aguardando sinal...");
  const [confianca, setConfianca] = useState(0);
  const [showDebug, setShowDebug] = useState(false); // Tecla D
  const [debugData, setDebugData] = useState<any>(null);

  const trainingBuffer = useRef<any[]>([]);

  // Definição inteligente da URL base do Back-end (Hospedagem na Nuvem / Localhost)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // 1. BUSCAR SINAIS DO BANCO DE DADOS AO CARREGAR
  useEffect(() => {
    const fetchSinais = async () => {
      try {
        const res = await fetch(`${baseUrl}/contagem-sinais`);
        const data = await res.json();
        // data vem como { "OI": 10, "OBRIGADO": 5 ... }
        const nomesSinais = Object.keys(data);
        setListaSinais(nomesSinais);
      } catch (err) {
        console.error("Erro ao carregar sinais do DB:", err);
      }
    };
    fetchSinais();
  }, [baseUrl]);

  // 2. ATALHOS DE TECLADO (D e H)
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key.toUpperCase() === "D") setShowDebug((prev) => !prev);
      if (e.key.toUpperCase() === "H") router.push("/"); // Volta pro Dashboard (Chatbot)
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [router]);

  // Lógica para sortear sinal (usando a lista do DB)
  const sortearSinal = () => {
    if (listaSinais.length === 0) return;
    const outrosSinais = listaSinais.filter((s) => s !== sinalAlvo);
    const sorteado =
      outrosSinais[Math.floor(Math.random() * outrosSinais.length)];
    setSinalAlvo(sorteado);
    trainingBuffer.current = [];
    setStatus("Sinal sorteado! Pode começar.");
  };

  const validarSinal = async (landmarks: any) => {
    trainingBuffer.current.push(landmarks);

    if (trainingBuffer.current.length >= 20) {
      try {
        const res = await fetch(`${baseUrl}/prever`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequencia: trainingBuffer.current }),
        });

        const data = await res.json();
        setDebugData(data.debug); // Dados pros gráficos dos jurados
        const confiancaObtida = data.confianca || 0;
        setConfianca(confiancaObtida);

        if (data.sinal === sinalAlvo && confiancaObtida > 0.8) {
          setStatus("✅ EXCELENTE!");
          trainingBuffer.current = [];
          if (modoTreino === "sorteado") {
            setTimeout(sortearSinal, 2000);
          }
        } else {
          setStatus(
            confiancaObtida > 0.5 ? "Quase lá..." : "Aguardando movimento...",
          );
        }
        trainingBuffer.current.splice(0, 10);
      } catch (e) {
        console.error("Erro no treino:", e);
        // Evita estouro de memória no array caso a API falhe na resposta
        trainingBuffer.current.splice(0, 10);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white p-4 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() =>
              modoTreino === "menu" ? router.push("/") : setModoTreino("menu")
            }
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-all uppercase text-[10px] font-black tracking-[0.2em]"
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-md border ${showDebug ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-slate-800 text-slate-600"}`}
            >
              <Activity size={14} />
              <span className="text-[10px] font-black italic">
                MODO DIAGNÓSTICO (D)
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {modoTreino === "menu" ? (
            /* MENU */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-20"
            >
              <button
                onClick={() => {
                  setModoTreino("sorteado");
                  sortearSinal();
                }}
                className="p-10 rounded-[3rem] bg-slate-900/40 border border-white/5 hover:border-emerald-500/50 transition-all text-left group"
              >
                <Shuffle
                  className="text-emerald-500 mb-4 group-hover:rotate-180 transition-transform duration-500"
                  size={40}
                />
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                  Sorteio IA
                </h2>
                <p className="text-slate-500 text-sm mt-2 font-medium">
                  A IA puxa sinais do banco de dados aleatoriamente.
                </p>
              </button>

              <button
                onClick={() => setModoTreino("escolhido")}
                className="p-10 rounded-[3rem] bg-slate-900/40 border border-white/5 hover:border-blue-500/50 transition-all text-left group"
              >
                <List
                  className="text-blue-500 mb-4 group-hover:scale-110 transition-transform"
                  size={40}
                />
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                  Escolha Manual
                </h2>
                <p className="text-slate-500 text-sm mt-2 font-medium">
                  Pratique um sinal específico da nossa base de dados.
                </p>
              </button>
            </motion.div>
          ) : (
            /* TREINO */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[70vh]">
              {/* Esquerda: Objetivo */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BrainCircuit size={80} />
                  </div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">
                    Treinando sinal:
                  </p>

                  {modoTreino === "escolhido" ? (
                    <select
                      value={sinalAlvo}
                      onChange={(e) => {
                        setSinalAlvo(e.target.value);
                        trainingBuffer.current = [];
                      }}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-2xl font-black uppercase italic outline-none text-emerald-400"
                    >
                      <option value="">SELECIONE...</option>
                      {listaSinais.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white">
                      {sinalAlvo || "---"}
                    </h2>
                  )}
                </div>

                <div className="flex-1 bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-6 relative">
                  {/* GRÁFICOS DOS JURADOS (SÓ APARECE SE APERTAR D) */}
                  {showDebug && debugData ? (
                    <div className="h-full flex flex-col justify-between">
                      <p className="text-[10px] font-bold text-blue-400 mb-4">
                        RAIO-X DOS NEURÔNIOS (LSTM)
                      </p>
                      <div className="grid grid-cols-8 gap-1">
                        {debugData.ativacoes?.map((val: number, i: number) => (
                          <motion.div
                            key={i}
                            key={i}
                            animate={{ opacity: val + 0.2, scale: val + 0.8 }}
                            className="h-4 bg-blue-500 rounded-sm"
                          />
                        ))}
                      </div>
                      <div className="mt-6 border-t border-white/5 pt-4">
                        <p className="text-[10px] font-bold text-emerald-400">
                          DISTRIBUIÇÃO DE CERTEZA
                        </p>
                        {Object.entries(debugData.probabilidades || {}).map(
                          ([label, prob]: any) => (
                            <div key={label} className="mt-2">
                              <div className="flex justify-between text-[8px] font-black uppercase">
                                <span>{label}</span>
                                <span>{(prob * 100).toFixed(0)}%</span>
                              </div>
                              <div className="h-1 bg-white/5 w-full mt-1">
                                <div
                                  className="h-full bg-emerald-500 transition-all"
                                  style={{ width: `${prob * 100}%` }}
                                />
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center">
                      <p className="text-slate-600 text-xs font-bold uppercase tracking-widest leading-loose">
                        Aperte [D] para ver o<br />
                        pensamento da IA
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Direita: Câmera */}
              <div className="lg:col-span-8 bg-black rounded-[3rem] border border-white/10 relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <CameraIA modo="ESTUDO" onLandmarksUpdate={validarSinal} />

                {/* Feedback UI */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">
                      Status do Processamento
                    </p>
                    <h3
                      className={`text-xl font-black italic uppercase ${status.includes("✅") ? "text-emerald-400" : "text-white"}`}
                    >
                      {status}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-6xl font-black italic text-emerald-500/30">
                      {(confianca * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

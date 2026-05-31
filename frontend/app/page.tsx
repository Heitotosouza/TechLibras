"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CameraIA from "./components/CameraIA";
import Sidebar from "./components/Sidebar";
import AcessoCard from "./auth/AcessoCard";
import AdminPanel from "./components/AdminPanel";
import StudentDashboard from "./components/StudentDashboard";
import { NeuralMonitor } from "./components/NeuralMonitor";

export default function Home() {
  const router = useRouter();

  // --- ESTADOS DE SESSÃO E USUÁRIO ---
  const [role, setRole] = useState<"ESTUDANTE" | "TREINADOR" | "ADMIN" | null>(
    null,
  );
  const [username, setUsername] = useState<string | null>(null);

  // --- ESTADO DE ALTERNÂNCIA (LOGIN / CADASTRO) ---
  const [isLogin, setIsLogin] = useState(true);

  // --- ESTADOS DE COLETA E INTERFACE ---
  const [contagem, setContagem] = useState({});
  const [nomeSinal, setNomeSinal] = useState("");
  const [landmarksAtuais, setLandmarksAtuais] = useState<any>(null);
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const [estaGravando, setEstaGravando] = useState(false);
  const [tipoSinal, setTipoSinal] = useState<"ESTATICO" | "DINAMICO">(
    "ESTATICO",
  );

  // --- ESTADOS DO MONITOR NEURAL (TECLA D) ---
  const [viewMode, setViewMode] = useState<"OFF" | "BASICA" | "COMPLETA">(
    "OFF",
  );
  const [neuralDebug, setNeuralDebug] = useState({
    probabilidades: {},
    ativacoes: Array(64).fill(0),
    tempo_ms: 0,
  });

  const META = 300;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // --- EFEITO: CARREGAR SESSÃO AO INICIAR ---
  useEffect(() => {
    const savedUser = localStorage.getItem("techlibras_user");
    if (savedUser) {
      try {
        const { username, role } = JSON.parse(savedUser);
        setUsername(username);
        setRole(role);
      } catch (e) {
        console.error("Erro ao carregar sessão");
      }
    }
  }, []);

  // --- EFEITO: ATALHOS DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "h") setAjudaAberta((prev) => !prev);
      if (key === "d") {
        setViewMode((prev) => {
          if (prev === "OFF") return "BASICA";
          if (prev === "BASICA") return "COMPLETA";
          if (prev === "COMPLETA") return "TREINO";
          return "OFF";
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- FUNÇÃO: PROCESSAR PREDIÇÃO DA IA ---
  const aoReceberPredicao = (resultado: any) => {
    if (resultado.debug) {
      setNeuralDebug({
        probabilidades: resultado.debug.probabilidades || {},
        ativacoes: resultado.debug.ativacoes || Array(64).fill(0),
        tempo_ms: resultado.debug.tempo_ms || 0,
      });
      if (resultado.sinal === "DADOS" && resultado.confianca > 0.9) {
        setViewMode("BASICA");
      }
    }
  };

  // --- FUNÇÃO: ATUALIZAR CONTAGEM DO DATASET ---
  const atualizarContagem = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/contagem-sinais`);
      if (res.ok) {
        const data = await res.json();
        setContagem(data);
      }
    } catch (e) {
      console.error("Erro ao buscar contagem:", e);
    }
  }, [API_BASE]);

  useEffect(() => {
    if (role) atualizarContagem();
  }, [role, atualizarContagem]);

  // --- FUNÇÃO: GRAVAR SINAL (ESTÁTICO OU DINÂMICO) ---
  const handleGravarSequencia = async () => {
    if (!nomeSinal) return alert("Digite o nome do sinal!");

    setEstaGravando(true);
    let framesColetados: any[] = [];
    let contador = 0;

    const timer = setInterval(async () => {
      if (tipoSinal === "DINAMICO") {
        framesColetados.push(landmarksAtuais);
      } else {
        await enviarAmostra(landmarksAtuais, "ESTATICO", 1);
      }

      contador++;
      if (contador >= 20) {
        clearInterval(timer);
        if (tipoSinal === "DINAMICO") {
          await enviarAmostra(framesColetados, "DINAMICO", 1);
        }
        setEstaGravando(false);
        atualizarContagem();
        alert(`Coleta de "${nomeSinal.toUpperCase()}" finalizada com sucesso!`);
      }
    }, 120);
  };

  const enviarAmostra = async (dados: any, tipo: string, qtd: number) => {
    try {
      await fetch(`${API_BASE}/salvar-sinal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeSinal.toUpperCase(),
          landmarks: dados,
          tipo: tipo,
          autor: username,
          quantidade: qtd,
        }),
      });
    } catch (err) {
      console.error("Erro ao salvar sinal:", err);
    }
  };

  // --- FUNÇÕES DE AUTH ---
  const handleLogin = async (u: string, p: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "ID de Operador ou Senha incorretos.");
        return;
      }

      if (data.status === "success") {
        setRole(data.role);
        setUsername(data.username);
        localStorage.setItem(
          "techlibras_user",
          JSON.stringify({ username: data.username, role: data.role }),
        );
      }
    } catch (e) {
      alert("Erro de conexão com o servidor backend.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("techlibras_user");
    window.location.reload();
  };

  const handleCadastro = async (u: string, p: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/usuarios/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p, role: "ESTUDANTE" }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Não foi possível efetuar o registro.");
        return;
      }

      if (data.status === "success") {
        alert("Conta implantada com sucesso! Autenticando sessão...");
        // Faz o login automático após cadastrar
        await handleLogin(u, p);
      }
    } catch (e) {
      alert(
        "Erro ao cadastrar. Verifique se o backend em Python está rodando.",
      );
    }
  };

  const handleBypass = () => {
    setRole("ESTUDANTE");
    setUsername("Visitante");
    localStorage.setItem(
      "techlibras_user",
      JSON.stringify({ username: "Visitante", role: "ESTUDANTE" }),
    );
  };

  // --- TELA DE LOGIN ---
  if (!role) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 font-sans">
        <div className="w-full max-w-md flex flex-col gap-6 text-center">
          {/* Repassando os estados de controle que o seu AcessoCard exige */}
          <AcessoCard
            isLogin={isLogin}
            setIsLogin={setIsLogin}
            onLogin={handleLogin}
            onCadastrar={handleCadastro}
            onBypass={handleBypass}
          />
        </div>
      </main>
    );
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <main className="min-h-screen bg-[#0b1120] text-white overflow-hidden relative">
      <NeuralMonitor data={neuralDebug} mode={viewMode} />

      <div className="flex h-screen">
        <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto custom-scrollbar">
          <header className="mb-10 text-center relative w-full max-w-6xl">
            <button
              onClick={handleLogout}
              className="absolute right-0 top-0 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all"
            >
              Encerrar Sessão
            </button>
            <h1 className="text-4xl font-black text-emerald-400 italic tracking-tighter uppercase">
              TechLibras
            </h1>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-xs mt-1">
              Terminal: <span className="text-emerald-400">{username}</span> |
              Privilégio: <span className="text-blue-400">{role}</span>
            </p>
          </header>

          {/* CONTEÚDO POR CARGO */}
          {role === "ESTUDANTE" && <StudentDashboard username={username} />}

          {role === "TREINADOR" && (
            <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95">
              <CameraIA
                modo="TREINO"
                onLandmarksUpdate={setLandmarksAtuais}
                onPrediction={aoReceberPredicao}
              />

              <div className="mt-8 p-8 bg-slate-900/50 rounded-[2.5rem] border border-slate-800 w-full max-w-[700px] backdrop-blur-sm shadow-2xl">
                <div className="flex gap-2 mb-6 bg-slate-950 p-1.5 rounded-2xl w-fit border border-slate-800">
                  <button
                    onClick={() => setTipoSinal("ESTATICO")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${tipoSinal === "ESTATICO" ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    🖼️ GESTO ESTÁTICO
                  </button>
                  <button
                    onClick={() => setTipoSinal("DINAMICO")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${tipoSinal === "DINAMICO" ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    🎬 GESTO DINÂMICO
                  </button>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={nomeSinal}
                    onChange={(e) => setNomeSinal(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-bold placeholder:text-slate-700"
                    placeholder="QUAL O NOME DO SINAL?"
                  />
                  <button
                    onClick={handleGravarSequencia}
                    disabled={estaGravando}
                    className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${estaGravando ? "bg-red-600 animate-pulse cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400 text-slate-900"}`}
                  >
                    {estaGravando ? "Gravando..." : "Salvar Agora"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-4 text-center font-bold uppercase tracking-widest">
                  Atenção: Os dados salvos serão revisados pela administração.
                </p>
              </div>
            </div>
          )}

          {role === "ADMIN" && <AdminPanel />}
        </div>

        {/* SIDEBAR GLOBAL (Apenas para TREINADOR) */}
        {role === "TREINADOR" && (
          <Sidebar
            contagem={contagem}
            meta={META}
            loading={estaGravando}
            onRefresh={atualizarContagem}
          />
        )}
      </div>

      {/* MODAL DE AJUDA */}
      {ajudaAberta && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/30 p-10 rounded-[3.5rem] w-full max-w-[600px] flex flex-col items-center shadow-2xl">
            <h2 className="text-3xl font-black text-emerald-400 mb-2 italic uppercase">
              Assistente Core
            </h2>
            <div className="w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden border-4 border-slate-800 mb-8">
              <CameraIA
                modo="ESTUDO"
                onPrediction={aoReceberPredicao}
                onLandmarksUpdate={() => {}}
              />
            </div>
            <button
              onClick={() => setAjudaAberta(false)}
              className="px-12 py-4 bg-slate-800 rounded-full font-black uppercase text-[10px] text-slate-300 hover:bg-red-500 hover:text-white transition-all tracking-widest"
            >
              Encerrar Chat (H)
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

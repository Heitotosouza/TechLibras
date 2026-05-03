"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CameraIA from "./components/CameraIA";
import Sidebar from "./components/Sidebar";
import AcessoCard from "./components/AcessoCard";
import AdminPanel from "./components/AdminPanel";
import StudentDashboard from "./components/StudentDashboard";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<"ESTUDANTE" | "TREINADOR" | "ADMIN" | null>(
    null,
  );
  const [username, setUsername] = useState<string | null>(null);
  const [contagem, setContagem] = useState({});
  const [nomeSinal, setNomeSinal] = useState("");
  const [landmarksAtuais, setLandmarksAtuais] = useState<any>(null);
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const [estaGravando, setEstaGravando] = useState(false);
  const [tipoSinal, setTipoSinal] = useState<"ESTATICO" | "DINAMICO">(
    "ESTATICO",
  );
  const META = 300;

  useEffect(() => {
    const savedUser = localStorage.getItem("techlibras_user");
    if (savedUser) {
      const { username, role } = JSON.parse(savedUser);
      setUsername(username);
      setRole(role);
    }
  }, []);

  const atualizarContagem = async () => {
    try {
      const res = await fetch("http://localhost:8000/contagem-sinais");
      setContagem(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "h") setAjudaAberta((prev) => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (role && role !== "ESTUDANTE") atualizarContagem();
  }, [role]);

  // LOGICA DE GRAVAÇÃO ATUALIZADA
  const handleGravarSequencia = async () => {
    if (!nomeSinal) return alert("Digite o nome do sinal!");
    if (!landmarksAtuais) return alert("IA não detectou as mãos.");

    setEstaGravando(true);
    let framesColetados: any[] = [];
    let contador = 0;

    const timer = setInterval(async () => {
      if (tipoSinal === "DINAMICO") {
        framesColetados.push(landmarksAtuais);
      } else {
        // Modo Estático: Envia imediatamente (Burst Mode)
        enviarAmostra(landmarksAtuais, "ESTATICO", 1);
      }

      contador++;

      if (contador >= 20) {
        clearInterval(timer);

        // Se for dinâmico, envia o pacote de frames agora
        if (tipoSinal === "DINAMICO") {
          await enviarAmostra(framesColetados, "DINAMICO", 1);
        }

        setEstaGravando(false);
        atualizarContagem();
        alert(`Sucesso! Coleta de "${nomeSinal}" (${tipoSinal}) finalizada.`);
      }
    }, 120); // ~8 frames por segundo
  };

  const enviarAmostra = async (dados: any, tipo: string, qtd: number) => {
    try {
      await fetch("http://localhost:8000/salvar-sinal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeSinal.toUpperCase(),
          landmarks: dados,
          tipo: tipo,
          autor: username,
          quantidade: qtd,
          data_hora: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  };

  const handleLogin = async (u: string, p: string) => {
    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setRole(data.role);
        setUsername(data.username);
        localStorage.setItem(
          "techlibras_user",
          JSON.stringify({ username: data.username, role: data.role }),
        );
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Erro ao conectar ao servidor.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("techlibras_user");
    setRole(null);
    setUsername(null);
    router.push("/");
  };

  const handleCadastro = async (u: string, p: string) => {
    try {
      const res = await fetch("http://localhost:8000/usuarios/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p, role: "ESTUDANTE" }),
      });
      const data = await res.json();
      if (data.status === "success") alert("Conta criada!");
      else alert(data.message);
    } catch (e) {
      alert("Erro ao cadastrar.");
    }
  };

  const entrarComoVisitante = () => {
    const visitorData = { username: "Visitante", role: "ESTUDANTE" as const };
    setRole(visitorData.role);
    setUsername(visitorData.username);
    localStorage.setItem("techlibras_user", JSON.stringify(visitorData));
  };

  if (!role) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
        <div className="w-full max-w-md flex flex-col gap-6 text-center">
          <h1 className="text-5xl font-black text-emerald-400 italic">
            TechLibras
          </h1>
          <AcessoCard onLogin={handleLogin} onCadastrar={handleCadastro} />
          <button
            onClick={entrarComoVisitante}
            className="text-emerald-400 font-bold border-2 border-dashed border-emerald-500/20 p-4 rounded-3xl"
          >
            🚀 Modo Estudo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white overflow-hidden">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto">
          <header className="mb-10 text-center relative w-full max-w-6xl">
            <button
              onClick={handleLogout}
              className="absolute right-0 top-0 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl font-bold uppercase text-[10px]"
            >
              Sair
            </button>
            <h1 className="text-4xl font-black text-emerald-400 italic">
              TechLibras
            </h1>
            <p className="text-slate-400">
              Olá, <span className="text-emerald-200">{username}</span>
            </p>
          </header>

          {role === "ESTUDANTE" && <StudentDashboard username={username} />}

          {role === "TREINADOR" && (
            <>
              <CameraIA modo="TREINO" onLandmarksUpdate={setLandmarksAtuais} />
              <div className="mt-8 p-6 bg-slate-800 rounded-3xl border border-slate-700 w-full max-w-[640px]">
                {/* SELETOR DE TIPO */}
                <div className="flex gap-2 mb-4 bg-slate-900 p-1 rounded-2xl w-fit border border-slate-700">
                  <button
                    onClick={() => setTipoSinal("ESTATICO")}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${tipoSinal === "ESTATICO" ? "bg-emerald-600 text-white" : "text-slate-500"}`}
                  >
                    🖼️ ESTÁTICO
                  </button>
                  <button
                    onClick={() => setTipoSinal("DINAMICO")}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${tipoSinal === "DINAMICO" ? "bg-blue-600 text-white" : "text-slate-500"}`}
                  >
                    🎬 DINÂMICO
                  </button>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={nomeSinal}
                    onChange={(e) => setNomeSinal(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500"
                    placeholder="NOME DO SINAL..."
                  />
                  <button
                    onClick={handleGravarSequencia}
                    disabled={estaGravando}
                    className={`px-8 py-2 rounded-xl font-bold transition-all ${estaGravando ? "bg-red-600 animate-pulse" : "bg-emerald-600 hover:bg-emerald-500"}`}
                  >
                    {estaGravando
                      ? "GRAVANDO..."
                      : tipoSinal === "DINAMICO"
                        ? "GRAVAR MOVIMENTO"
                        : "GRAVAR 20x"}
                  </button>
                </div>
              </div>
            </>
          )}

          {role === "ADMIN" && <AdminPanel />}
        </div>

        {role !== "ESTUDANTE" && (
          <Sidebar
            contagem={contagem}
            meta={META}
            onRefresh={atualizarContagem}
          />
        )}
      </div>

      {ajudaAberta && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="bg-slate-800 border-2 border-emerald-500 p-8 rounded-[3rem] w-full max-w-[550px] flex flex-col items-center">
            <h2 className="text-3xl font-black text-emerald-400 mb-6 italic">
              Assistente IA
            </h2>
            <div className="w-full aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-slate-700 mb-6">
              <CameraIA
                modo="ESTUDO"
                onLandmarksUpdate={async (landmarks) => {
                  if (ajudaAberta) {
                    const res = await fetch(
                      "http://localhost:8000/chatbot-ajuda",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ landmarks }),
                      },
                    );
                    const data = await res.json();
                    if (data.acao === "logout") {
                      handleLogout();
                      setAjudaAberta(false);
                    }
                  }
                }}
              />
            </div>
            <button
              onClick={() => setAjudaAberta(false)}
              className="px-10 py-3 bg-slate-700 rounded-full font-bold uppercase text-xs"
            >
              Fechar (H)
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

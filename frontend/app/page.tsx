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
  const META = 300;

  // --- LOGICA DE PERSISTÊNCIA (CARREGAR) ---
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

        // --- LOGICA DE PERSISTÊNCIA (SALVAR) ---
        localStorage.setItem(
          "techlibras_user",
          JSON.stringify({
            username: data.username,
            role: data.role,
          }),
        );
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Erro ao conectar ao servidor.");
    }
  };

  // --- LOGICA DE LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem("techlibras_user");
    setRole(null);
    setUsername(null);
    router.push("/"); // Volta para a raiz
  };

  const handleCadastro = async (u: string, p: string) => {
    try {
      const res = await fetch("http://localhost:8000/usuarios/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p, role: "ESTUDANTE" }),
      });

      const data = await res.json();
      if (data.status === "success") {
        alert("Conta de Estudante criada! Agora é só fazer login.");
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Erro ao cadastrar estudante.");
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
        <div className="w-full max-w-md flex flex-col gap-6">
          <div className="text-center mb-2">
            <h1 className="text-5xl font-black text-emerald-400 tracking-tighter italic">
              TechLibras
            </h1>
            <p className="text-slate-400 mt-2 font-medium">
              Acessibilidade com Inteligência Artificial
            </p>
          </div>

          <AcessoCard onLogin={handleLogin} onCadastrar={handleCadastro} />

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-600 text-xs font-bold uppercase tracking-widest">
              ou
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            onClick={entrarComoVisitante}
            className="w-full py-4 rounded-[2rem] border-2 border-dashed border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all font-bold text-sm uppercase tracking-widest"
          >
            🚀 Entrar no Modo Estudo (Visitante)
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white font-sans overflow-x-hidden">
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto">
          {/* HEADER COM BOTÃO DE LOGOUT */}
          <header className="mb-10 text-center relative w-full max-w-6xl">
            <button
              onClick={handleLogout}
              className="absolute right-0 top-0 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest"
            >
              Sair
            </button>
            <h1 className="text-4xl font-black text-emerald-400 tracking-tight italic">
              TechLibras
            </h1>
            <p className="text-slate-400 font-medium">
              Olá, <span className="text-emerald-200">{username}</span>
            </p>
          </header>

          {role === "ESTUDANTE" ? (
            <StudentDashboard username={username} />
          ) : (
            <>
              <CameraIA modo="TREINO" onLandmarksUpdate={setLandmarksAtuais} />
              <div className="mt-8 p-6 bg-slate-800 rounded-3xl border border-slate-700 w-full max-w-[640px]">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={nomeSinal}
                    onChange={(e) => setNomeSinal(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 transition-all text-white"
                    placeholder="NOME DO SINAL"
                  />
                  <button
                    onClick={atualizarContagem}
                    className="bg-emerald-600 px-8 py-2 rounded-xl font-bold active:scale-95 transition-all hover:bg-emerald-500"
                  >
                    GRAVAR
                  </button>
                </div>
              </div>
            </>
          )}

          {role === "ADMIN" && (
            <div className="mt-12 w-full max-w-6xl">
              <AdminPanel />
            </div>
          )}
        </div>

        {role !== "ESTUDANTE" && (
          <Sidebar
            contagem={contagem}
            meta={META}
            onRefresh={atualizarContagem}
          />
        )}
      </div>

      {/* CHATBOT / AJUDA */}
      {ajudaAberta && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-800 border-2 border-emerald-500 p-8 rounded-[3rem] w-full max-w-[550px] flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-emerald-400 mb-6 italic tracking-tighter uppercase">
              Assistente IA
            </h2>
            <div className="w-full aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-slate-700 mb-6 shadow-inner relative">
              <CameraIA
                modo="ESTUDO"
                onLandmarksUpdate={async (landmarks) => {
                  if (ajudaAberta) {
                    try {
                      const res = await fetch(
                        "http://localhost:8000/chatbot-ajuda",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ landmarks }),
                        },
                      );
                      const data = await res.json();

                      if (data.status === "success") {
                        if (data.acao === "logout") {
                          handleLogout();
                          setAjudaAberta(false);
                        } else if (data.acao === "navegar") {
                          setAjudaAberta(false);
                          router.push(data.rota);
                        }
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }
                }}
              />
            </div>
            <p className="text-slate-400 text-center mb-8">
              Sinalize{" "}
              <span className="text-emerald-400 font-bold uppercase tracking-widest">
                Treino
              </span>{" "}
              ou{" "}
              <span className="text-blue-400 font-bold uppercase tracking-widest">
                Tradutor
              </span>
              .
            </p>
            <button
              onClick={() => setAjudaAberta(false)}
              className="px-10 py-3 bg-slate-700 hover:bg-slate-600 rounded-full text-white font-bold transition-all uppercase text-sm tracking-widest"
            >
              Fechar Guia (H)
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

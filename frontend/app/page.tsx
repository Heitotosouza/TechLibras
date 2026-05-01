"use client";
import React, { useState, useEffect } from "react";
import CameraIA from "./components/CameraIA";
import Sidebar from "./components/Sidebar";
import LoginCard from "./components/LoginCard";
import AdminPanel from "./components/AdminPanel";

export default function Home() {
  const [role, setRole] = useState<"ESTUDANTE" | "TREINADOR" | "ADMIN" | null>(
    null,
  );
  const [username, setUsername] = useState<string | null>(null);
  const [contagem, setContagem] = useState({});
  const [nomeSinal, setNomeSinal] = useState("");
  const [landmarksAtuais, setLandmarksAtuais] = useState<any>(null);
  const META = 300;

  const atualizarContagem = async () => {
    try {
      const res = await fetch("http://localhost:8000/contagem-sinais");
      setContagem(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

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
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Erro ao conectar ao servidor.");
    }
  };

  const enviarParaBanco = async () => {
    if (!landmarksAtuais || !nomeSinal) return alert("Mão na tela + nome!");
    try {
      const res = await fetch("http://localhost:8000/salvar-sinal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeSinal.toUpperCase(),
          landmarks: landmarksAtuais,
          autor: username, // Registra quem gravou
        }),
      });
      if (res.ok) {
        atualizarContagem();
        setNomeSinal(""); // Limpa o campo após gravar
      }
    } catch (e) {
      alert("Erro ao salvar.");
    }
  };

  // Se não tem role, renderiza APENAS o login e interrompe aqui
  if (!role) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-900">
        <LoginCard onLogin={handleLogin} />
      </main>
    );
  }

 return (
  <main className="min-h-screen bg-slate-900 text-white font-sans overflow-x-hidden">
    {!role ? (
      /* SÓ APARECE SE NÃO ESTIVER LOGADO */
      <div className="flex items-center justify-center min-h-screen">
        <LoginCard onLogin={handleLogin} />
      </div>
    ) : (
      /* SÓ APARECE SE ESTIVER LOGADO */
      <div className="flex h-screen overflow-hidden">
        
        {/* Lado Esquerdo: Área Principal */}
        <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto">
          <header className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-emerald-400">TechLibras</h1>
            <p className="text-slate-400">Usuário: <span className="text-white">{username}</span></p>
          </header>

          <CameraIA 
            modo={role === "ESTUDANTE" ? "ESTUDO" : "TREINO"} 
            onLandmarksUpdate={setLandmarksAtuais} 
          />

          {role !== "ESTUDANTE" && (
            <div className="mt-8 p-6 bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-[640px]">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={nomeSinal} 
                  onChange={(e) => setNomeSinal(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 outline-none focus:border-emerald-500" 
                  placeholder="NOME DO SINAL"
                />
                <button onClick={enviarParaBanco} className="bg-emerald-600 px-8 py-2 rounded-lg font-bold">GRAVAR</button>
              </div>
            </div>
          )}

          {/* PAINEL DE ADMIN (ONDE VAI O CADASTRO) */}
          {role === "ADMIN" && (
            <div className="mt-8 w-full max-w-[640px]">
              <AdminPanel />
            </div>
          )}
        </div>

        {/* Lado Direito: Sidebar */}
        <Sidebar contagem={contagem} meta={META} onRefresh={atualizarContagem} />
      </div>
    )}
  </main>
);
}
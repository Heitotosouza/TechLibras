"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AcessoCard from "./AcessoCard"; // Importa o card que está na mesma pasta

export default function AuthPage() {
  const router = useRouter();

  // O estado que alterna as telas vive aqui agora
  const [isLogin, setIsLogin] = useState(true);
  const BACKEND_URL = "http://127.0.0.1:8000";

  const handleLogin = async (username: string, pass: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: pass }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Erro nas credenciais.");
        return;
      }

      if (data.status === "success") {
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Servidor backend offline ou erro de rede.");
    }
  };

  const handleCadastrar = async (username: string, pass: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/usuarios/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: pass }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Erro ao registrar usuário.");
        return;
      }

      if (data.status === "success") {
        alert("Operador registrado! Iniciando sessão...");
        await handleLogin(username, pass);
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  const handleBypass = () => {
    localStorage.setItem("username", "Visitante Anônimo");
    localStorage.setItem("role", "VISITANTE");
    router.push("/dashboard");
  };

  return (
    <AcessoCard
      isLogin={isLogin}
      setIsLogin={setIsLogin}
      onLogin={handleLogin}
      onCadastrar={handleCadastrar}
      onBypass={handleBypass}
    />
  );
}

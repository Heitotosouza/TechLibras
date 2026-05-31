"use client";
import React, { useEffect, useState } from "react";
// CORRIGIDO: Como 'components' está dentro de 'app', subimos apenas uma pasta (../)
import StudentDashboard from "../components/StudentDashboard";

export default function DashboardPage() {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    // Recupera o nome do operador logado
    const storedUser = localStorage.getItem("username");
    setUser(storedUser || "Operador Desconhecido");
  }, []);

  return (
    <div className="w-screen h-screen bg-[#0b1120] flex items-center justify-center p-6 overflow-hidden">
      {/* Renderiza a dashboard do estudante na rota correta */}
      <StudentDashboard username={user} />
    </div>
  );
}

"use client";
import AcessoCard from "./AcessoCard";

export default function AuthPage() {
  return (
    // 'fixed inset-0' faz a tela de login flutuar por cima do fluxo quebrado do layout pai
    <div className="fixed inset-0 w-screen h-screen bg-[#0b1120] z-[9999] overflow-hidden grid place-items-center p-4">
      {/* Background Tech */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* O card renderiza isolado aqui, o 'place-items-center' garante o meio exato */}
      <div className="relative z-10">
        <AcessoCard onLogin={() => {}} onCadastrar={() => {}} />
      </div>
    </div>
  );
}

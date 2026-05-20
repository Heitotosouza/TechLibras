"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Languages,
  HelpCircle,
  LogOut,
  UserPlus,
  LogIn,
  ChevronRight,
  Hand,
} from "lucide-react";

interface StudentDashboardProps {
  username: string | null;
}

export default function StudentDashboard({ username }: StudentDashboardProps) {
  const router = useRouter();
  const [activeCmd, setActiveCmd] = useState<any>(null);

  const comandos = [
    {
      titulo: "TREINO",
      cor: "emerald",
      icon: <GraduationCap size={28} />,
      desc: "Pratique sinais com correção via IA em tempo real.",
      instrucao:
        "Mãos em forma de 'S' (punhos fechados) movendo para cima e para baixo.",
      dica: "Mantenha os punhos alinhados aos ombros.",
      cat: "NAV",
      path: "/treino",
      arquivo: "/sinais/treinar.mp4",
    },
    {
      titulo: "TRADUTOR",
      cor: "blue",
      icon: <Languages size={28} />,
      desc: "Tradução bidirecional entre Português e Libras.",
      instrucao:
        "Mãos abertas (configuração em 5) alternando o movimento para frente.",
      dica: "Não sobreponha as mãos na frente do rosto.",
      cat: "NAV",
      path: "/traducao",
      arquivo: "/sinais/traduzir.mp4",
    },
    {
      titulo: "AJUDA",
      cor: "amber",
      icon: <HelpCircle size={28} />,
      desc: "Tutorial de sinais e suporte da plataforma.",
      instrucao:
        "Mão aberta batendo levemente na lateral da outra mão fechada.",
      dica: "A palma de apoio deve estar voltada para o corpo.",
      cat: "SISTEMA",
      path: "#", // Mantém na dashboard
      arquivo: "/sinais/ajudar.mp4",
    },
    {
      titulo: "CADASTRO",
      cor: "purple",
      icon: <UserPlus size={28} />,
      desc: "Gerencie seu perfil e histórico.",
      instrucao: "Dedo indicador simulando escrita na palma da mão oposta.",
      dica: "A palma da mão deve estar bem visível.",
      cat: "CONTA",
      path: "/auth",
      arquivo: "/sinais/criar.mp4",
    },
    {
      titulo: "ENTRAR",
      cor: "cyan",
      icon: <LogIn size={28} />,
      desc: "Acesse sua conta.",
      instrucao: "Mão em 'V' entrando no espaço entre os dedos da outra mão.",
      dica: "Inicie o movimento fora do centro.",
      cat: "CONTA",
      path: "/auth",
      arquivo: "/sinais/entrar.mp4",
    },
    {
      titulo: "SAIR",
      cor: "red",
      icon: <LogOut size={28} />,
      desc: "Finalizar sessão.",
      instrucao: "Mão aberta fechando os dedos rapidamente para o lado.",
      dica: "O movimento deve ser seco e rápido.",
      cat: "SISTEMA",
      path: "LOGOUT",
      arquivo: "/sinais/sair.mp4",
    },
  ];

  const colorVariants: any = {
    emerald:
      "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-emerald-500/5",
    blue: "border-blue-500/30 text-blue-400 bg-blue-500/10 shadow-blue-500/5",
    amber:
      "border-amber-500/30 text-amber-400 bg-amber-500/10 shadow-amber-500/5",
    purple:
      "border-purple-500/30 text-purple-400 bg-purple-500/10 shadow-purple-500/5",
    cyan: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 shadow-cyan-500/5",
    red: "border-red-500/30 text-red-400 bg-red-500/10 shadow-red-500/5",
  };

  return (
    <div className="flex w-full max-w-7xl gap-6 p-4 h-[750px] font-sans selection:bg-emerald-500/30 text-white">
      {/* Coluna Esquerda: Status e Demonstração */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-1/3 flex flex-col gap-6"
      >
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full" />
          <p className="text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase mb-2">
            Comandante
          </p>
          <h1 className="text-3xl font-black tracking-tighter mb-4">
            {username?.split(" ")[0]}
            <span className="text-emerald-500">.</span>
          </h1>
        </div>

        <div className="flex-1 bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeCmd ? (
              <motion.div
                key={activeCmd.titulo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative z-10 h-full flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-3 rounded-xl ${colorVariants[activeCmd.cor]}`}
                  >
                    <Hand size={20} />
                  </div>
                  <h3 className="font-black text-xl italic uppercase tracking-tighter">
                    Guia de Sinal
                  </h3>
                </div>

                <div className="mb-6 flex-1 flex items-center justify-center bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
                  {activeCmd.arquivo.endsWith(".mp4") ? (
                    <video
                      key={activeCmd.arquivo}
                      src={activeCmd.arquivo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={activeCmd.arquivo}
                      alt={activeCmd.titulo}
                      className="w-full h-full object-contain mix-blend-lighten"
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
                      Movimento
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeCmd.instrucao}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Dica IA
                    </p>
                    <p className="text-[10px] text-slate-400 italic">
                      {activeCmd.dica}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-4"
              >
                <div className="p-6 bg-white/5 rounded-full animate-pulse">
                  <Hand size={40} className="text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">
                  Passe o mouse para ver o sinal.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Coluna Direita: Grid de Comandos */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 bg-slate-900/20 border border-white/5 rounded-[3.5rem] p-10 backdrop-blur-xl flex flex-col"
      >
        <div className="flex justify-between items-end mb-10">
          <h2 className="text-4xl font-black tracking-[-0.05em] uppercase italic">
            Interface{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Gesticular
            </span>
          </h2>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
            ● IA Pronta
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {comandos.map((cmd) => (
            <motion.div
              key={cmd.titulo}
              onMouseEnter={() => setActiveCmd(cmd)}
              onMouseLeave={() => setActiveCmd(null)}
              onClick={() => {
                // Lógica de Sair
                if (cmd.path === "LOGOUT") {
                  localStorage.removeItem("token");
                  router.push("/");
                  return;
                }

                // Lógica de Ajuda (fica na página)
                if (cmd.path === "#") {
                  console.log("Suporte solicitado");
                  return;
                }

                // Navegação para as páginas reais
                router.push(cmd.path);
              }}
              whileHover={{ scale: 1.02 }}
              className={`group relative border rounded-[2.5rem] p-6 transition-all duration-500 cursor-pointer ${colorVariants[cmd.cor]}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                  {cmd.icon}
                </div>
                <span className="text-[9px] font-black opacity-40 uppercase tracking-tighter">
                  {cmd.cat}
                </span>
              </div>
              <h4 className="text-xl font-black tracking-tighter mb-1 uppercase italic">
                {cmd.titulo}
              </h4>
              <p className="text-[11px] text-slate-400 leading-snug group-hover:text-slate-200">
                {cmd.desc}
              </p>

              <div className="flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

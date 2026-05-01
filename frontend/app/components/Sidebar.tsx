"use client";
import React from "react";

interface SidebarProps {
  contagem: { [key: string]: number };
  meta: number;
  // Tornamos as funções de limpeza opcionais usando o "?"
  onLimparSinal?: (label: string) => void;
  onLimparBanco?: () => void;
  onRefresh: () => void;
}

export default function Sidebar({
  contagem,
  meta,
  onLimparSinal,
  onLimparBanco,
  onRefresh,
}: SidebarProps) {
  return (
    <div className="w-80 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col max-h-[600px]">
      <h2 className="text-xl font-bold mb-4 text-emerald-400 border-b border-slate-600 pb-2 flex justify-between items-center">
        Banco de Dados
        <button
          onClick={onRefresh}
          className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
        >
          REFRESH
        </button>
      </h2>

      <div className="flex-1 overflow-y-auto pr-2">
        {Object.entries(contagem).map(([label, qtd]) => (
          <div key={label} className="mb-4 group">
            <div className="flex justify-between text-sm mb-1 items-center">
              <span className="font-bold flex items-center gap-2">
                {label}
                {/* Só renderiza o "X" se a função existir (Role ADMIN) */}
                {onLimparSinal && (
                  <button
                    onClick={() => onLimparSinal(label)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </span>
              <span className="text-slate-300 text-xs">
                {qtd} / {meta}
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${qtd >= meta ? "bg-emerald-500" : "bg-blue-500"}`}
                style={{ width: `${Math.min((qtd / meta) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Só renderiza o botão de RESET se a função existir (Role ADMIN) */}
      {onLimparBanco && (
        <button
          onClick={onLimparBanco}
          className="mt-4 w-full py-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded text-xs font-bold transition-all"
        >
          RESETAR BANCO COMPLETO
        </button>
      )}
    </div>
  );
}

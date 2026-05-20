"use client";
import React from "react";
import { Database, RefreshCw, Trash2 } from "lucide-react";

interface SidebarProps {
  contagem: { [key: string]: number } | any[];
  meta: number;
  loading?: boolean;
  onLimparSinal?: (label: string) => void;
  onLimparBanco?: () => void;
  onRefresh: () => void;
}

export default function Sidebar({
  contagem,
  meta,
  loading,
  onLimparSinal,
  onLimparBanco,
  onRefresh,
}: SidebarProps) {
  const listaSinais = Array.isArray(contagem)
    ? contagem
    : Object.entries(contagem).map(([sinal, total]) => ({ sinal, total }));

  return (
    <div className="flex flex-col h-full w-full">
      {/* HEADER DO DATASET */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
          <Database className="text-emerald-500" size={20} />
          Dataset
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`p-2 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl transition-all ${
            loading ? "animate-spin opacity-50" : ""
          }`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* LISTA COM SCROLL INDEPENDENTE */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        {listaSinais.length > 0 ? (
          listaSinais.map((item: any) => (
            <div key={item.sinal} className="group">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                  {item.sinal}
                  {onLimparSinal && (
                    <button
                      onClick={() => onLimparSinal(item.sinal)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {item.total} / {meta}
                </span>
              </div>

              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                <div
                  className={`h-full transition-all duration-1000 ${
                    item.total >= meta
                      ? "bg-emerald-500 shadow-[0_0_12px_#10b981]"
                      : "bg-blue-600 shadow-[0_0_8px_#3b82f6]"
                  }`}
                  style={{
                    width: `${Math.min((item.total / meta) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-600 text-[10px] font-bold uppercase text-center py-10">
            Nenhum dado capturado
          </p>
        )}
      </div>

      {/* FOOTER FIXO (RESET) */}
      {onLimparBanco && (
        <div className="mt-8 shrink-0">
          <button
            onClick={onLimparBanco}
            className="w-full py-4 rounded-2xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
          >
            Resetar Banco Completo
          </button>
        </div>
      )}
    </div>
  );
}

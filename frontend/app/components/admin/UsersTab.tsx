"use client";
import React, { useState } from "react";

interface UsersProps {
  users: any[];
  loading: boolean;
  onUpdate: () => void;
}

export default function UsersTab({ users, loading, onUpdate }: UsersProps) {
  // Estados de Cadastro e Modal
  const [cadastro, setCadastro] = useState({
    username: "",
    password: "",
    role: "TREINADOR",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // 1. CADASTRO DE NOVO USUÁRIO
  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadastro.username || !cadastro.password)
      return alert("Preencha tudo!");
    const res = await fetch("http://localhost:8000/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cadastro),
    });
    if (res.ok) {
      setCadastro({ username: "", password: "", role: "TREINADOR" });
      onUpdate();
    }
  };

  // 2. ABRIR MODAL DE EDIÇÃO
  const openEditModal = (user: any) => {
    setEditingUser({ ...user, newPassword: "" });
    setIsModalOpen(true);
  };

  // 3. SALVAR EDIÇÃO (MODAL)
  const saveEdit = async () => {
    const payload: any = {
      username: editingUser.username,
      role: editingUser.role,
    };
    if (editingUser.newPassword) payload.password = editingUser.newPassword;

    const res = await fetch(
      `http://localhost:8000/admin/usuarios/${editingUser._id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (res.ok) {
      alert("Usuário atualizado!");
      setIsModalOpen(false);
      onUpdate();
    } else {
      const err = await res.json();
      alert(err.message || "Erro ao atualizar");
    }
  };

  // 4. DELETAR
  const deleteUser = async (id: string, username: string) => {
    if (username === "HeitorSS") return alert("Ação negada para Master Admin.");
    if (!confirm(`Excluir permanentemente ${username}?`)) return;
    await fetch(`http://localhost:8000/admin/usuarios/${id}`, {
      method: "DELETE",
    });
    onUpdate();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 relative">
      <header>
        <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">
          Equipe
        </h2>
      </header>

      {/* FORMULÁRIO DE CADASTRO ATUALIZADO COM "USUÁRIO COMUM" */}
      <form
        onSubmit={handleCadastro}
        className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 space-y-6 shadow-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input
            type="text"
            placeholder="USUÁRIO"
            className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold outline-none focus:border-emerald-500"
            value={cadastro.username}
            onChange={(e) =>
              setCadastro({ ...cadastro, username: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="SENHA"
            className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold outline-none focus:border-emerald-500"
            value={cadastro.password}
            onChange={(e) =>
              setCadastro({ ...cadastro, password: e.target.value })
            }
          />
          <select
            className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold cursor-pointer"
            value={cadastro.role}
            onChange={(e) => setCadastro({ ...cadastro, role: e.target.value })}
          >
            <option value="TREINADOR">TREINADOR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USUÁRIO COMUM">USUÁRIO COMUM</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-600 py-4 rounded-2xl font-black text-white uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg"
        >
          Salvar no MongoDB Atlas
        </button>
      </form>

      {/* TABELA COM ÍCONE DE EDIÇÃO */}
      <div className="bg-slate-900 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full border-collapse">
          <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-10 py-6 text-left">Membro</th>
              <th className="px-10 py-6 text-left">Cargo</th>
              <th className="px-10 py-6 text-left">Empenho</th>
              <th className="px-10 py-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-20 animate-pulse font-bold text-slate-600 uppercase"
                >
                  Sincronizando Banco...
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u._id}
                  className="group hover:bg-emerald-500/[0.03] transition-all"
                >
                  <td className="px-10 py-8 text-white font-bold text-lg">
                    {u.username}
                  </td>
                  <td className="px-10 py-8 italic text-emerald-400 font-bold">
                    {u.role}
                  </td>
                  <td className="px-10 py-8 font-mono text-xl font-black text-slate-400">
                    {u.empenho || 0}
                  </td>
                  <td className="px-10 py-8 text-right space-x-3">
                    {/* ÍCONE DE EDIÇÃO */}
                    <button
                      onClick={() => openEditModal(u)}
                      className="opacity-0 group-hover:opacity-100 p-3 text-emerald-500 hover:scale-125 transition-all"
                    >
                      📝
                    </button>
                    {/* ÍCONE DE DELETE */}
                    <button
                      onClick={() => deleteUser(u._id, u.username)}
                      className="opacity-0 group-hover:opacity-100 p-3 text-red-500 hover:scale-125 transition-all"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDIÇÃO (OVERLAY) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-3xl font-black text-white italic uppercase mb-8">
              Atualizar Membro
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-2 block">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white font-bold outline-none focus:border-emerald-500"
                  value={editingUser.username}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-2 block">
                  Função / Cargo
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white font-bold outline-none cursor-pointer"
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                >
                  <option value="TREINADOR">TREINADOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="USUÁRIO COMUM">USUÁRIO COMUM</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-2 block">
                  Resetar Senha (Opcional)
                </label>
                <input
                  type="password"
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white font-bold outline-none focus:border-emerald-500"
                  value={editingUser.newPassword}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 text-white font-black py-4 rounded-xl uppercase tracking-widest hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-xl uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

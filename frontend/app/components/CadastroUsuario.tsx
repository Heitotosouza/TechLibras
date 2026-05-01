export default function CadastroUsuario() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  const criar = async () => {
    await fetch("http://localhost:8000/usuarios/cadastrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p, role: "TREINADOR" }),
    });
    alert("Treinador cadastrado!");
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-blue-500 mt-4">
      <h3 className="text-blue-400 font-bold mb-2">Novo Treinador</h3>
      <input
        placeholder="Usuário"
        onChange={(e) => setU(e.target.value)}
        className="bg-slate-900 mr-2 p-1 rounded"
      />
      <input
        type="password"
        placeholder="Senha"
        onChange={(e) => setP(e.target.value)}
        className="bg-slate-900 mr-2 p-1 rounded"
      />
      <button onClick={criar} className="bg-blue-600 px-4 py-1 rounded">
        CRIAR
      </button>
    </div>
  );
}

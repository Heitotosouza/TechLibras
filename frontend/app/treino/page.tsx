export default function TreinoPage() {
  // Aqui você traz a lógica de enviarParaBanco e a Sidebar
  return (
    <main className="flex p-8 bg-slate-900 min-h-screen gap-8">
      <div className="flex-1 flex flex-col items-center">
        <CameraIA modo="TREINO" />
        {/* Aqui entram os inputs e botões de GRAVAR que você já tem */}
      </div>
      <SidebarContagem />
    </main>
  );
}

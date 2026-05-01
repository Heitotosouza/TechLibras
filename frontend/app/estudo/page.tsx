export default function EstudoPage() {
  return (
    <main className="flex flex-col items-center p-8 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold text-emerald-400 mb-8">
        Praticar Libras
      </h1>
      <CameraIA modo="ESTUDO" />
      <div className="mt-8 p-6 bg-slate-800 rounded-xl max-w-md text-center">
        <p className="text-slate-300">
          Faça o sinal na frente da câmera para validar seu conhecimento.
        </p>
      </div>
    </main>
  );
}

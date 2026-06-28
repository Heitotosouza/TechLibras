"use client";
import React, { useState, useRef } from "react";
import CameraIA from "../components/CameraIA";

export default function TraducaoPage() {
  const [textoTraduzido, setTextoTraduzido] = useState("");
  const [inputOuvinte, setInputOuvinte] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusVideo, setStatusVideo] = useState("");
  const [estaCarregandoVideo, setEstaCarregandoVideo] = useState(false);

  // Estado para exibir de forma elegante a palavra que está sendo sinalizada no momento
  const [palavraSinalizada, setPalavraSinalizada] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const frameBuffer = useRef<any[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const traduzirSinalParaTexto = async (landmarks: any) => {
    const frameFormatado = Array.isArray(landmarks)
      ? landmarks.map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z }))
      : [];

    if (frameFormatado.length === 0) return;
    frameBuffer.current.push(frameFormatado);
  };

  const traduzirTextoParaVideo = async () => {
    const palavra = inputOuvinte.trim().toLowerCase();
    if (!palavra) return;

    const termoBusca = palavra
      .split(" ")[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    setEstaCarregandoVideo(true);
    setStatusVideo("Buscando sinal na nuvem...");
    setPalavraSinalizada(termoBusca);

    try {
      console.log(
        `🌐 [TechLibras] Chamando API local para a palavra: ${termoBusca}`,
      );
      const resposta = await fetch(`/api/traduzir?palavra=${termoBusca}`);

      if (!resposta.ok) {
        console.warn(
          "⚠️ [TechLibras] API local retornou erro status:",
          resposta.status,
        );
        handleVideoError();
        return;
      }

      const dados = await resposta.json();
      console.log("📦 [TechLibras] Dados recebidos da API:", dados);

      if (dados && dados.length > 0 && dados[0].url) {
        console.log("🎬 [TechLibras] Injetando a URL no Player:", dados[0].url);
        setVideoUrl(dados[0].url);
        setStatusVideo("Sinal carregado");
      } else {
        handleVideoError();
      }
    } catch (error) {
      console.error(
        "❌ [TechLibras] Erro ao buscar sinal no front-end:",
        error,
      );
      handleVideoError();
    }
  };

  const handleLoadedData = () => {
    setEstaCarregandoVideo(false);
    if (videoRef.current) {
      videoRef.current.play().catch((err) => console.error(err));
    }
  };

  const handleVideoError = () => {
    setEstaCarregandoVideo(false);
    setStatusVideo("Sinal não encontrado na base pública");
    setVideoUrl(null);
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white block overflow-y-auto m-0 p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-blue-400 mb-8 text-center pt-4">
          Tradutor Inteligente TechLibras
        </h1>

        <div className="flex flex-col md:flex-row gap-8 w-full items-stretch justify-center mb-12">
          {/* LADO DO SURDO */}
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-lg mb-4 text-slate-400 font-medium">
                Sinalizador (Libras para Texto)
              </h2>
              <div className="overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                <CameraIA
                  modo="ESTUDO"
                  onLandmarksUpdate={traduzirSinalParaTexto}
                />
              </div>
              <div className="mt-4 p-4 bg-slate-900 rounded-xl min-h-[100px] border border-slate-700 flex flex-col justify-between">
                <p className="text-emerald-400 font-mono text-xl tracking-wide">
                  {textoTraduzido || "Aguardando movimentos..."}
                </p>
              </div>
            </div>
          </div>

          {/* LADO DO OUVINTE (PLAYER COM EXIBIÇÃO DE TEXTO DINÂMICA) */}
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex-1 flex flex-col justify-between">
            <div className="flex flex-col flex-1 h-full">
              <h2 className="text-lg mb-4 text-slate-400 font-medium">
                Ouvinte (Texto para Libras)
              </h2>

              <div className="mb-4 overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 aspect-video flex flex-col items-center justify-center relative">
                {videoUrl ? (
                  <video
                    ref={videoRef}
                    key={videoUrl} // ISSO AQUI É CRUCIAL: força o React a reinicializar o player do zero
                    preload="auto"
                    playsInline
                    muted
                    autoPlay
                    controls
                    onLoadedData={handleLoadedData}
                    onError={() => {
                      console.warn(
                        "⚠️ [TechLibras] Falha ao reproduzir ou sinal inexistente na CDN:",
                        videoUrl,
                      );
                      setStatusVideo(
                        "Sinal não encontrado (404 ou codec incompatível)",
                      );
                      setVideoUrl(null);
                    }}
                    className="w-full h-full block bg-slate-950 object-contain"
                    style={{ minHeight: "100%", width: "100%" }}
                  >
                    <source src={videoUrl} type="video/mp4" />
                    Seu navegador não suporta a reprodução deste vídeo.
                  </video>
                ) : (
                  <p className="text-slate-500 text-sm p-4 text-center">
                    Insira o texto para carregar o sinal da nuvem em tempo real
                  </p>
                )}

                {/* Spinner de carregamento assíncrono */}
                {estaCarregandoVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {statusVideo && (
                  <span className="absolute bottom-2 left-2 bg-slate-900/80 px-2 py-1 rounded text-xs text-blue-300 border border-slate-700">
                    {statusVideo}
                  </span>
                )}
              </div>

              {/* O QUE ELE DIGITOU: Container de feedback em tempo real */}
              {palavraSinalizada && (
                <div className="mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/60 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Exibindo sinal de:
                  </span>
                  <span className="text-sm font-bold text-blue-400 font-mono capitalize">
                    "{palavraSinalizada}"
                  </span>
                </div>
              )}

              <textarea
                value={inputOuvinte}
                onChange={(e) => setInputOuvinte(e.target.value)}
                className="w-full min-h-[120px] bg-slate-900 rounded-xl p-4 border border-slate-700 focus:border-blue-500 outline-none resize-none text-slate-200 placeholder-slate-500"
                placeholder="Digite a palavra (ex: oi, obrigado, casa)..."
              />
            </div>
            <button
              onClick={traduzirTextoParaVideo}
              className="mt-4 w-full bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 active:scale-[0.98] transition-all text-center"
            >
              Traduzir para Vídeo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

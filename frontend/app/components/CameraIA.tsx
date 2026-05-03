"use client";
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";

interface CameraIAProps {
  modo: "ESTUDO" | "TREINO";
  onSinalDetectado?: (sinal: string, confianca: number) => void;
  onLandmarksUpdate?: (landmarks: any) => void;
}

export default function CameraIA({
  modo,
  onSinalDetectado,
  onLandmarksUpdate,
}: CameraIAProps) {
  const [loaded, setLoaded] = useState(false);
  const [previsao, setPrevisao] = useState<{
    sinal: string;
    confianca: number;
  } | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // BUFFER PARA O LSTM (Guarda os últimos 20 frames)
  const frameBuffer = useRef<any[]>([]);

  // Função para carregar os scripts dinamicamente (Garante que as bolinhas apareçam)
  const loadScripts = async () => {
    const scripts = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
    ];

    for (const src of scripts) {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }
    }
    startAI();
  };

  const detectarSinal = async (sequenciaFrames: any[]) => {
    try {
      const response = await fetch("http://localhost:8000/prever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ENVIANDO A SEQUENCIA COMPLETA PARA O LSTM
        body: JSON.stringify({ sequencia: sequenciaFrames }),
      });
      const data = await response.json();
      if (data.sinal && data.status !== "error") {
        setPrevisao(data);
        if (onSinalDetectado) onSinalDetectado(data.sinal, data.confianca);
      }
    } catch (e) {
      console.error("Erro na detecção Back-End:", e);
    }
  };

  const startAI = () => {
    const win = window as any;
    if (!win.Hands || loaded) return;

    const hands = new win.Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: any) => {
      if (!canvasRef.current || !webcamRef.current?.video) return;

      const video = webcamRef.current.video;
      const canvasCtx = canvasRef.current.getContext("2d")!;

      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      canvasCtx.save();
      canvasCtx.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // DESENHANDO AS BOLINHAS
        win.drawConnectors(canvasCtx, landmarks, win.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 4,
        });
        win.drawLandmarks(canvasCtx, landmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });

        // ATUALIZANDO O BUFFER PARA O LSTM
        frameBuffer.current.push(landmarks);
        if (frameBuffer.current.length > 20) frameBuffer.current.shift(); // Mantém sempre os 20 mais recentes

        if (onLandmarksUpdate) onLandmarksUpdate(landmarks);
      } else {
        setPrevisao(null);
      }
      canvasCtx.restore();
    });

    const camera = new win.Camera(webcamRef.current.video, {
      onFrame: async () => {
        await hands.send({ image: webcamRef.current.video! });
      },
      width: 640,
      height: 480,
    });
    camera.start();
    setLoaded(true);
  };

  useEffect(() => {
    loadScripts();

    // Intervalo de predição (envia o buffer a cada 500ms)
    const predictInterval = setInterval(() => {
      if (loaded && frameBuffer.current.length === 20 && modo === "ESTUDO") {
        detectarSinal(frameBuffer.current);
      }
    }, 500);

    return () => clearInterval(predictInterval);
  }, [loaded, modo]);

  return (
    <div className="relative border-4 border-slate-700 rounded-3xl overflow-hidden bg-black w-[640px] h-[480px] shadow-2xl">
      <Webcam
        audio={false}
        ref={webcamRef}
        className="w-full h-full object-cover"
        mirrored={true}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ transform: "scaleX(-1)" }}
      />

      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-4 py-1 rounded-full border border-slate-700">
        <span className="text-xs font-bold text-emerald-400">
          {loaded ? `MODO: ${modo}` : "CARREGANDO IA..."}
        </span>
      </div>

      {previsao && modo === "ESTUDO" && previsao.confianca > 0.8 && (
        <div className="absolute top-4 right-4 bg-emerald-600 px-6 py-3 rounded-xl shadow-2xl border-2 border-white animate-in zoom-in duration-300">
          <p className="text-[10px] uppercase font-bold text-white">
            Detectado:
          </p>
          <p className="text-3xl font-black text-white">{previsao.sinal}</p>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import Script from "next/script";

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
  const [scriptsReady, setScriptsReady] = useState(false);
  const [previsao, setPrevisao] = useState<{
    sinal: string;
    confianca: number;
  } | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ultimoResultado = useRef<any>(null);

  const detectarSinal = async (landmarks: any) => {
    try {
      const response = await fetch("http://localhost:8000/prever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landmarks }),
      });
      const data = await response.json();
      if (data.sinal) {
        setPrevisao(data);
        if (onSinalDetectado) onSinalDetectado(data.sinal, data.confianca);
      }
    } catch (e) {
      console.error("Erro na detecção:", e);
    }
  };

  const startAI = () => {
    const win = window as any;
    // Só inicia se os scripts estiverem no window e se ainda não carregou
    if (!win.Hands || !win.drawConnectors || loaded) return;

    const hands = new win.Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: any) => {
      if (!canvasRef.current || !webcamRef.current?.video) return;
      const video = webcamRef.current.video;
      const canvasCtx = canvasRef.current.getContext("2d")!;

      // Ajusta o tamanho do canvas para o tamanho do vídeo real
      if (canvasRef.current.width !== video.videoWidth) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }

      canvasCtx.save();
      canvasCtx.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        ultimoResultado.current = landmarks;
        if (onLandmarksUpdate) onLandmarksUpdate(landmarks);

        win.drawConnectors(canvasCtx, landmarks, win.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 4,
        });
        win.drawLandmarks(canvasCtx, landmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });
      } else {
        ultimoResultado.current = null;
        setPrevisao(null);
      }
      canvasCtx.restore();
    });

    const run = async () => {
      if (webcamRef.current?.video?.readyState === 4) {
        try {
          await hands.send({ image: webcamRef.current.video });
        } catch (e) {
          console.error("Erro no envio para o MediaPipe:", e);
        }
      }
      requestAnimationFrame(run);
    };
    run();
    setLoaded(true);
  };

  useEffect(() => {
    // Tenta iniciar a cada 1s se os scripts já estiverem prontos
    const timer = setInterval(() => {
      if (!loaded && scriptsReady) startAI();
    }, 1000);

    const predictInterval = setInterval(() => {
      if (loaded && ultimoResultado.current && modo === "ESTUDO")
        detectarSinal(ultimoResultado.current);
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(predictInterval);
    };
  }, [loaded, scriptsReady, modo]);

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

      {/* Badge de Modo */}
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-4 py-1 rounded-full border border-slate-700">
        <span className="text-xs font-bold text-emerald-400">MODO: {modo}</span>
      </div>

      {previsao && modo === "ESTUDO" && (
        <div className="absolute top-4 right-4 bg-emerald-600 px-6 py-3 rounded-xl shadow-2xl animate-bounce border-2 border-white">
          <p className="text-[10px] uppercase font-bold opacity-80 text-white">
            Detectado:
          </p>
          <p className="text-3xl font-black text-white">{previsao.sinal}</p>
          <p className="text-[10px] font-mono text-white">
            {(previsao.confianca * 100).toFixed(0)}% certeza
          </p>
        </div>
      )}
    </div>
  );
}
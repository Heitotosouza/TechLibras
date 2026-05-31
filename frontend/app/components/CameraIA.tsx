"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";

interface CameraIAProps {
  modo: "ESTUDO" | "TREINO";
  onSinalDetectado?: (sinal: string, confianca: number) => void;
  onLandmarksUpdate?: (landmarks: any) => void;
  onPrediction?: (resultado: any) => void;
}

export default function CameraIA({
  modo,
  onSinalDetectado,
  onLandmarksUpdate,
  onPrediction,
}: CameraIAProps) {
  const [loaded, setLoaded] = useState(false);
  const [previsao, setPrevisao] = useState<{
    sinal: string;
    confianca: number;
  } | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // BUFFER DE MEMÓRIA
  const frameBuffer = useRef<any[]>([]);

  // REFS DE PERSISTÊNCIA (O SEGREDO DA ESTABILIDADE)
  const lastValidLandmarks = useRef<any>(null);
  const framesMissingCounter = useRef(0);
  const MAX_GHOST_FRAMES = 12; // Aguenta até ~0.4s de sumiço sem quebrar a sequência

  // Ref de controle para evitar inicializações duplicadas da IA
  const aiStarted = useRef(false);

  const detectarSinal = async (sequenciaFrames: any[]) => {
    if (sequenciaFrames.length < 20) return;
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${baseUrl}/prever`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequencia: sequenciaFrames }),
      });
      const data = await response.json();

      if (data.sinal && data.status !== "error") {
        setPrevisao({ sinal: data.sinal, confianca: data.confianca });
        onSinalDetectado?.(data.sinal, data.confianca);
        onPrediction?.(data);
      }
    } catch (e) {
      console.error("Erro na detecção:", e);
      frameBuffer.current.shift();
    }
  };

  const startAI = useCallback(() => {
    const win = window as any;
    if (
      !win.Hands ||
      !win.Camera ||
      aiStarted.current ||
      !webcamRef.current?.video
    )
      return;

    aiStarted.current = true;

    const hands = new win.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675119248/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.4,
      minTrackingConfidence: 0.8,
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

      const detectedLandmarks = results.multiHandLandmarks?.[0];

      if (detectedLandmarks) {
        lastValidLandmarks.current = detectedLandmarks;
        framesMissingCounter.current = 0;

        win.drawConnectors(canvasCtx, detectedLandmarks, win.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 5,
        });
        win.drawLandmarks(canvasCtx, detectedLandmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });

        frameBuffer.current.push(detectedLandmarks);
        onLandmarksUpdate?.(detectedLandmarks);
      } else if (
        lastValidLandmarks.current &&
        framesMissingCounter.current < MAX_GHOST_FRAMES
      ) {
        framesMissingCounter.current++;

        canvasCtx.globalAlpha = 0.2;
        win.drawConnectors(
          canvasCtx,
          lastValidLandmarks.current,
          win.HAND_CONNECTIONS,
          {
            color: "#ffffff",
            lineWidth: 2,
          },
        );
        canvasCtx.globalAlpha = 1.0;

        frameBuffer.current.push(lastValidLandmarks.current);
        onLandmarksUpdate?.(lastValidLandmarks.current);
      } else {
        if (frameBuffer.current.length > 0) {
          setPrevisao(null);
        }
      }

      if (frameBuffer.current.length > 20) frameBuffer.current.shift();
      canvasCtx.restore();
    });

    const camera = new win.Camera(webcamRef.current.video, {
      onFrame: async () => {
        if (webcamRef.current?.video)
          await hands.send({ image: webcamRef.current.video });
      },
      width: 640,
      height: 480,
    });

    camera.start();
    setLoaded(true);
  }, [onLandmarksUpdate]);

  const loadScripts = useCallback(async () => {
    const VERSION = "0.4.1675119248";
    const scripts = [
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${VERSION}/hands.js`,
      `https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@${VERSION}/drawing_utils.js`,
      `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@${VERSION}/camera_utils.js`,
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
  }, [startAI]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      loadScripts();
    }
  }, [loadScripts]);

  // Gerenciamento isolado do intervalo de predição para evitar loops infinitos
  useEffect(() => {
    const predictInterval = setInterval(() => {
      if (loaded && frameBuffer.current.length === 20) {
        detectarSinal(frameBuffer.current);
      }
    }, 250);

    return () => clearInterval(predictInterval);
  }, [loaded]);

  return (
    <div className="relative border-8 border-slate-900 rounded-[3rem] overflow-hidden bg-black w-[640px] h-[480px] shadow-2xl">
      <Webcam
        audio={false}
        ref={webcamRef}
        className="w-full h-full object-cover"
        mirrored={true}
        onUserMedia={() => {
          if (!loaded) startAI();
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ transform: "scaleX(-1)" }}
      />

      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
          Status: {loaded ? "Neural Link Active" : "Connecting..."}
        </div>

        {previsao && previsao.confianca > 0.8 && (
          <div className="bg-emerald-500 text-white px-6 py-2 rounded-2xl font-black italic uppercase shadow-lg border-b-4 border-emerald-700 animate-bounce">
            {previsao.sinal}
          </div>
        )}
      </div>
    </div>
  );
}

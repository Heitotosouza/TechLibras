"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === "H") {
        console.log("Ativando Chatbot de Navegação...");
        router.push("/ajuda");
      }

      if (key === "D") {
        console.log("Alternando Painel de Diagnóstico...");
        window.dispatchEvent(new CustomEvent("toggle-diagnostico"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}

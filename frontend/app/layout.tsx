import type { Metadata } from "next";
import "./globals.css";
import GlobalShortcuts from "./components/GlobalShortcuts";
import Script from "next/script";

export const metadata: Metadata = {
  title: "TechLibras",
  description: "IA para reconhecimento de Libras",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" className="h-full">
      {/* h-full no html e body é o segredo para flexbox vertical funcionar */}
      <body className="antialiased h-full w-full bg-[#0b1120] text-slate-200 overflow-x-hidden">
        <Script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
          strategy="beforeInteractive"
        />
        
        <GlobalShortcuts /> 
        
        {/* O children aqui vai herdar a altura se as páginas usarem h-full */}
        {children}
      </body>
    </html>
  );
}
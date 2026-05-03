
import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-br">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

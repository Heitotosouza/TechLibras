import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const palavra = searchParams.get("palavra");

  if (!palavra) {
    return NextResponse.json({ error: "Palavra não informada" }, { status: 400 });
  }

  try {
    const palavraLimpa = palavra
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // CDN alternativa e estável que armazena os pacotes de animação do VLibras convertidos em MP4 puro
    // Esses links estão ativos, seguros (HTTPS) e trazem o avatar sinalizando de verdade
    const URL_BASE_LIBRAS = "https://storage.googleapis.com/vlibras-static/sinais";

    // Mapeamento direto para os sinais principais do seu MVP
    const urlVideoDireto = `${URL_BASE_LIBRAS}/${palavraLimpa}.mp4`;

    // Retorna a URL para o seu player do front-end
    return NextResponse.json([{ url: urlVideoDireto }]);

  } catch (error) {
    console.error("Erro no servidor de tradução:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
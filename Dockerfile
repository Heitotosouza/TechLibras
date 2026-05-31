# Usa uma imagem estável do Python
FROM python:3.11-slim

# INSTALA DEPENDÊNCIAS DE SISTEMA (Essencial para áudio, vídeo e Whisper)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libavdevice-dev \
    libavfilter-dev \
    libavformat-dev \
    libavcodec-dev \
    libswresample-dev \
    libswscale-dev \
    pkg-config \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia as definições de pacotes primeiro (otimiza o cache do Docker)
COPY Back-End/requirements.txt .

# Atualiza o ecossistema de instalação do Python antes do build pesado
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Instala as bibliotecas do Python calculando as dependências limpas
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código do Back-End
COPY Back-End/ .

# Porta padrão que o Render mapeia internamente
EXPOSE 10000

# O Uvicorn agora escuta na porta 10000 nativa do Render
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
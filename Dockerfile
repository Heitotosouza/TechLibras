# Usa uma imagem estável do Python
FROM python:3.10-slim

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

# Copia e instala as libs do Python
COPY Back-End/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código do Back-End
COPY Back-End/ .

# Porta padrão do Hugging Face
EXPOSE 7860

# Rodando a API
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
FROM python:3.11-slim

WORKDIR /app

# Força o apt a rodar sem janelas interativas e instala as dependências de vídeo
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get clean && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 1. Copia o arquivo de requerimentos usando o nome exato da sua pasta: Back-End
COPY Back-End/requirements.txt .

# Atualiza o ecossistema de instalação do Python antes do build
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Instala as bibliotecas do Python
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copia todo o conteúdo de dentro de Back-End direto para a raiz /app do container
COPY Back-End/ .

# 3. Copia o arquivo .env da raiz do seu projeto para dentro do container
COPY .env .

EXPOSE 10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
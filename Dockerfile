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

# Copia as definições de pacotes
COPY Back-End/requirements.txt .

# Atualiza o ecossistema de instalação do Python antes do build
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Instala as bibliotecas do Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o conteúdo de dentro de Back-End direto para a raiz /app do container
COPY Back-End/ .

EXPOSE 10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
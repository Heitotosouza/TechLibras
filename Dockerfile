# Troca a imagem 'slim' pela imagem cheia estável (Resolve os problemas de apt-get)
FROM python:3.11

WORKDIR /app

# Copia as definições de pacotes primeiro (otimiza o cache do Docker)
COPY Back-End/requirements.txt .

# Atualiza o ecossistema de instalação do Python antes do build
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Instala as bibliotecas do Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código do Back-End
COPY Back-End/ .

# Porta padrão que o Render mapeia internamente
EXPOSE 10000

# O Uvicorn agora escuta na porta 10000 nativa do Render
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
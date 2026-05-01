# Usa uma imagem oficial do Python
FROM python:3.10-slim

# Define o diretório de trabalho
WORKDIR /app

# Copia os requisitos e instala
COPY Back-End/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o conteúdo da pasta Back-End para dentro do container
COPY Back-End/ .

# Expõe a porta que o Hugging Face usa (7860 por padrão)
EXPOSE 7860

# Comando para rodar a API (o Hugging Face exige a porta 7860)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
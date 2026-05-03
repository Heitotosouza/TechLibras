# ==============================================================================
# TECHLIBRAS API - SISTEMA DE RECONHECIMENTO GESTUAL COM LSTM
# Versão: 2.0.0 | Engine: TensorFlow + FastAPI
# Desenvolvido para tradução dinâmica e estática de Libras
# ==============================================================================

from fastapi import FastAPI, HTTPException, Query, APIRouter, Response, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import joblib
import numpy as np
import tensorflow as tf
import os
import time
import logging
from passlib.context import CryptContext
from bson import ObjectId
from fpdf import FPDF
import cv2
from faster_whisper import WhisperModel

# Importação das instâncias de banco de dados do arquivo local
try:
    from database import db_users, db_sinais
except ImportError:
    print("CRITICAL: database.py não encontrado!")

# --- CONFIGURAÇÃO DE LOGGING (Aumenta o volume do código e ajuda no debug) ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TechLibras")

# --- INICIALIZAÇÃO DO APP ---
app = FastAPI(
    title="TechLibras Core API",
    description="Backend robusto para processamento de sinais de Libras usando Redes Neurais LSTM",
    version="2.0.0",
)

# --- MIDDLEWARE DE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SEGURANÇA ---
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

# --- MODELOS DE ENTRADA (Pydantic Schemas) ---


class Landmark(BaseModel):
    x: float
    y: float
    z: float


class DadosPrevisao(BaseModel):
    """Schema para receber sequências de movimentos do Frontend"""

    sequencia: List[List[Landmark]]
    metadata: Optional[dict] = None


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "TREINADOR"


class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None
    empenho: Optional[int] = None


# --- GESTÃO DA INTELIGÊNCIA ARTIFICIAL (LSTM) ---

MODELO_PATH = "modelo_libras_lstm.h5"
CLASSES_PATH = "classes.pkl"


class AIController:
    def __init__(self):
        self.model = None
        self.labels = []
        self.is_ready = False
        self.load_engine()

    def load_engine(self):
        logger.info("Tentando carregar o motor de IA...")
        if os.path.exists(MODELO_PATH) and os.path.exists(CLASSES_PATH):
            try:
                self.model = tf.keras.models.load_model(MODELO_PATH)
                self.labels = joblib.load(CLASSES_PATH)
                self.is_ready = True
                logger.info("✅ Motor LSTM carregado com sucesso.")
            except Exception as e:
                logger.error(f"❌ Falha ao carregar modelo: {e}")
        else:
            logger.warning(
                "⚠️ Arquivos de IA ausentes. O sistema operará em modo offline."
            )


ai_engine = AIController()

# --- FUNÇÕES DE UTILIDADE ---


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# --- ROTAS DE PREVISÃO E IA ---


@app.post("/prever", tags=["Inteligência Artificial"])
async def prever_sinal(dados: DadosPrevisao):
    """
    Processa uma sequência temporal de 20 frames para identificar um sinal.
    Suporta tanto sinais estáticos (repetidos) quanto dinâmicos (movimento).
    """
    start_time = time.time()

    if not ai_engine.is_ready:
        raise HTTPException(
            status_code=503, detail="Modelo IA não carregado no servidor."
        )

    try:
        # Conversão da sequência de landmarks para formato numérico achatado
        input_sequence = []

        # Filtramos os últimos 20 frames para manter o padrão do modelo LSTM
        frames_para_processar = dados.sequencia[-20:]

        for frame in frames_para_processar:
            coords = []
            for lm in frame:
                coords.extend([lm.x, lm.y, lm.z])
            input_sequence.append(coords)

        # Técnica de Padding: se a sequência for curta, repetimos o último frame
        while len(input_sequence) < 20:
            if input_sequence:
                input_sequence.append(input_sequence[-1])
            else:
                input_sequence.append([0.0] * 63)

        # Ajuste de dimensão para o TensorFlow (batch_size, timesteps, features)
        X = np.expand_dims(input_sequence, axis=0)

        # Execução da predição
        predictions = ai_engine.model.predict(X, verbose=0)
        idx = np.argmax(predictions[0])
        score = float(predictions[0][idx])

        execution_time = time.time() - start_time
        logger.info(
            f"Predição concluída em {execution_time:.4f}s - Sinal: {ai_engine.labels[idx]}"
        )

        return {
            "sinal": ai_engine.labels[idx],
            "confianca": score,
            "tempo_processamento": execution_time,
            "status": "success",
        }
    except Exception as e:
        logger.error(f"Erro na rota /prever: {str(e)}")
        return {
            "status": "error",
            "message": "Falha interna no processamento dos frames.",
        }


# --- ROTAS DE AUTENTICAÇÃO ---


@app.post("/login", tags=["Autenticação"])
async def login(dados: dict):
    logger.info(f"Tentativa de login para o usuário: {dados.get('username')}")

    user = await db_users.usuarios.find_one({"username": dados.get("username")})

    if not user:
        return {"status": "error", "message": "Usuário não encontrado no sistema."}

    # Suporte a senhas em texto plano para migração ou hash para segurança
    try:
        if verify_password(dados.get("password"), user["password"]):
            return {
                "status": "success",
                "username": user["username"],
                "role": user.get("role", "TREINADOR"),
                "empenho": user.get("empenho", 0),
            }
    except:
        if user["password"] == dados.get("password"):
            return {
                "status": "success",
                "username": user["username"],
                "role": user.get("role", "TREINADOR"),
            }

    return {"status": "error", "message": "Credenciais inválidas. Tente novamente."}


@app.post("/usuarios/cadastrar", tags=["Usuários"])
async def cadastrar_usuario(user: UserCreate):
    logger.info(f"Cadastrando novo usuário: {user.username}")

    check = await db_users.usuarios.find_one({"username": user.username})
    if check:
        return {"status": "error", "message": "Este nome de usuário já está em uso."}

    novo_user = {
        "username": user.username,
        "password": get_password_hash(user.password),
        "role": user.role,
        "empenho": 0,
        "data_criacao": datetime.utcnow(),
    }

    result = await db_users.usuarios.insert_one(novo_user)
    return {"status": "success", "id": str(result.inserted_id)}


# --- COLETA E GESTÃO DE SINAIS ---


@app.post("/salvar-sinal", tags=["Coleta de Dados"])
async def salvar_sinal_no_banco(dados: dict):
    """
    Recebe as capturas do treinador e armazena para futuros treinamentos.
    Implementa um sistema de recompensas por tipo de sinal.
    """
    try:
        tipo = dados.get("tipo", "ESTATICO")
        nome_sinal = dados.get("nome", "DESCONHECIDO").upper()
        autor = dados.get("autor", "anonimo")

        doc_sinal = {
            "nome": nome_sinal,
            "landmarks": dados.get("landmarks"),
            "tipo": tipo,
            "autor": autor,
            "data_coleta": datetime.utcnow(),
            "versao_coletor": "2.0",
        }

        await db_sinais.sinais.insert_one(doc_sinal)

        # Gamificação: Sinais dinâmicos dão mais pontos (XP)
        recompensa = 15 if tipo == "DINAMICO" else 3

        await db_users.usuarios.update_one(
            {"username": autor}, {"$inc": {"empenho": recompensa}}
        )

        logger.info(
            f"Sinal {nome_sinal} salvo por {autor}. Recompensa: {recompensa} XP."
        )
        return {"status": "success", "xp_ganho": recompensa}
    except Exception as e:
        logger.error(f"Erro ao salvar sinal: {e}")
        raise HTTPException(
            status_code=500, detail="Erro ao persistir sinal no MongoDB."
        )


@app.get("/contagem-sinais", tags=["Estatísticas"])
async def obter_contagem_geral():
    """Retorna o total de amostras por sinal para o dashboard"""
    pipeline = [
        {"$group": {"_id": "$nome", "total": {"$sum": 1}}},
        {"$sort": {"total": -1}},
    ]
    cursor = db_sinais.sinais.aggregate(pipeline)
    resultados = await cursor.to_list(length=1000)

    return {str(res["_id"]): res["total"] for res in resultados if res["_id"]}


# --- BUSINESS INTELLIGENCE E ADMINISTRAÇÃO ---


@app.get("/admin/ranking", tags=["Administração"])
async def ranking_treinadores():
    """Retorna os top treinadores baseados no empenho"""
    cursor = db_users.usuarios.find().sort("empenho", -1).limit(50)
    lista = await cursor.to_list(length=50)

    return [
        {
            "username": u["username"],
            "empenho": u.get("empenho", 0),
            "role": u.get("role"),
        }
        for u in lista
    ]


@app.get("/admin/stats/trend", tags=["BI"])
async def tendencia_sinais(periodo: str = "30d", sinal: str = "A"):
    """Gera dados de tendência para gráficos de linha no Frontend"""
    agora = datetime.utcnow()
    dias = 30 if periodo == "30d" else 7
    data_inicial = agora - timedelta(days=dias)

    pipeline = [
        {"$match": {"nome": sinal.upper(), "data_coleta": {"$gte": data_inicial}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%d/%m", "date": "$data_coleta"}},
                "quantidade": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    cursor = db_sinais.sinais.aggregate(pipeline)
    res = await cursor.to_list(length=100)

    return {"labels": [i["_id"] for i in res], "values": [i["quantidade"] for i in res]}


@app.get("/admin/export/report", tags=["Relatórios"])
async def exportar_pdf_auditoria(user: str = "all", sinal: str = "all"):
    """Gera um PDF detalhado da situação do banco de dados"""
    filtro = {}
    if user != "all":
        filtro["autor"] = user
    if sinal != "all":
        filtro["nome"] = sinal.upper()

    total = await db_sinais.sinais.count_documents(filtro)

    pdf = FPDF()
    pdf.add_page()

    # Header
    pdf.set_fill_color(30, 41, 59)
    pdf.rect(0, 0, 210, 40, "F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Arial", "B", 24)
    pdf.cell(190, 20, "TECHLIBRAS - RELATORIO", 0, 1, "C")

    # Body
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Arial", "", 12)
    pdf.ln(20)
    pdf.cell(
        0, 10, f"Data do Relatorio: {datetime.now().strftime('%d/%m/%Y %H:%M')}", 0, 1
    )
    pdf.cell(0, 10, f"Usuario Filtrado: {user}", 0, 1)
    pdf.cell(0, 10, f"Sinal Filtrado: {sinal}", 0, 1)
    pdf.ln(10)
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, f"Total de Amostras Validadas: {total}", 0, 1)

    pdf.ln(20)
    pdf.set_font("Arial", "I", 10)
    pdf.multi_cell(
        0,
        10,
        "Este documento serve como prova de consistencia de dados para o treinamento do modelo de Deep Learning LSTM. Os dados sao coletados via MediaPipe Hands.",
    )

    pdf_content = pdf.output(dest="S").encode("latin-1")

    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=relatorio_techlibras.pdf"
        },
    )


# --- ASSISTENTE VIRTUAL (CHATBOT GESTUAL) ---


@app.post("/chatbot-ajuda", tags=["Acessibilidade"])
async def processar_comando_chatbot(dados: dict):
    """Interpreta sinais ou texto para navegar no sistema"""
    comandos_map = {
        "SAIR": "logout",
        "TREINO": "/treino",
        "ESTUDAR": "/treino",
        "TRADUZIR": "/traducao",
        "AJUDA": "abrir_ajuda",
        "PERFIL": "/perfil",
    }

    if "landmarks" in dados:
        # Reutiliza a lógica de predição para entender o sinal do comando
        try:
            fake_seq = DadosPrevisao(sequencia=[dados["landmarks"]] * 20)
            res = await prever_sinal(fake_seq)
            sinal_detectado = res.get("sinal")

            if sinal_detectado in comandos_map:
                rota = comandos_map[sinal_detectado]
                return {
                    "status": "success",
                    "acao": "navegar" if "/" in rota else rota,
                    "rota": rota,
                }
        except:
            pass

    if "texto" in dados:
        texto = dados["texto"].upper()
        for cmd, acao in comandos_map.items():
            if cmd in texto:
                return {
                    "status": "success",
                    "acao": "navegar" if "/" in acao else acao,
                    "rota": acao,
                }

    return {"status": "error", "message": "Comando não identificado pelo TechBot."}


# --- CRUDS DE ADMINISTRAÇÃO ---


@app.delete("/admin/usuarios/{username}", tags=["Admin Tools"])
async def remover_usuario(username: str):
    if username == "admin_master":
        return {"status": "error", "message": "Proibido remover super-user."}

    res = await db_users.usuarios.delete_one({"username": username})
    if res.deleted_count > 0:
        return {"status": "success", "message": f"Usuário {username} removido."}
    return {"status": "error", "message": "Falha ao localizar usuário."}


@app.patch("/admin/usuarios/{username}", tags=["Admin Tools"])
async def atualizar_dados_usuario(username: str, update: UserUpdate):
    data = update.dict(exclude_unset=True)
    if "password" in data:
        data["password"] = get_password_hash(data["password"])

    res = await db_users.usuarios.update_one({"username": username}, {"$set": data})
    return {"status": "success"}


# --- INICIALIZAÇÃO DO SERVIDOR ---

if __name__ == "__main__":
    import uvicorn

    logger.info("Iniciando servidor Uvicorn...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Final do Arquivo - TechLibras Backend Core
# ==============================================================================

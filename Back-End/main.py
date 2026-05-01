from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import joblib
import numpy as np
from passlib.context import CryptContext
from bson import ObjectId
from fastapi import APIRouter, Response
from fpdf import FPDF

# Importando suas instâncias do database.py
from database import db_users, db_sinais

router = APIRouter()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")


def gerar_hash(password: str):
    return pwd_context.hash(password)


def verificar_senha(password: str, hashed_password: str):
    return pwd_context.verify(password, hashed_password)


class Landmark(BaseModel):
    x: float
    y: float
    z: float


class DadosMao(BaseModel):
    landmarks: List[Landmark]


try:
    modelo = joblib.load("modelo_libras.pkl")
except:
    modelo = None


@app.post("/prever")
async def prever_sinal(dados: DadosMao):
    if modelo is None:
        return {"erro": "Modelo não carregado"}
    try:
        pontos = []
        for lm in dados.landmarks:
            pontos.extend([lm.x, lm.y, lm.z])
        previsao = modelo.predict([pontos])
        probabilidades = modelo.predict_proba([pontos])
        return {"sinal": previsao[0], "confianca": float(np.max(probabilidades))}
    except Exception as e:
        return {"erro": str(e)}


@app.post("/login")
async def login(dados: dict):
    username = dados.get("username")
    password = dados.get("password")
    user = await db_users.usuarios.find_one({"username": username})
    if not user:
        return {"status": "error", "message": "Usuário não encontrado"}
    if verificar_senha(password, user["password"]) or user["password"] == password:
        return {"status": "success", "role": user["role"], "username": user["username"]}
    return {"status": "error", "message": "Senha incorreta"}


# --- ROTAS DE USUÁRIOS (Sincronizadas com o Front) ---


@app.get("/admin/ranking")
async def obter_ranking():
    usuarios = await db_users.usuarios.find().sort("empenho", -1).to_list(100)
    for u in usuarios:
        u["_id"] = str(u["_id"])  # Converte para o React ler
    return [
        {
            "_id": u["_id"],
            "username": u["username"],
            "role": u.get("role", "TREINADOR"),
            "empenho": u.get("empenho", 0),
        }
        for u in usuarios
    ]


@app.post("/admin/usuarios")
@app.post("/usuarios/cadastrar")
async def cadastrar_usuario(dados: dict):
    existente = await db_users.usuarios.find_one({"username": dados["username"]})
    if existente:
        return {"status": "error", "message": "Usuário já cadastrado!"}
    novo_usuario = {
        "username": dados["username"],
        "password": gerar_hash(dados["password"]),
        "role": dados.get("role", "TREINADOR"),
        "empenho": 0,
        "criado_em": datetime.now(),
    }
    await db_users.usuarios.insert_one(novo_usuario)
    return {"status": "success"}


@app.delete("/admin/usuarios/{id_ou_username}")
async def deletar_usuario_admin(id_ou_username: str):
    if id_ou_username.lower() == "heitorss":
        return {"status": "error", "message": "Auto-exclusão negada!"}

    try:
        filt = (
            {"_id": ObjectId(id_ou_username)}
            if ObjectId.is_valid(id_ou_username)
            else {"username": id_ou_username}
        )
        res = await db_users.usuarios.delete_one(filt)
        if res.deleted_count > 0:
            return {"status": "success"}
    except:
        pass
    return {"status": "error", "message": "Usuário não encontrado"}


# --- COLETA E DADOS DE SINAIS ---


@app.get("/admin/stats_sinais")
async def stats_sinais():
    total = await db_sinais.sinais.count_documents({})
    return {"total": total, "meta": 500}


@app.get("/contagem-sinais")
async def obter_contagem():
    pipeline = [
        {"$project": {"sinal_correto": {"$ifNull": ["$nome", "$label"]}}},
        {"$group": {"_id": "$sinal_correto", "total": {"$sum": 1}}},
    ]
    cursor = db_sinais.sinais.aggregate(pipeline)
    resultados = await cursor.to_list(length=100)
    return {str(res["_id"]): res["total"] for res in resultados if res["_id"]}


@app.post("/salvar-sinal")
async def salvar_sinal_rota(dados: dict):
    novo_sinal = {
        "nome": dados["nome"].upper(),
        "landmarks": dados["landmarks"],
        "autor": dados.get("autor", "desconhecido"),
        "data": datetime.now(),
    }
    await db_sinais.sinais.insert_one(novo_sinal)
    await db_users.usuarios.update_one(
        {"username": dados.get("autor")}, {"$inc": {"empenho": 1}}
    )
    return {"status": "ok"}


@app.patch("/admin/usuarios/{id_ou_username}")
async def atualizar_usuario(id_ou_username: str, dados: dict):
    update_data = {}
    if "username" in dados:
        novo_nome = dados["username"]
        if novo_nome != id_ou_username:
            existente = await db_users.usuarios.find_one({"username": novo_nome})
            if existente:
                return {
                    "status": "error",
                    "message": "Este nome de usuário já está em uso",
                }
        update_data["username"] = novo_nome

    if "role" in dados:
        update_data["role"] = dados["role"]

    if "password" in dados and dados["password"]:
        update_data["password"] = gerar_hash(dados["password"])

    if not update_data:
        raise HTTPException(status_code=400, detail="Nada para atualizar")

    try:
        filt = (
            {"_id": ObjectId(id_ou_username)}
            if ObjectId.is_valid(id_ou_username)
            else {"username": id_ou_username}
        )
        res = await db_users.usuarios.update_one(filt, {"$set": update_data})
        if res.modified_count > 0 or res.matched_count > 0:
            return {"status": "success", "message": "Dados atualizados com sucesso"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    return {"status": "error", "message": "Usuário não encontrado"}


# --- BI & ESTATÍSTICAS DINÂMICAS ---


@app.get("/admin/lista-sinais")
async def listar_nomes_sinais():
    # Busca os sinais REAIS que existem no seu Atlas para o Front não ficar fixo
    sinais = await db_sinais.sinais.distinct("nome")
    return sorted([s for s in sinais if s])


@app.get("/admin/stats/trend")
async def obter_tendencia(periodo: str = "Mensal", sinal: str = "A"):
    agora = datetime.utcnow()
    dias = {"Diário": 1, "Semanal": 7, "Mensal": 30, "Anual": 365}
    data_limite = agora - timedelta(days=dias.get(periodo, 30))

    pipeline = [
        {"$match": {"data": {"$gte": data_limite}, "nome": sinal.upper()}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%d/%m", "date": "$data"}},
                "total": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    res = await db_sinais.sinais.aggregate(pipeline).to_list(length=100)
    return {
        "labels": [item["_id"] for item in res],
        "values": [item["total"] for item in res],
    }


@app.get("/admin/stats/comparison")
async def comparar_treineiros(u1: Optional[str] = None, u2: Optional[str] = None):
    async def get_user_metrics(username):
        if not username:
            return [0, 0, 0]
        total = await db_sinais.sinais.count_documents({"autor": username})
        sinais_unicos = len(
            await db_sinais.sinais.distinct("nome", {"autor": username})
        )
        user_data = await db_users.usuarios.find_one({"username": username})
        empenho = user_data.get("empenho", 0) if user_data else 0
        return [total, sinais_unicos, empenho]

    return {
        "user1Metrics": await get_user_metrics(u1),
        "user2Metrics": await get_user_metrics(u2),
    }


# Rota antiga de stats mantida para compatibilidade
@app.get("/admin/stats")
async def obter_estatisticas_legado(periodo: str = "Mensal", sinal: str = None):
    agora = datetime.utcnow()
    delta = timedelta(days=30)
    if periodo == "Diário":
        delta = timedelta(days=1)
    elif periodo == "Semanal":
        delta = timedelta(weeks=1)
    elif periodo == "Anual":
        delta = timedelta(days=365)

    data_limite = agora - delta
    pipeline = [
        {
            "$match": {
                "data": {"$gte": data_limite},
                **({"nome": sinal.upper()} if sinal else {}),
            }
        },
        {
            "$group": {
                "_id": {
                    "data": {"$dateToString": {"format": "%Y-%m-%d", "date": "$data"}},
                    "username": "$autor",
                },
                "total": {"$sum": 1},
            }
        },
        {"$sort": {"_id.data": 1}},
    ]
    return await db_sinais.sinais.aggregate(pipeline).to_list(1000)


# --- ROTA DE EXPORTAÇÃO (CORRIGIDA) ---
@app.get("/admin/export/report")
async def export_report(user: str = "all", sinal: str = "all", date: str = ""):
    query = {}
    if user != "all":
        query["autor"] = user
    if sinal != "all":
        query["nome"] = sinal.upper()
    if date:
        dt_obj = datetime.strptime(date, "%Y-%m-%d")
        query["data"] = {"$gte": dt_obj, "$lt": dt_obj + timedelta(days=1)}

    # Busca os dados reais para o PDF
    total_coletado = await db_sinais.sinais.count_documents(query)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_fill_color(15, 23, 42)  # Fundo escuro slate-900
    pdf.set_text_color(255, 255, 255)

    pdf.set_font("Arial", "B", 16)
    pdf.cell(190, 15, "TECHLIBRAS - RELATORIO DE AUDITORIA", 1, 1, "C")

    pdf.set_text_color(0, 0, 0)
    pdf.ln(10)
    pdf.set_font("Arial", "", 12)
    pdf.cell(
        0,
        10,
        f"Filtros aplicados: Usuario: {user} | Sinal: {sinal} | Data: {date}",
        0,
        1,
    )
    pdf.cell(0, 10, f"Total de amostras encontradas no banco: {total_coletado}", 0, 1)
    pdf.ln(10)
    pdf.multi_cell(
        0,
        10,
        "Este documento valida a consistencia dos dados coletados para treinamento do modelo de IA.",
    )

    pdf_bytes = pdf.output(dest="S").encode("latin-1")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=auditoria_{user}_{sinal}.pdf"
        },
    )

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from .database import db_users, db_sinais

router = APIRouter(tags=["Administração e BI"])

# --- MODELOS DE ENTRADA (PYDANTIC) ---


class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "user"


# --- AUXILIARES ---


async def get_user_stats(username):
    if not username:
        return {"total": 0, "xp": 0}
    total = await db_sinais.sinais.count_documents({"autor": username})
    user = await db_users.usuarios.find_one({"username": username})
    return {"total": total, "xp": user.get("empenho", 0) if user else 0}


# --- ROTAS DE LISTAGEM (SUPORTA AMBOS OS CAMINHOS DO FRONT) ---


@router.get("/usuarios")
@router.get("/usuarios/lista")
async def listar_todos_usuarios():
    cursor = db_users.usuarios.find({}, {"password": 0})
    users = await cursor.to_list(length=1000)
    return [
        {
            "_id": str(u["_id"]),
            "username": u["username"],
            "role": u.get("role"),
            "empenho": u.get("empenho", 0),
        }
        for u in users
    ]


@router.get("/lista-sinais")
@router.get("/lista-sinais-detalhada")
async def lista_sinais_detalhada():
    """Retorna todos os sinais com detalhes para o Gerenciador de Dataset"""
    cursor = db_sinais.sinais.find().sort("data_coleta", -1)
    sinais = await cursor.to_list(length=1000)
    for s in sinais:
        s["_id"] = str(s["_id"])
    return sinais


# --- ROTAS DE CRIAÇÃO (POST) ---


@router.post("/usuarios")
async def cadastrar_novo_usuario(user_data: UserCreate):
    """Cadastra um novo usuário no sistema"""
    existente = await db_users.usuarios.find_one({"username": user_data.username})
    if existente:
        raise HTTPException(
            status_code=400, detail="Usuário já cadastrado com esse nome."
        )

    novo_user = {
        "username": user_data.username,
        "password": user_data.password,  # Nota: Ideal aplicar hash aqui no futuro
        "role": user_data.role,
        "empenho": 0,
        "data_cadastro": datetime.utcnow(),
    }

    resultado = await db_users.usuarios.insert_one(novo_user)
    return {"status": "success", "id": str(resultado.inserted_id)}


# --- ROTAS DE ESTATÍSTICAS (BI) ---


@router.get("/stats_sinais")
async def stats_sinais_detalhado():
    cursor = db_sinais.sinais.aggregate(
        [{"$group": {"_id": "$nome", "total": {"$sum": 1}}}, {"$sort": {"total": -1}}]
    )
    res = await cursor.to_list(length=100)
    return [{"sinal": r["_id"], "total": r["total"]} for r in res]


@router.get("/stats/comparison")
async def comparar_usuarios(u1: str, u2: str = ""):
    res1 = await get_user_stats(u1)
    res2 = await get_user_stats(u2)
    return {
        "user1Metrics": [res1["total"], 10, res1["xp"]],
        "user2Metrics": [res2["total"], 10, res2["xp"]],
    }


# --- ROTAS DE EXCLUSÃO ---


@router.delete("/sinal/{id}")
async def deletar_sinal(id: str):
    try:
        await db_sinais.sinais.delete_one({"_id": ObjectId(id)})
        return {"status": "deleted"}
    except:
        raise HTTPException(status_code=400, detail="ID Inválido")


@router.delete("/limpar-sinal/{nome_sinal}")
async def limpar_sinal_inteiro(nome_sinal: str):
    """Apaga todas as amostras de um sinal específico (Ex: Apagar tudo do 'L')"""
    try:
        resultado = await db_sinais.sinais.delete_many({"nome": nome_sinal.upper()})
        return {
            "status": "success",
            "deleted_count": resultado.deleted_count,
            "message": f"Dataset de {nome_sinal} limpo com sucesso.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/limpar-dataset")
async def limpar_dataset():
    await db_sinais.sinais.delete_many({})
    return {"status": "dataset_cleared"}

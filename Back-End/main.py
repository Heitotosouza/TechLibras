from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import numpy as np
import time
import os
import json
from passlib.context import CryptContext

from core.core_ia import ai_engine
from core.admin_tools import router as admin_router

try:
    from core.database import db_users, db_sinais
except ImportError:
    print("CRITICAL: database.py não encontrado!")

app = FastAPI(title="TechLibras Core API", version="2.0.0")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HISTORY_PATH = os.path.join(BASE_DIR, "training", "history.json")

app.include_router(admin_router, prefix="/admin")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")


class Landmark(BaseModel):
    x: float
    y: float
    z: float


class DadosPrevisao(BaseModel):
    sequencia: List[List[Landmark]]
    metadata: Optional[dict] = None


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "TREINADOR"


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(p, h):
    return pwd_context.verify(p, h)


@app.get("/admin/training-history", tags=["Admin"])
async def obter_historico_treino(sinal: Optional[str] = None):
    if not os.path.exists(HISTORY_PATH):
        return {
            "accuracy": [0] * 100,
            "loss": [1] * 100,
            "classes": [],
            "detalhes_sinais": {},
        }
    try:
        with open(HISTORY_PATH, "r") as f:
            dados = json.load(f)
        if sinal and "detalhes_sinais" in dados:
            if sinal in dados["detalhes_sinais"]:
                return {
                    "global": dados["accuracy"],
                    "especifico": dados["detalhes_sinais"][sinal],
                    "sinal": sinal,
                }
        return dados
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/prever", tags=["IA"])
def prever_sinal(dados: DadosPrevisao):
    if not ai_engine.is_ready:
        raise HTTPException(status_code=503, detail="IA offline.")
    try:
        start_time = time.time()
        input_sequence = []
        frames = dados.sequencia[-20:]

        for frame in frames:
            coords = []
            if len(frame) >= 21:
                bx, by, bz = float(frame[0].x), float(frame[0].y), float(frame[0].z)
                ref_dist = (
                    np.sqrt(
                        (float(frame[9].x) - bx) ** 2
                        + (float(frame[9].y) - by) ** 2
                        + (float(frame[9].z) - bz) ** 2
                    )
                    + 1e-6
                )
                for lm in frame:
                    coords.extend(
                        [
                            (float(lm.x) - bx) / ref_dist,
                            (float(lm.y) - by) / ref_dist,
                            (float(lm.z) - bz) / ref_dist,
                        ]
                    )
            if len(coords) == 63:
                input_sequence.append(coords)

        while len(input_sequence) < 20:
            input_sequence.append(
                input_sequence[-1] if len(input_sequence) > 0 else [0.0] * 63
            )

        X = np.array([input_sequence], dtype=np.float32)
        res = ai_engine.diagnostic_model.predict(X, verbose=0)

        probs_finais = res[0] if isinstance(res, list) else res
        ativacoes_raw = res[1] if isinstance(res, list) else np.zeros((1, 20, 64))

        idx = int(np.argmax(probs_finais[0]))
        confianca = float(probs_finais[0][idx])
        sinal_final = (
            str(ai_engine.labels[idx]) if confianca > 0.85 else "Analisando..."
        )

        return {
            "sinal": sinal_final,
            "confianca": confianca,
            "debug": {
                "probabilidades": {
                    str(ai_engine.labels[i]): float(probs_finais[0][i])
                    for i in range(len(ai_engine.labels))
                },
                "ativacoes": (
                    ativacoes_raw[0][-1].flatten().tolist()[:64]
                    if len(ativacoes_raw.shape) > 2
                    else ativacoes_raw[0].tolist()[:64]
                ),
                "tempo_ms": round((time.time() - start_time) * 1000, 2),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/login", tags=["Auth"])
async def login(dados: dict):
    user = await db_users.usuarios.find_one({"username": dados.get("username")})
    if user and (
        verify_password(dados.get("password"), user["password"])
        or user["password"] == dados.get("password")
    ):
        return {
            "status": "success",
            "username": user["username"],
            "role": user.get("role"),
            "empenho": user.get("empenho", 0),
        }
    return {"status": "error", "message": "Credenciais inválidas."}


@app.post("/admin/usuarios/cadastrar", tags=["Auth"])
async def cadastrar_usuario(user: UserCreate):
    if await db_users.usuarios.find_one({"username": user.username}):
        return {"status": "error", "message": "Usuário já existe."}
    await db_users.usuarios.insert_one(
        {
            "username": user.username,
            "password": get_password_hash(user.password),
            "role": user.role,
            "empenho": 0,
            "data_criacao": datetime.utcnow(),
        }
    )
    return {"status": "success"}


@app.post("/salvar-sinal", tags=["Coleta"])
async def salvar_sinal_no_banco(dados: dict):
    tipo, autor = dados.get("tipo", "ESTATICO"), dados.get("autor", "anonimo")
    await db_sinais.sinais.insert_one(
        {
            "nome": dados.get("nome").upper(),
            "landmarks": dados.get("landmarks"),
            "tipo": tipo,
            "autor": autor,
            "data_coleta": datetime.utcnow(),
        }
    )
    xp = 15 if tipo == "DINAMICO" else 3
    await db_users.usuarios.update_one({"username": autor}, {"$inc": {"empenho": xp}})
    return {"status": "success", "xp_ganho": xp}


@app.get("/contagem-sinais")
async def obter_contagem_sinais_global():
    pipeline = [{"$group": {"_id": "$nome", "total": {"$sum": 1}}}]
    cursor = db_sinais.sinais.aggregate(pipeline)
    resultados = await cursor.to_list(length=1000)
    return {item["_id"]: item["total"] for item in resultados if item["_id"]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

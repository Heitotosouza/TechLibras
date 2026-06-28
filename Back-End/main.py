import os
import json
import time
from datetime import datetime
from typing import List, Optional
import numpy as np

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from dotenv import load_dotenv

# Carrega as configurações do arquivo .env (seja local ou no Render)
load_dotenv()

# --- AJUSTE NO CORS (Limpando espaços ocultos) ---
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
CORS_ORIGINS = [origin.strip() for origin in raw_origins.split(",")]

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

# Agora o Python sabe exatamente o que é CORS_ORIGINS!
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")


# --- MODELOS DE ENTRADA (PYDANTIC) ---


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
    role: str = (
        "ESTUDANTE"  # Alterado padrão para ESTUDANTE conforme o seu fluxo de alunos
    )


class UserLogin(BaseModel):
    username: str
    password: str


# --- FUNÇÕES DE SEGURANÇA ---


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    try:
        # Tenta a verificação padrão via passlib
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Se estourar UnknownHashError por causa de texto puro, compara diretamente
        return plain_password == hashed_password


# --- ROTAS DO SISTEMA ---


@app.get("/historico", tags=["Admin"])
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

        dist_dedao_medio = None

        for frame in frames:
            coords = []
            if len(frame) >= 21:
                bx, by, bz = float(frame[0].x), float(frame[0].y), float(frame[0].z)

                dedao_x, dedao_y, dedao_z = (
                    float(frame[4].x),
                    float(frame[4].y),
                    float(frame[4].z),
                )
                medio_x, medio_y, medio_z = (
                    float(frame[12].x),
                    float(frame[12].y),
                    float(frame[12].z),
                )

                dist_dedao_medio = np.sqrt(
                    (dedao_x - medio_x) ** 2
                    + (dedao_y - medio_y) ** 2
                    + (dedao_z - medio_z) ** 2
                )

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

        # --- EXECUÇÃO DO MODELO COM FORMATAÇÃO SEGURA ---
        X = np.array([input_sequence], dtype=np.float32)

        try:
            res = ai_engine.diagnostic_model.predict(X, verbose=0)
        except Exception as err_pred:
            print(f"❌ ERRO NO PREDICT DO TENSORFLOW: {str(err_pred)}")
            raise HTTPException(
                status_code=500, detail="Erro interno na execução da rede neural."
            )

        # Tratamento do formato de saída (Garante compatibilidade com Plano C ou Modelo Completo)
        if isinstance(res, list):
            probs_finais = res[0]
        else:
            probs_finais = res

        # Normaliza o shape das probabilidades para extrair o índice com segurança
        if len(probs_finais.shape) > 1:
            valores_preditos = probs_finais[0]
        else:
            valores_preditos = probs_finais

        idx = int(np.argmax(valores_preditos))
        confianca = float(valores_preditos[idx])

        try:
            sinal_previso = str(ai_engine.labels[idx])
        except Exception:
            sinal_previso = "Desconhecido"

        # --- HEURÍSTICA DE DESEMPATE ---
        if sinal_previso in ["L", "D"] and dist_dedao_medio is not None:
            if dist_dedao_medio < 0.08:
                sinal_final = "D"
            else:
                sinal_final = "L"
        else:
            sinal_final = sinal_previso if confianca > 0.85 else "Analisando..."

        # Montagem do dicionário de probabilidades sem risco de quebra de índice
        probabilidades_debug = {}
        for label in ["L", "D"]:
            try:
                if label in ai_engine.labels:
                    l_idx = ai_engine.labels.index(label)
                    probabilidades_debug[label] = float(valores_preditos[l_idx])
                else:
                    probabilidades_debug[label] = 0.0
            except:
                probabilidades_debug[label] = 0.0

        return {
            "sinal": sinal_final,
            "confianca": confianca,
            "debug": {
                "dist_dedao_medio_raw": (
                    float(dist_dedao_medio) if dist_dedao_medio is not None else 0
                ),
                "probabilidades": probabilidades_debug,
                "tempo_ms": round((time.time() - start_time) * 1000, 2),
            },
        }
    except Exception as e:
        print(f"❌ ERRO GERAL NA ROTA PREVER: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/login", tags=["Auth"])
async def login(dados: UserLogin):
    # 1. Busca o usuário no banco correto de forma assíncrona
    user = await db_users.usuarios.find_one({"username": dados.username})

    # 2. Se o usuário não existir, interrompe com erro 401 explicitamente
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID de Operador não encontrado no sistema.",
        )

    # 3. VALIDAÇÃO REAL: Verifica estritamente o hash ou faz fallback seguro
    if not verify_password(dados.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Código de segurança incorreto.",
        )

    # 4. Retorno de sucesso mapeado com o frontend
    return {
        "status": "success",
        "username": user["username"],
        "role": user.get("role", "ESTUDANTE"),
        "empenho": user.get("empenho", 0),
    }


@app.post("/admin/usuarios/cadastrar", tags=["Auth"])
async def cadastrar_usuario(user: UserCreate):
    # 1. Impede a duplicação de cadastros idênticos
    if await db_users.usuarios.find_one({"username": user.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este ID de Operador já está registrado.",
        )

    # 2. Converte a senha recebida em hash seguro e insere no banco
    await db_users.usuarios.insert_one(
        {
            "username": user.username,
            "password": get_password_hash(user.password),
            "role": user.role,
            "empenho": 0,
            "data_criacao": datetime.utcnow(),
        }
    )
    return {"status": "success", "message": "Credenciais implantadas com sucesso."}


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

    porta = int(os.getenv("PORT", 8000))  # 8000 para rodar certinho local
    uvicorn.run(app, host="0.0.0.0", port=porta)

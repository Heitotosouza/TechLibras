import os
import motor.motor_asyncio
from dotenv import load_dotenv
import asyncio

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    MONGODB_URL = "mongodb://localhost:27017"
    print(f"⚠️ MONGODB_URL não definida. Usando padrão: {MONGODB_URL}")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)

# --- AJUSTE CONFORME A IMAGEM DO COMPASS ---

# 1. Onde estão seus usuários (banco minúsculo na imagem)
db_users = client.techlibras_db

# 2. Onde estão seus 300 sinais (banco maiúsculo na imagem)
db_sinais = client.TechLibras

# --- REFERÊNCIAS DE COLEÇÕES ---
usuarios_col = db_users.usuarios
sinais_col = db_sinais.sinais


async def check_db():
    try:
        # Tenta dar um ping no servidor
        await client.admin.command("ping")
        print("✅ Conexão com MongoDB estabelecida!")

        # Log de verificação para você ter certeza que está no caminho certo
        n_sinais = await sinais_col.count_documents({})
        print(f"📊 Sinais encontrados no banco 'TechLibras': {n_sinais}")

    except Exception as e:
        print(f"❌ Erro ao conectar ao MongoDB: {e}")


if __name__ == "__main__":
    asyncio.run(check_db())

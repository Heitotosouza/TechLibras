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


db_users = client.techlibras_db

db_sinais = client.TechLibras

usuarios_col = db_users.usuarios
sinais_col = db_sinais.sinais


async def check_db():
    try:
        await client.admin.command("ping")
        print("✅ Conexão com MongoDB estabelecida!")

        n_sinais = await sinais_col.count_documents({})
        print(f"📊 Sinais encontrados no banco 'TechLibras': {n_sinais}")

    except Exception as e:
        print(f"❌ Erro ao conectar ao MongoDB: {e}")


if __name__ == "__main__":
    asyncio.run(check_db())

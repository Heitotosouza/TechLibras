import os
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise ValueError("ERRO: A variável MONGODB_URL não foi encontrada no arquivo .env")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)

db_users = client.techlibras_db
db_sinais = client.TechLibras

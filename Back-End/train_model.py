import asyncio
import numpy as np
import joblib
from database import db
from sklearn.ensemble import RandomForestClassifier
from datetime import datetime


async def treinar():
    print("📥 Buscando dados estruturados no MongoDB...")
    cursor = db.sinais.find({})
    sinais = await cursor.to_list(length=10000)

    if len(sinais) < 10:
        print("❌ Dados insuficientes para treino.")
        return

    X = []
    y = []

    for s in sinais:
        tipo = s.get("tipo", "ESTATICO")
        landmarks = s.get("landmarks")

        if not landmarks:
            continue

        if tipo == "ESTATICO":
            pontos = []
            for lm in landmarks:
                pontos.extend([lm["x"], lm["y"], lm["z"]])
            sequencia_flat = pontos * 20
            X.append(sequencia_flat)
            y.append(s["nome"])

        elif tipo == "DINAMICO":
            sequencia_flat = []
            for frame in landmarks:
                for lm in frame:
                    sequencia_flat.extend([lm["x"], lm["y"], lm["z"]])

            if len(sequencia_flat) == 1260:
                X.append(sequencia_flat)
                y.append(s["nome"])

    print(f"🧠 Processados {len(X)} exemplos. Iniciando Random Forest...")

    # Treino
    modelo = RandomForestClassifier(n_estimators=200, max_depth=20)
    modelo.fit(np.array(X), np.array(y))

    # Salva
    joblib.dump(modelo, "modelo_libras.pkl")
    print(f"✅ Modelo gerado em {datetime.now().strftime('%H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(treinar())

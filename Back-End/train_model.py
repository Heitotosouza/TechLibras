import asyncio
import pandas as pd
import numpy as np
import joblib  # Adicionado
from database import db
from sklearn.ensemble import RandomForestClassifier


async def treinar():
    print("📥 Buscando dados no MongoDB...")
    # 1. Pega todos os sinais do banco
    cursor = db.sinais.find({})
    sinais = await cursor.to_list(length=5000)

    if len(sinais) < 10:
        print("❌ Poucos dados! Colete mais sinais antes de treinar.")
        return

    data = []
    labels = []

    # 2. Organiza os pontos (X, Y, Z) em uma lista plana para a IA
    for sinal in sinais:
        if "landmarks" not in sinal:
            continue

        # Transforma os 21 pontos (x,y,z) em uma lista de 63 números
        pontos = []
        for lm in sinal["landmarks"]:
            pontos.extend([lm["x"], lm["y"], lm["z"]])

        data.append(pontos)
        labels.append(sinal["nome"])

    # 3. Transforma em formato que o Scikit-Learn entende
    X = np.array(data)
    y = np.array(labels)

    print(f"🧠 Treinando o cérebro com {len(X)} exemplos...")

    # Criamos o modelo (Random Forest é ótimo para esse tipo de dado)
    modelo = RandomForestClassifier(n_estimators=100)
    modelo.fit(X, y)

    # 4. Salva o "cérebro" em um arquivo
    joblib.dump(modelo, "modelo_libras.pkl")
    print("✅ Sucesso! O arquivo 'modelo_libras.pkl' foi gerado.")


if __name__ == "__main__":
    asyncio.run(treinar())

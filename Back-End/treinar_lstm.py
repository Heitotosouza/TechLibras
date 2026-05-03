import asyncio
import numpy as np
import joblib
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from database import db
from datetime import datetime


async def treinar_sistema_completo():
    print("📥 Coletando todos os sinais (Estáticos e Dinâmicos) do MongoDB...")
    cursor = db.sinais.find({})
    sinais = await cursor.to_list(length=10000)

    if len(sinais) < 10:
        print("❌ Dados insuficientes no banco para treinar.")
        return

    X = []
    y = []

    classes = sorted(list(set([s["nome"] for s in sinais])))
    label_map = {label: i for i, label in enumerate(classes)}

    for s in sinais:
        tipo = s.get("tipo", "ESTATICO")
        landmarks = s.get("landmarks")
        if not landmarks:
            continue

        sequencia = []

        if tipo == "ESTATICO":
            frame_unico = []
            for lm in landmarks:
                frame_unico.extend([lm["x"], lm["y"], lm["z"]])
            sequencia = [frame_unico] * 20
        else:
            for frame in landmarks[:20]:
                pontos_frame = []
                for lm in frame:
                    pontos_frame.extend([lm["x"], lm["y"], lm["z"]])
                sequencia.append(pontos_frame)

        if len(sequencia) == 20:
            X.append(sequencia)
            y.append(label_map[s["nome"]])

    X = np.array(X)
    y = tf.keras.utils.to_categorical(y).astype(int)

    model = Sequential(
        [
            LSTM(64, return_sequences=True, activation="relu", input_shape=(20, 63)),
            Dropout(0.2),
            LSTM(128, return_sequences=False, activation="relu"),
            Dropout(0.2),
            Dense(64, activation="relu"),
            Dense(len(classes), activation="softmax"),
        ]
    )

    model.compile(
        optimizer="Adam",
        loss="categorical_crossentropy",
        metrics=["categorical_accuracy"],
    )

    print(
        f"🧠 Treinando IA com {len(X)} exemplos e {len(classes)} sinais diferentes..."
    )
    model.fit(X, y, epochs=100, batch_size=32)

    model.save("modelo_libras_lstm.h5")
    joblib.dump(
        classes, "classes.pkl"
    )

    print(f"✅ Treino concluído! Arquivo 'modelo_libras_lstm.h5' gerado.")


if __name__ == "__main__":
    asyncio.run(treinar_sistema_completo())

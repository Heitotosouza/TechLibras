import asyncio
import numpy as np
import joblib
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.metrics import classification_report
import os
import sys
import json

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

# Ajuste de Path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from core.database import sinais_col


async def treinar_sistema_completo():
    print("📥 Coletando sinais do MongoDB...")
    cursor = sinais_col.find({})
    sinais = await cursor.to_list(length=10000)

    if len(sinais) < 5:
        print(f"❌ Dados insuficientes ({len(sinais)}).")
        return

    # LISTAS TEMPORÁRIAS PARA ARMAZENAR APENAS O QUE FOR VÁLIDO
    X_raw, y_labels = [], []

    def processar_frame_estavel(frame):
        if not frame or len(frame) < 21:
            return None
        try:
            base = frame[0]
            # Cálculo de distância de referência para normalização
            ref_dist = (
                np.sqrt(
                    (frame[9]["x"] - base["x"]) ** 2
                    + (frame[9]["y"] - base["y"]) ** 2
                    + (frame[9]["z"] - base["z"]) ** 2
                )
                + 1e-6
            )
            pontos = []
            for lm in frame:
                pontos.extend(
                    [
                        (lm["x"] - base["x"]) / ref_dist,
                        (lm["y"] - base["y"]) / ref_dist,
                        (lm["z"] - base["z"]) / ref_dist,
                    ]
                )
            return pontos
        except Exception:
            return None

    print("⚙️ Processando e filtrando landmarks...")
    for s in sinais:
        tipo = s.get("tipo", "ESTATICO")
        landmarks = s.get("landmarks")
        nome_sinal = s.get("nome", "DESCONHECIDO").upper()

        if not landmarks:
            continue

        sequencia = []
        if tipo == "ESTATICO":
            frame_limpo = processar_frame_estavel(landmarks)
            if frame_limpo:
                sequencia = [frame_limpo] * 20
        else:
            # Captura até 20 frames para sinais dinâmicos
            for frame in landmarks[:20]:
                frame_limpo = processar_frame_estavel(frame)
                if frame_limpo and len(frame_limpo) == 63:
                    sequencia.append(frame_limpo)

            # Preenchimento (Padding) se a sequência for curta mas válida
            while 0 < len(sequencia) < 20:
                sequencia.append(sequencia[-1])

        # SÓ ADICIONA AO TREINO SE TIVER EXATAMENTE 20 FRAMES DE 63 PONTOS
        if len(sequencia) == 20:
            X_raw.append(sequencia)
            y_labels.append(nome_sinal)

    # RECALCULA AS CLASSES BASEADO APENAS NO QUE SOBROU
    classes = sorted(list(set(y_labels)))
    label_map = {label: i for i, label in enumerate(classes)}
    y = [label_map[label] for label in y_labels]

    if not X_raw:
        print("❌ Nenhum sinal válido após o processamento.")
        return

    X = np.array(X_raw)
    y_cat = tf.keras.utils.to_categorical(y, num_classes=len(classes))

    # Shuffle dos dados
    indices = np.arange(X.shape[0])
    np.random.shuffle(indices)
    X, y_cat, y_true_shuffled = X[indices], y_cat[indices], np.array(y)[indices]

    print(f"🚀 Iniciando treino com {len(classes)} classes: {classes}")

    model = Sequential(
        [
            Input(shape=(20, 63)),
            LSTM(128, return_sequences=True, activation="tanh"),
            BatchNormalization(),
            Dropout(0.3),
            LSTM(128, return_sequences=False, activation="tanh"),
            BatchNormalization(),
            Dropout(0.3),
            Dense(128, activation="relu"),
            Dense(len(classes), activation="softmax"),
        ]
    )

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="categorical_crossentropy",
        metrics=["categorical_accuracy"],
    )

    history = model.fit(
        X,
        y_cat,
        epochs=120,
        batch_size=16,
        verbose=1,
        callbacks=[
            EarlyStopping(monitor="loss", patience=12, restore_best_weights=True),
            ReduceLROnPlateau(monitor="loss", factor=0.5, patience=5, min_lr=0.00001),
        ],
    )

    # GERAÇÃO DO RELATÓRIO FINAL (Agora sem erro de tamanho)
    y_pred = model.predict(X)
    y_pred_bool = np.argmax(y_pred, axis=1)

    report = classification_report(
        y_true_shuffled,
        y_pred_bool,
        target_names=classes,
        output_dict=True,
        labels=range(len(classes)),
    )

    # Salvamento
    training_dir = os.path.join(BASE_DIR, "training")
    os.makedirs(training_dir, exist_ok=True)
    model.save(os.path.join(training_dir, "modelo_libras_lstm.h5"))
    joblib.dump(classes, os.path.join(training_dir, "classes.pkl"))

    history_dict = {
        "accuracy": [float(x) for x in history.history["categorical_accuracy"]],
        "loss": [float(x) for x in history.history["loss"]],
        "classes": classes,
        "detalhes_sinais": report,
    }

    with open(os.path.join(training_dir, "history.json"), "w") as f:
        json.dump(history_dict, f)

    print(f"✅ Treino concluído e telemetria salva para {len(classes)} sinais!")


if __name__ == "__main__":
    asyncio.run(treinar_sistema_completo())

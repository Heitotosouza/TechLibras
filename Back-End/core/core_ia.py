import os
import tensorflow as tf
import joblib
import numpy as np
import logging

logger = logging.getLogger("TechLibras")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELO_PATH = os.path.join(BASE_DIR, "training", "modelo_libras_lstm.h5")
CLASSES_PATH = os.path.join(BASE_DIR, "training", "classes.pkl")


class AIController:
    def __init__(self):
        self.model = None
        self.diagnostic_model = None
        self.labels = []
        self.is_ready = False
        self.load_engine()

    def load_engine(self):
        logger.info("Tentando carregamento final do motor...")
        if os.path.exists(MODELO_PATH) and os.path.exists(CLASSES_PATH):
            try:
                # 1. Carrega o modelo
                self.model = tf.keras.models.load_model(MODELO_PATH, compile=False)
                self.labels = joblib.load(CLASSES_PATH)

                # 2. Em vez de .build(), vamos apenas passar o dado.
                # Se ele já está configurado, isso aqui vai inicializar os nós internos.
                dummy_input = np.zeros((1, 20, 63), dtype=np.float32)
                _ = self.model(dummy_input, training=False)

                # 3. Criar o modelo de diagnóstico usando as camadas diretamente
                # Isso evita o erro de "input not defined" porque pegamos os tensores da instância viva
                self.diagnostic_model = tf.keras.Model(
                    inputs=self.model.inputs,
                    outputs=[self.model.layers[-1].output, self.model.layers[0].output],
                )

                self.is_ready = True
                logger.info("✅ MOTOR DE IA DESBLOQUEADO!")

            except Exception as e:
                logger.error(f"❌ Erro no motor: {e}")
                # Plano C: Se o diagnostic_model falhar, vamos tentar rodar a IA básica pelo menos
                try:
                    self.diagnostic_model = self.model
                    self.is_ready = True
                    logger.warning(
                        "⚠️ IA operando em modo básico (sem debug de neurônios)."
                    )
                except:
                    self.is_ready = False


ai_engine = AIController()

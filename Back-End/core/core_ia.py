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
        print("====== INICIALIZANDO ENGINE DE IA ======")
        print(f"Caminho esperado do Modelo: {MODELO_PATH}")
        print(f"Caminho esperado das Classes: {CLASSES_PATH}")
        print(f"Modelo existe localmente? {os.path.exists(MODELO_PATH)}")
        print(f"Classes existem localmente? {os.path.exists(CLASSES_PATH)}")

        if not os.path.exists(MODELO_PATH) or not os.path.exists(CLASSES_PATH):
            print("❌ ERRO CRÍTICO: Arquivos de IA ausentes no servidor!")
            self.is_ready = False
            print("========================================")
            return

        try:
            # 1. Carrega o modelo
            self.model = tf.keras.models.load_model(MODELO_PATH, compile=False)
            self.labels = joblib.load(CLASSES_PATH)
            print("-> Arquivos lidos com sucesso. Inicializando tensores...")

            # 2. Dummy Input
            dummy_input = np.zeros((1, 20, 63), dtype=np.float32)
            _ = self.model(dummy_input, training=False)

            # 3. Criar o modelo de diagnóstico
            self.diagnostic_model = tf.keras.Model(
                inputs=self.model.inputs,
                outputs=[self.model.layers[-1].output, self.model.layers[0].output],
            )

            self.is_ready = True
            print("✅ MOTOR DE IA DESBLOQUEADO E PRONTO!")

        except Exception as e:
            print(f"❌ Erro detectado no bloco principal da IA: {str(e)}")
            try:
                print("-> Tentando carregar Plano C (Modo Básico)...")
                self.diagnostic_model = self.model
                self.is_ready = True
                print("⚠️ IA operando em modo básico.")
            except Exception as e_inner:
                print(f"❌ Falha total no Plano C: {str(e_inner)}")
                self.is_ready = False
        print("========================================")


ai_engine = AIController()

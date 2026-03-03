import json
import os
from pathlib import Path
from typing import List, Optional

import numpy as np
from catboost import CatBoostRegressor, Pool
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Gestão Studio — ML Service")

MODELS_DIR = Path(os.getenv("MODELS_DIR", "./models"))
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MIN_SESSIONS = 15

# Mapeamento ordinal: size e complexity viram números, bodyLocation fica como string categórica
SIZE_MAP = {
    "MICRO": 0,
    "SMALL": 1,
    "MEDIUM": 2,
    "LARGE": 3,
    "EXTRA_LARGE": 4,
    "XLARGE": 5,
    "FULL_BODY": 6,
}

COMPLEXITY_MAP = {
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2,
    "VERY_HIGH": 3,
}


# ─── Schemas ─────────────────────────────────────────────────────────────────

class SessionInput(BaseModel):
    size: str
    complexity: str
    bodyLocation: str
    finalPrice: int  # centavos


class TrainRequest(BaseModel):
    userId: str
    sessions: List[SessionInput]


class PredictRequest(BaseModel):
    userId: str
    size: str
    complexity: str
    bodyLocation: str


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _model_dir(user_id: str) -> Path:
    d = MODELS_DIR / user_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def _model_path(user_id: str) -> Path:
    return _model_dir(user_id) / "model.cbm"


def _meta_path(user_id: str) -> Path:
    return _model_dir(user_id) / "meta.json"


def _to_features(size: str, complexity: str, body_location: str) -> list:
    # [size_ordinal, complexity_ordinal, body_location_categorical]
    return [
        SIZE_MAP.get(size, 2),
        COMPLEXITY_MAP.get(complexity, 1),
        body_location,
    ]


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/train")
def train(req: TrainRequest):
    """
    Treina um modelo CatBoost por userId usando sessões históricas.
    Requer mínimo de MIN_SESSIONS sessões com tamanho, complexidade e local.
    """
    if len(req.sessions) < MIN_SESSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Mínimo de {MIN_SESSIONS} sessões necessárias. Encontradas: {len(req.sessions)}",
        )

    X = [_to_features(s.size, s.complexity, s.bodyLocation) for s in req.sessions]
    y = [s.finalPrice for s in req.sessions]

    # Índice 2 = bodyLocation é feature categórica, CatBoost cuida do encoding
    pool = Pool(X, y, cat_features=[2])

    model = CatBoostRegressor(
        iterations=300,
        learning_rate=0.05,
        depth=4,
        loss_function="RMSE",
        eval_metric="MAE",
        random_seed=42,
        verbose=False,
    )
    model.fit(pool)

    # MAE no conjunto de treino (referência interna)
    preds = model.predict(pool)
    mae = float(np.mean(np.abs(np.array(preds) - np.array(y))))

    mp = _model_path(req.userId)
    model.save_model(str(mp))

    with open(_meta_path(req.userId), "w") as f:
        json.dump({"dataPointsUsed": len(req.sessions), "mae": round(mae, 2)}, f)

    return {
        "success": True,
        "dataPointsUsed": len(req.sessions),
        "modelPath": str(mp),
        "mae": round(mae, 2),
    }


@app.post("/predict")
def predict(req: PredictRequest):
    """
    Retorna a sugestão de preço (em centavos) para os parâmetros fornecidos,
    usando o modelo treinado do userId.
    """
    mp = _model_path(req.userId)

    if not mp.exists():
        raise HTTPException(
            status_code=404,
            detail="Modelo não encontrado para este usuário",
        )

    model = CatBoostRegressor()
    model.load_model(str(mp))

    features = _to_features(req.size, req.complexity, req.bodyLocation)
    pool = Pool([features], cat_features=[2])

    raw = float(model.predict(pool)[0])
    predicted_price = max(0, round(raw))

    meta: dict = {}
    if _meta_path(req.userId).exists():
        with open(_meta_path(req.userId)) as f:
            meta = json.load(f)

    return {
        "predictedPrice": predicted_price,
        "modelDataPoints": meta.get("dataPointsUsed", 0),
        "mae": meta.get("mae"),
    }

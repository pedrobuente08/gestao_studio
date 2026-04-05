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

# Cache em memória: evita ler o .cbm do disco a cada predição
_model_cache: dict[str, CatBoostRegressor] = {}

# Supabase Storage (opcional — gracefully degraded se não configurado)
_supabase = None
SUPABASE_BUCKET = "ml-models"

def _init_supabase():
    global _supabase
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if url and key:
        try:
            from supabase import create_client
            _supabase = create_client(url, key)
        except Exception as e:
            print(f"[ML] Supabase não disponível, usando armazenamento local: {e}")

_init_supabase()

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
    return [
        SIZE_MAP.get(size, 2),
        COMPLEXITY_MAP.get(complexity, 1),
        body_location,
    ]


def _upload_model(user_id: str, local_path: Path) -> None:
    """Faz upload do .cbm para o Supabase Storage. Silencioso se não configurado."""
    if _supabase is None:
        return
    try:
        with open(local_path, "rb") as f:
            _supabase.storage.from_(SUPABASE_BUCKET).upload(
                path=f"{user_id}/model.cbm",
                file=f,
                file_options={"upsert": "true"},
            )
    except Exception as e:
        print(f"[ML] Falha no upload do modelo userId={user_id}: {e}")


def _download_model(user_id: str, local_path: Path) -> bool:
    """Tenta baixar o .cbm do Supabase Storage. Retorna True se obteve sucesso."""
    if _supabase is None:
        return False
    try:
        data = _supabase.storage.from_(SUPABASE_BUCKET).download(f"{user_id}/model.cbm")
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(data)
        return True
    except Exception:
        return False


def _get_model(user_id: str) -> Optional[CatBoostRegressor]:
    """Retorna o modelo do cache, do disco ou do Supabase Storage (nessa ordem)."""
    if user_id in _model_cache:
        return _model_cache[user_id]

    mp = _model_path(user_id)

    # Tenta baixar do Supabase se não estiver em disco
    if not mp.exists():
        if not _download_model(user_id, mp):
            return None

    model = CatBoostRegressor()
    model.load_model(str(mp))
    _model_cache[user_id] = model
    return model


def _invalidate_cache(user_id: str) -> None:
    """Remove modelo do cache em memória após novo treino."""
    _model_cache.pop(user_id, None)


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "storage": "supabase" if _supabase else "local"}


@app.post("/train")
def train(req: TrainRequest):
    """
    Treina um modelo CatBoost por userId usando sessões históricas.
    Requer mínimo de MIN_SESSIONS sessões com tamanho, complexidade e local.
    Salva o modelo em disco e faz upload para o Supabase Storage.
    """
    if len(req.sessions) < MIN_SESSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Mínimo de {MIN_SESSIONS} sessões necessárias. Encontradas: {len(req.sessions)}",
        )

    X = [_to_features(s.size, s.complexity, s.bodyLocation) for s in req.sessions]
    y = [s.finalPrice for s in req.sessions]

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

    preds = model.predict(pool)
    mae = float(np.mean(np.abs(np.array(preds) - np.array(y))))

    mp = _model_path(req.userId)
    model.save_model(str(mp))

    with open(_meta_path(req.userId), "w") as f:
        json.dump({"dataPointsUsed": len(req.sessions), "mae": round(mae, 2)}, f)

    # Invalida cache e faz upload para Supabase Storage
    _invalidate_cache(req.userId)
    _upload_model(req.userId, mp)

    return {
        "success": True,
        "dataPointsUsed": len(req.sessions),
        "modelPath": str(mp),
        "mae": round(mae, 2),
    }


@app.post("/predict")
def predict(req: PredictRequest):
    """
    Retorna a sugestão de preço (em centavos) para os parâmetros fornecidos.
    Usa cache em memória → disco local → Supabase Storage (nessa ordem).
    """
    model = _get_model(req.userId)

    if model is None:
        raise HTTPException(
            status_code=404,
            detail="Modelo não encontrado para este usuário",
        )

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

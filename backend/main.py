import asyncio
import json
import random
import time
from typing import List

import pandas as pd
from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import DATA_PATH
from app.database import Base, engine, get_db
from app.db_models import TransactionRecord
from app.ml_engine import METRICS, score_transaction
from app.schemas import PredictionResponse, StatsResponse, Transaction

# Initialize Database Tables (Neon Postgres or SQLite)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fraud Detection API",
    description="Real-Time Fraud Detection Engine backed by XGBoost, PyTorch Autoencoders, SHAP, and Neon PostgreSQL",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_STATS = {"total_scored": 0, "flagged": 0, "started_at": time.time()}
_full_df = pd.read_csv(DATA_PATH)


def _persist_scoring_result(db: Session, txn: Transaction, result: PredictionResponse):
    try:
        record = TransactionRecord(
            transaction_id=result.transaction_id,
            amount=txn.amount,
            hour=txn.hour,
            merchant_risk_score=txn.merchant_risk_score,
            distance_from_home_km=txn.distance_from_home_km,
            txns_last_24h=txn.txns_last_24h,
            is_foreign=txn.is_foreign,
            account_age_days=txn.account_age_days,
            fraud_probability=result.fraud_probability,
            anomaly_score=result.anomaly_score,
            risk_score=result.risk_score,
            is_flagged=result.is_flagged,
            risk_level=result.risk_level,
            top_factors_json=json.dumps([f.dict() for f in result.top_factors]),
            explanation=result.explanation,
        )
        db.add(record)
        db.commit()
    except Exception as e:
        db.rollback()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": True,
        "metrics": METRICS,
        "database_url": engine.url.drivername,
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(txn: Transaction, db: Session = Depends(get_db)):
    result = score_transaction(txn)
    SESSION_STATS["total_scored"] += 1
    if result.is_flagged:
        SESSION_STATS["flagged"] += 1
    _persist_scoring_result(db, txn, result)
    return result


@app.post("/predict/batch", response_model=List[PredictionResponse])
def predict_batch(txns: List[Transaction], db: Session = Depends(get_db)):
    results = []
    for t in txns:
        r = score_transaction(t)
        SESSION_STATS["total_scored"] += 1
        if r.is_flagged:
            SESSION_STATS["flagged"] += 1
        _persist_scoring_result(db, t, r)
        results.append(r)
    return results


@app.get("/history")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    records = db.query(TransactionRecord).order_by(TransactionRecord.id.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "transaction_id": r.transaction_id,
            "amount": r.amount,
            "risk_score": r.risk_score,
            "risk_level": r.risk_level,
            "is_flagged": r.is_flagged,
            "explanation": r.explanation,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@app.get("/stats", response_model=StatsResponse)
def stats():
    uptime = time.time() - SESSION_STATS["started_at"]
    total = max(SESSION_STATS["total_scored"], 1)
    return StatsResponse(
        total_scored=SESSION_STATS["total_scored"],
        flagged=SESSION_STATS["flagged"],
        uptime_seconds=round(uptime, 1),
        fraud_rate=round(SESSION_STATS["flagged"] / total, 4),
        database_connected=True,
    )


@app.websocket("/ws/stream")
async def stream_transactions(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    try:
        while True:
            row = _full_df.sample(1).iloc[0]
            txn = Transaction(
                transaction_id=str(row["transaction_id"]),
                amount=float(row["amount"]),
                hour=int(row["hour"]),
                merchant_risk_score=float(row["merchant_risk_score"]),
                distance_from_home_km=float(row["distance_from_home_km"]),
                txns_last_24h=int(row["txns_last_24h"]),
                is_foreign=int(row["is_foreign"]),
                account_age_days=float(row["account_age_days"]),
            )
            result = score_transaction(txn)
            SESSION_STATS["total_scored"] += 1
            if result.is_flagged:
                SESSION_STATS["flagged"] += 1
            _persist_scoring_result(db, txn, result)
            await websocket.send_json(result.dict())
            await asyncio.sleep(random.uniform(0.5, 1.2))
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

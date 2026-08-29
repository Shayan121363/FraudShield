from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.db_models import TransactionRecord
from app.ml_engine import score_transaction
from app.schemas import PredictionResponse, Transaction
from app.services import _persist_scoring_result, record_scoring

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def predict(txn: Transaction, db: Session = Depends(get_db)):
    result = score_transaction(txn)
    record_scoring(result.is_flagged)
    _persist_scoring_result(db, txn, result)
    return result


@router.post("/predict/batch", response_model=List[PredictionResponse])
def predict_batch(txns: List[Transaction], db: Session = Depends(get_db)):
    results = []
    for t in txns:
        r = score_transaction(t)
        record_scoring(r.is_flagged)
        _persist_scoring_result(db, t, r)
        results.append(r)
    return results


@router.get("/history")
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

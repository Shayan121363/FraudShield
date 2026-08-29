import json
import time
import pandas as pd
from sqlalchemy.orm import Session
from app.config import DATA_PATH
from app.db_models import TransactionRecord
from app.schemas import PredictionResponse, Transaction

SESSION_STATS = {"total_scored": 0, "flagged": 0, "started_at": time.time()}

try:
    _full_df = pd.read_csv(DATA_PATH)
except Exception:
    _full_df = pd.DataFrame()


def record_scoring(is_flagged: bool):
    SESSION_STATS["total_scored"] += 1
    if is_flagged:
        SESSION_STATS["flagged"] += 1


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
    except Exception:
        db.rollback()

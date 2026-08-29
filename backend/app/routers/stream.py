import asyncio
import random
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db
from app.ml_engine import score_transaction
from app.schemas import Transaction
from app.services import _full_df, _persist_scoring_result, record_scoring

router = APIRouter()


@router.websocket("/ws/stream")
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
            record_scoring(result.is_flagged)
            _persist_scoring_result(db, txn, result)
            await websocket.send_json(result.model_dump())
            await asyncio.sleep(random.uniform(0.5, 1.2))
    except (WebSocketDisconnect, Exception):
        pass

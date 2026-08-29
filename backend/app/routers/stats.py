import time
from fastapi import APIRouter
from app.database import engine
from app.ml_engine import METRICS
from app.schemas import StatsResponse
from app.services import SESSION_STATS

router = APIRouter()


@router.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": True,
        "metrics": METRICS,
        "database_url": engine.url.drivername,
    }


@router.get("/stats", response_model=StatsResponse)
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

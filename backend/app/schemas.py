from typing import List, Optional
from pydantic import BaseModel


class Transaction(BaseModel):
    transaction_id: Optional[str] = None
    amount: float
    hour: int
    merchant_risk_score: float
    distance_from_home_km: float
    txns_last_24h: int
    is_foreign: int
    account_age_days: float


class FactorItem(BaseModel):
    feature: str
    shap_value: float
    value: float


class PredictionResponse(BaseModel):
    transaction_id: Optional[str]
    fraud_probability: float
    anomaly_score: float
    risk_score: float
    is_flagged: bool
    risk_level: str
    top_factors: List[FactorItem]
    explanation: str


class StatsResponse(BaseModel):
    total_scored: int
    flagged: int
    uptime_seconds: float
    fraud_rate: float
    database_connected: bool

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


class SafetyCheckItem(BaseModel):
    id: str
    question_en: str
    question_ur: str
    tip_en: str
    tip_ur: str


class UserGuidance(BaseModel):
    demographic: str
    plain_title_en: str
    plain_title_ur: str
    plain_reason_en: str
    plain_reason_ur: str
    confidence_verdict_en: str
    confidence_verdict_ur: str
    safety_checklist: List[SafetyCheckItem]
    recommended_action_en: str
    recommended_action_ur: str


class PredictionResponse(BaseModel):
    transaction_id: Optional[str]
    amount: Optional[float] = None
    fraud_probability: float
    anomaly_score: float
    risk_score: float
    is_flagged: bool
    risk_level: str
    top_factors: List[FactorItem]
    explanation: str
    user_guidance: Optional[UserGuidance] = None


class StatsResponse(BaseModel):
    total_scored: int
    flagged: int
    uptime_seconds: float
    fraud_rate: float
    database_connected: bool

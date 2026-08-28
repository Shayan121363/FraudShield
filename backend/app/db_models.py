import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer
from app.database import Base


class TransactionRecord(Base):
    __tablename__ = "transaction_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(String, index=True)
    amount = Column(Float)
    hour = Column(Integer)
    merchant_risk_score = Column(Float)
    distance_from_home_km = Column(Float)
    txns_last_24h = Column(Integer)
    is_foreign = Column(Integer)
    account_age_days = Column(Float)

    # Risk Scoring Outputs
    fraud_probability = Column(Float)
    anomaly_score = Column(Float)
    risk_score = Column(Float)
    is_flagged = Column(Boolean)
    risk_level = Column(String)
    top_factors_json = Column(Text)
    explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

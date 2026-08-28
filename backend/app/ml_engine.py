import json
import os

import joblib
import numpy as np
import pandas as pd
import shap
import torch
import torch.nn as nn
from xgboost import XGBClassifier

from app.config import MODEL_DIR
from app.schemas import PredictionResponse, Transaction, FactorItem

# Load model metadata
with open(os.path.join(MODEL_DIR, "feature_names.json")) as f:
    FEATURE_COLS = json.load(f)

with open(os.path.join(MODEL_DIR, "metrics.json")) as f:
    METRICS = json.load(f)

scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))

# Supervised XGBoost Model
xgb_model = XGBClassifier()
xgb_model.load_model(os.path.join(MODEL_DIR, "xgb_model.json"))
shap_explainer = shap.TreeExplainer(xgb_model)


# Unsupervised Autoencoder Model
class FraudAutoencoder(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 16), nn.ReLU(),
            nn.Linear(16, 8), nn.ReLU(),
            nn.Linear(8, 3),
        )
        self.decoder = nn.Sequential(
            nn.Linear(3, 8), nn.ReLU(),
            nn.Linear(8, 16), nn.ReLU(),
            nn.Linear(16, input_dim),
        )

    def forward(self, x):
        return self.decoder(self.encoder(x))


ae_model = FraudAutoencoder(input_dim=len(FEATURE_COLS))
ae_model.load_state_dict(torch.load(os.path.join(MODEL_DIR, "autoencoder.pt"), map_location="cpu"))
ae_model.eval()

ENSEMBLE_WEIGHT_SUPERVISED = METRICS.get("ensemble_weight_supervised", 0.7)
ANOMALY_THRESHOLD = METRICS.get("anomaly_threshold", 0.05)
DECISION_THRESHOLD = METRICS.get("best_threshold", 0.5)


def to_anomaly_score(error: float, threshold: float) -> float:
    return float(1 / (1 + np.exp(-8 * (error - threshold) / (threshold + 1e-9))))


def risk_level_from_score(score: float) -> str:
    if score >= 0.8:
        return "critical"
    if score >= 0.5:
        return "high"
    if score >= 0.2:
        return "medium"
    return "low"


def generate_explanation(top_factors: list, risk_level: str, fraud_prob: float) -> str:
    if not top_factors:
        return "Transaction appears consistent with normal account behavior."

    descriptors = {
        "amount": ("unusually large amount", "typical transaction amount"),
        "hour": ("unusual transaction hour", "typical transaction hour"),
        "merchant_risk_score": ("high-risk merchant", "low-risk merchant"),
        "distance_from_home_km": ("transaction far from home", "transaction near home"),
        "txns_last_24h": ("unusually high transaction velocity", "normal transaction velocity"),
        "is_foreign": ("foreign transaction", "domestic transaction"),
        "account_age_days": ("newer account", "established account history"),
    }

    direction_phrases = []
    for factor in top_factors[:3]:
        feat = factor["feature"]
        f_phrase, n_phrase = descriptors.get(feat, (feat.replace("_", " "), feat.replace("_", " ")))
        direction_phrases.append(f_phrase if factor["shap_value"] > 0 else n_phrase)

    risk_phrase = {
        "critical": "This transaction shows strong indicators of fraud and should be blocked pending review.",
        "high": "This transaction shows multiple risk indicators and warrants manual review.",
        "medium": "This transaction has some unusual characteristics but is not strongly indicative of fraud.",
        "low": "This transaction is consistent with normal spending patterns.",
    }[risk_level]

    return f"{risk_phrase} Primary factors: {', '.join(direction_phrases)} (fraud probability: {fraud_prob:.1%})."


def score_transaction(txn: Transaction) -> PredictionResponse:
    row = pd.DataFrame([txn.dict(exclude={"transaction_id"})])[FEATURE_COLS]
    scaled = scaler.transform(row)

    fraud_prob = float(xgb_model.predict_proba(scaled)[0, 1])

    with torch.no_grad():
        tensor = torch.tensor(scaled, dtype=torch.float32)
        recon_error = float(torch.mean((tensor - ae_model(tensor)) ** 2).item())
    anomaly_score = to_anomaly_score(recon_error, ANOMALY_THRESHOLD)

    risk_score = ENSEMBLE_WEIGHT_SUPERVISED * fraud_prob + (1 - ENSEMBLE_WEIGHT_SUPERVISED) * anomaly_score
    is_flagged = risk_score >= DECISION_THRESHOLD
    risk_level = risk_level_from_score(risk_score)

    shap_vals = shap_explainer.shap_values(scaled)[0]
    factor_list = [
        {"feature": FEATURE_COLS[i], "shap_value": float(shap_vals[i]), "value": float(row.iloc[0, i])}
        for i in range(len(FEATURE_COLS))
    ]
    factor_list.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    top_factors = factor_list[:5]

    explanation = generate_explanation(top_factors, risk_level, fraud_prob)

    return PredictionResponse(
        transaction_id=txn.transaction_id,
        fraud_probability=round(fraud_prob, 4),
        anomaly_score=round(anomaly_score, 4),
        risk_score=round(risk_score, 4),
        is_flagged=is_flagged,
        risk_level=risk_level,
        top_factors=[FactorItem(**f) for f in top_factors],
        explanation=explanation,
    )

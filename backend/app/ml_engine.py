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
from app.schemas import PredictionResponse, Transaction, FactorItem, UserGuidance, SafetyCheckItem

# Load model metadata
_REQUIRED_ARTEFACTS = (
    "feature_names.json",
    "metrics.json",
    "scaler.pkl",
    "xgb_model.json",
    "autoencoder.pt",
)
_absent = [f for f in _REQUIRED_ARTEFACTS if not os.path.exists(os.path.join(MODEL_DIR, f))]
if _absent:
    raise RuntimeError(
        f"Served model artefacts are missing from MODEL_DIR={MODEL_DIR!r}: {', '.join(_absent)}. "
        "ml/ must be present in the image. On Railway set the service Root Directory to the "
        "repository root and the builder to DOCKERFILE, since the Dockerfile copies ml/ from "
        "there and Docker COPY cannot reach above the build context."
    )

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
    # Further lowered thresholds to increase high/critical prevalence
    if score >= 0.5:
        return "critical"
    if score >= 0.3:
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


def generate_user_guidance(top_factors: list, risk_level: str, txn: Transaction) -> UserGuidance:
    demographic = "First-Time Digital Banking & Wallet User"

    if risk_level in ("low", "medium"):
        return UserGuidance(
            demographic=demographic,
            plain_title_en="Payment Looks Normal & Secure",
            plain_title_ur="ادائیگی بالکل محفوظ اور درست معلوم ہوتی ہے",
            plain_reason_en="Your payment details match your typical everyday activity. No signs of deceptive requests or fraud.",
            plain_reason_ur="آپ کی ادائیگی کی تفصیلات آپ کے عام روزمرہ کے معمولات سے مطابقت رکھتی ہیں۔ کسی مشکوک یا دھوکہ دہی والی سرگرمی کا کوئی ثبوت نہیں ملا۔",
            confidence_verdict_en="Safe to proceed. Your digital balance and account are protected.",
            confidence_verdict_ur="آگے بڑھنا محفوظ ہے۔ آپ کی رقم اور اکاؤنٹ مکمل محفوظ ہیں۔",
            safety_checklist=[
                SafetyCheckItem(
                    id="check_amt",
                    question_en="Did you enter or review this amount yourself?",
                    question_ur="کیا آپ نے یہ رقم خود درج یا چیک کی ہے؟",
                    tip_en="Make sure the decimal point is in the right place.",
                    tip_ur="یقینی بنائیں کہ رقم درست لکھی گئی ہے۔"
                ),
                SafetyCheckItem(
                    id="check_rcpt",
                    question_en="Do you recognize this receiver or merchant?",
                    question_ur="کیا آپ اس وصول کنندہ یا دکان کو جانتے ہیں؟",
                    tip_en="Only send money to merchants and individuals you trust.",
                    tip_ur="صرف قابل اعتماد افراد اور دکانوں کو رقم بھیجیں۔"
                )
            ],
            recommended_action_en="You can safely complete this payment.",
            recommended_action_ur="آپ اطمینان کے ساتھ یہ ادائیگی مکمل کر سکتے ہیں۔"
        )

    # For high or critical risks, identify the primary trigger factor
    primary_factor = top_factors[0]["feature"] if top_factors else "general"

    if primary_factor in ("merchant_risk_score", "is_foreign"):
        return UserGuidance(
            demographic=demographic,
            plain_title_en="Safety Check: Unfamiliar or High-Risk Recipient",
            plain_title_ur="حفاظتی تسلی: نیا یا غیر مانوس وصول کنندہ",
            plain_reason_en="This payment is directed to a recipient with an elevated risk rating or foreign destination. Scammers often use unverified accounts.",
            plain_reason_ur="یہ ادائیگی ایک ایسے اکاؤنٹ یا بیرونی وصول کنندہ کو کی جا رہی ہے جس کی تصدیق نامکمل ہے۔ دھوکے باز اکثر ایسی نامعلوم شناختیں استعمال کرتے ہیں۔",
            confidence_verdict_en="Take 60 seconds to double-check before releasing your funds.",
            confidence_verdict_ur="رقم بھیجنے سے پہلے ایک منٹ رک کر تسلی کر لیں۔",
            safety_checklist=[
                SafetyCheckItem(
                    id="check_scam_promise",
                    question_en="Did anyone promise a prize, lottery, job, or urgent discount for this transfer?",
                    question_ur="کیا کسی نے انعام، لاٹری، نوکری یا غیر معمولی منافع کے بدلے یہ رقم مانگی ہے؟",
                    tip_en="Legitimate organizations will never ask for fees to release prizes.",
                    tip_ur="اصلی ادارے انعامات دینے کے بدلے پہلے فیس نہیں مانگتے۔"
                ),
                SafetyCheckItem(
                    id="check_otp",
                    question_en="Did anyone ask you to share a secret SMS code, OTP, or PIN?",
                    question_ur="کیا کسی نے فون پر آپ سے خفیہ ایس ایم ایس کوڈ یا پن مانگا ہے؟",
                    tip_en="Bank staff will never ask for your secret OTP or password.",
                    tip_ur="بینک یا والٹ کا کوئی بھی نمائندہ کبھی آپ سے خفیہ پاس ورڈ یا پن نہیں مانگتا۔"
                )
            ],
            recommended_action_en="Call the recipient directly on a known number to confirm before authorizing.",
            recommended_action_ur="پیسے بھیجنے سے پہلے وصول کنندہ کے اصل فون نمبر پر کال کر کے تصدیق کریں۔"
        )
    elif primary_factor == "distance_from_home_km":
        return UserGuidance(
            demographic=demographic,
            plain_title_en="Safety Check: Payment Away From Your Usual Area",
            plain_title_ur="حفاظتی تسلی: نامانوس مقام سے ادائیگی",
            plain_reason_en=f"This transfer is initiated {txn.distance_from_home_km:.0f} km away from your regular location. If you are traveling, this is normal.",
            plain_reason_ur=f"یہ ادائیگی آپ کے معمول کے مقام سے تقریباً {txn.distance_from_home_km:.0f} کلومیٹر دور سے شروع کی جا رہی ہے۔ اگر آپ سفر کر رہے ہیں تو یہ عام بات ہے۔",
            confidence_verdict_en="Confirm that you are making this transaction yourself.",
            confidence_verdict_ur="تصدیق کریں کہ یہ لین دین آپ خود کر رہے ہیں۔",
            safety_checklist=[
                SafetyCheckItem(
                    id="check_travel",
                    question_en="Are you currently traveling or shopping online on this website?",
                    question_ur="کیا آپ سفر میں ہیں یا کسی ویب سائٹ سے خریداری کر رہے ہیں؟",
                    tip_en="Ensure your device connection is secure.",
                    tip_ur="یقینی بنائیں کہ آپ کا انٹرنیٹ کنکشن محفوظ ہے۔"
                ),
                SafetyCheckItem(
                    id="check_possession",
                    question_en="Do you physically have your payment card and phone with you?",
                    question_ur="کیا آپ کا فون اور کارڈ آپ کے پاس موجود ہے؟",
                    tip_en="If misplaced, immediately freeze your card to protect your money.",
                    tip_ur="اگر کارڈ گم ہو گیا ہو تو فوری طور پر کارڈ کو عارضی طور پر بلاک کر دیں۔"
                )
            ],
            recommended_action_en="If you initiated this, verify and proceed. Otherwise, freeze the card immediately.",
            recommended_action_ur="اگر یہ آپ خود کر رہے ہیں تو تصدیق کر کے آگے بڑھیں۔ ورنہ فوری منسوخ کریں۔"
        )
    elif primary_factor == "amount":
        return UserGuidance(
            demographic=demographic,
            plain_title_en="Safety Check: Significantly Larger Amount Than Usual",
            plain_title_ur="حفاظتی تسلی: معمول سے خاصی بڑی رقم",
            plain_reason_en=f"You are transferring ${txn.amount:,.2f}, which is substantially higher than your typical transactions.",
            plain_reason_ur=f"آپ کی بھیجی جانے والی رقم (${txn.amount:,.2f}) آپ کے عام روزمرہ اخراجات سے نمایاں طور پر زیادہ ہے۔",
            confidence_verdict_en="Verify the exact numbers so you never send money by accident.",
            confidence_verdict_ur="ہندسوں کو دوبارہ چیک کر لیں تاکہ غلطی سے زیادہ رقم نہ چلی جائے۔",
            safety_checklist=[
                SafetyCheckItem(
                    id="check_zeroes",
                    question_en="Did you verify there are no extra zeroes or accidental typos in the amount?",
                    question_ur="کیا آپ نے تسلی کی ہے کہ رقم میں کوئی اضافی صفر یا غلط ہندسہ نہیں لگا؟",
                    tip_en="Accidental digit errors are the #1 cause of transfer stress.",
                    tip_ur="غلطی سے اضافی ہندسہ لگ جانا ڈیجیٹل ادائیگیوں میں سب سے عام غلطی ہے۔"
                ),
                SafetyCheckItem(
                    id="check_urgency",
                    question_en="Is someone pressuring you to hurry up and send the money immediately?",
                    question_ur="کیا کوئی فون یا میسج پر آپ پر فوری رقم بھیجنے کا دباؤ ڈال رہا ہے؟",
                    tip_en="Scammers rely on artificial panic. Always pause and breathe.",
                    tip_ur="فراڈیے جلد بازی کا احساس دلا کر غلطی کرواتے ہیں۔ ہمیشہ سوچ سمجھ کر فیصلہ کریں۔"
                )
            ],
            recommended_action_en="Double check the recipient name and amount before confirming.",
            recommended_action_ur="آگے بڑھنے سے پہلے وصول کنندہ کا نام اور رقم تسلی سے چیک کریں۔"
        )
    else:
        return UserGuidance(
            demographic=demographic,
            plain_title_en="Safety Check: Rapid Multiple Transactions",
            plain_title_ur="حفاظتی تسلی: مختصر وقت میں بار بار ادائیگیاں",
            plain_reason_en=f"We noticed {txn.txns_last_24h} transactions in the past 24 hours. Sudden activity bursts can be a sign of fraud.",
            plain_reason_ur=f"گزشتہ 24 گھنٹوں میں {txn.txns_last_24h} ادائیگیاں دیکھی گئی ہیں۔ اچانک کئی بار پیسے جانا غیر معمولی ہو سکتا ہے۔",
            confidence_verdict_en="Confirm these recent transactions belong to you.",
            confidence_verdict_ur="تسلی کر لیں کہ یہ تمام حالیہ ادائیگیاں آپ کی اپنی ہیں۔",
            safety_checklist=[
                SafetyCheckItem(
                    id="check_recent_txns",
                    question_en="Did you authorize all other recent payments made today?",
                    question_ur="کیا آج کی گئی پچھلی تمام ادائیگیاں آپ کے علم میں ہیں؟",
                    tip_en="Check your recent activity log in your app.",
                    tip_ur="ایپ میں اپنی حالیہ ہسٹری کو ایک نظر دیکھ لیں۔"
                ),
                SafetyCheckItem(
                    id="check_sms_alert",
                    question_en="Did you receive any unexpected security SMS alerts recently?",
                    question_ur="کیا آپ کو کوئی غیر متوقع سیکیورٹی ایس ایم ایس موصول ہوا ہے؟",
                    tip_en="Report any unauthorized attempts immediately.",
                    tip_ur="کسی بھی مشکوک الرٹ پر فوری کارروائی کریں۔"
                )
            ],
            recommended_action_en="Verify that all recent payments were initiated by you.",
            recommended_action_ur="تسلی کر لیں کہ تمام ادائیگیاں آپ نے ہی کی ہیں۔"
        )


def score_transaction(txn: Transaction) -> PredictionResponse:
    row = pd.DataFrame([txn.model_dump(exclude={"transaction_id"})])[FEATURE_COLS]
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
    user_guidance = generate_user_guidance(top_factors, risk_level, txn)

    return PredictionResponse(
        transaction_id=txn.transaction_id,
        amount=round(txn.amount, 2),
        fraud_probability=round(fraud_prob, 4),
        anomaly_score=round(anomaly_score, 4),
        risk_score=round(risk_score, 4),
        is_flagged=is_flagged,
        risk_level=risk_level,
        top_factors=[FactorItem(**f) for f in top_factors],
        explanation=explanation,
        user_guidance=user_guidance,
    )

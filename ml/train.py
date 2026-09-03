"""Fraud Detection Model Training Pipeline.
Trains XGBoost Classifier and PyTorch Autoencoder, and exports serving artifacts.
"""
import json
import os
import random
import sys
import importlib.metadata
import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from imblearn.over_sampling import SMOTE
from sklearn.metrics import average_precision_score, precision_recall_curve, roc_auc_score
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(HERE, "models")
DATA_PATH = os.path.join(HERE, "..", "data", "transactions.csv")
RANDOM_STATE = 42
TEST_SIZE = 0.2
FEATURE_COLS = ["amount", "hour", "merchant_risk_score", "distance_from_home_km", "txns_last_24h", "is_foreign", "account_age_days"]
LABEL_COL = "label"
ENSEMBLE_WEIGHT_SUPERVISED = 0.7
ANOMALY_CALIBRATION_PERCENTILE = 95


def seed_everything(seed: int = RANDOM_STATE):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


class FraudAutoencoder(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.encoder = nn.Sequential(nn.Linear(input_dim, 16), nn.ReLU(), nn.Linear(16, 8), nn.ReLU(), nn.Linear(8, 3))
        self.decoder = nn.Sequential(nn.Linear(3, 8), nn.ReLU(), nn.Linear(8, 16), nn.ReLU(), nn.Linear(16, input_dim))

    def forward(self, x):
        return self.decoder(self.encoder(x))


def to_anomaly_score(error, threshold):
    return 1 / (1 + np.exp(-8 * (np.asarray(error) - threshold) / (threshold + 1e-9)))


def f1_optimal_threshold(y_true, scores):
    precisions, recalls, thresholds = precision_recall_curve(y_true, scores)
    f1s = 2 * (precisions * recalls) / (precisions + recalls + 1e-9)
    return float(thresholds[int(np.argmax(f1s))]) if thresholds.size > 0 else 0.5


def prepare_data(data_path=DATA_PATH):
    df = pd.read_csv(data_path)
    X, y = df[FEATURE_COLS], df[LABEL_COL]
    split_idx = int(len(df) * (1 - TEST_SIZE))
    X_tr, X_te, y_tr, y_te = X.iloc[:split_idx], X.iloc[split_idx:], y.iloc[:split_idx], y.iloc[split_idx:]
    scaler = StandardScaler()
    return scaler.fit_transform(X_tr), scaler.transform(X_te), y_tr.reset_index(drop=True), y_te.reset_index(drop=True), scaler


def train_xgboost(X_tr, y_tr, X_te, y_te):
    res = SMOTE(random_state=RANDOM_STATE, k_neighbors=3).fit_resample(X_tr, np.asarray(y_tr))
    X_res, y_res = res[0], res[1]
    model = XGBClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.1, subsample=0.9,
        colsample_bytree=0.9, objective="binary:logistic", eval_metric="aucpr",
        tree_method="hist", random_state=RANDOM_STATE, n_jobs=1
    )
    model.fit(X_res, y_res)
    y_proba = model.predict_proba(X_te)[:, 1]
    return model, y_proba, roc_auc_score(y_te, y_proba), average_precision_score(y_te, y_proba), f1_optimal_threshold(y_te, y_proba)


def train_autoencoder(X_tr, y_tr, X_te, y_te, epochs=60, batch_size=256):
    legit_mask = np.asarray(y_tr) == 0
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    torch.manual_seed(RANDOM_STATE)
    model = FraudAutoencoder(input_dim=len(FEATURE_COLS)).to(device)
    optimizer, loss_fn = torch.optim.Adam(model.parameters(), lr=1e-3), nn.MSELoss()
    
    X_legit_t = torch.from_numpy(np.asarray(X_tr[legit_mask], dtype=np.float32)).to(device)
    gen = torch.Generator(device=device).manual_seed(RANDOM_STATE)
    for _ in range(epochs):
        perm = torch.randperm(X_legit_t.size(0), generator=gen, device=device)
        for i in range(0, X_legit_t.size(0), batch_size):
            batch = X_legit_t[perm[i:i + batch_size]]
            optimizer.zero_grad()
            loss = loss_fn(model(batch), batch)
            loss.backward()
            optimizer.step()

    model.eval()
    with torch.no_grad():
        def recon_err(mat):
            t = torch.from_numpy(np.asarray(mat, dtype=np.float32)).to(device)
            return torch.mean((t - model(t)) ** 2, dim=1).cpu().numpy()
        tr_err = recon_err(X_tr[legit_mask])
        te_err = recon_err(X_te)

    anomaly_thresh = float(np.percentile(tr_err, ANOMALY_CALIBRATION_PERCENTILE))
    return model, te_err, anomaly_thresh, roc_auc_score(y_te, te_err)


def run_training_pipeline(data_path=DATA_PATH):
    seed_everything()
    os.makedirs(MODEL_DIR, exist_ok=True)
    X_tr, X_te, y_tr, y_te, scaler = prepare_data(data_path)

    xgb_model, y_proba_xgb, auc_roc, auc_pr, sup_thresh = train_xgboost(X_tr, y_tr, X_te, y_te)
    ae_model, recon_errors, anomaly_thresh, ae_auc = train_autoencoder(X_tr, y_tr, X_te, y_te)

    anomaly_scores = to_anomaly_score(recon_errors, anomaly_thresh)
    ensemble_scores = ENSEMBLE_WEIGHT_SUPERVISED * y_proba_xgb + (1 - ENSEMBLE_WEIGHT_SUPERVISED) * anomaly_scores
    ens_pr_auc = average_precision_score(y_te, ensemble_scores)
    ens_thresh = f1_optimal_threshold(y_te, ensemble_scores)

    xgb_model.save_model(os.path.join(MODEL_DIR, "xgb_model.json"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    torch.save(ae_model.state_dict(), os.path.join(MODEL_DIR, "autoencoder.pt"))

    with open(os.path.join(MODEL_DIR, "feature_names.json"), "w") as f:
        json.dump(FEATURE_COLS, f)

    def _ver(pkg):
        try: return importlib.metadata.version(pkg)
        except Exception: return "absent"

    metrics = {
        "xgb_roc_auc": round(auc_roc, 4),
        "xgb_pr_auc": round(auc_pr, 4),
        "autoencoder_roc_auc": round(ae_auc, 4),
        "ensemble_pr_auc": round(ens_pr_auc, 4),
        "best_threshold": round(ens_thresh, 4),
        
        "supervised_best_threshold": round(sup_thresh, 4),
        "anomaly_threshold": round(anomaly_thresh, 5),
        "ensemble_weight_supervised": ENSEMBLE_WEIGHT_SUPERVISED,
        "test_set_size": len(y_te),
        "test_fraud_count": int(np.asarray(y_te).sum()),
        "train_fraud_count": int(np.asarray(y_tr).sum()),
        "dataset": {"source": "synthetic", "generator": "ml/generate_data.py", "rows": len(y_tr) + len(y_te), "path": os.path.relpath(data_path, HERE).replace("\\", "/")},
        "repro": {
            "random_seed": RANDOM_STATE, "test_size": TEST_SIZE, "n_estimators": 300,
            "python": sys.version.split()[0], "xgboost": _ver("xgboost"), "torch": _ver("torch"),
            "scikit-learn": _ver("scikit-learn"), "shap": _ver("shap"), "imbalanced-learn": _ver("imbalanced-learn")
        }
    }
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"[SUCCESS] Pipeline executed. Ensemble PR-AUC: {ens_pr_auc:.4f} | Artifacts saved to ./{MODEL_DIR}/", flush=True)
    return metrics


if __name__ == "__main__":
    run_training_pipeline(sys.argv[1] if len(sys.argv) > 1 else DATA_PATH)

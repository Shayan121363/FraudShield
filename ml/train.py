"""
Fraud Detection Model Training Pipeline.

Trains:
  1. Supervised XGBoost Classifier (with SMOTE for class imbalance)
  2. Unsupervised PyTorch Autoencoder (for novel anomaly detection)
  3. Evaluates Ensemble PR-AUC & saves artifacts to ./models/
"""
import json
import os
import joblib
import numpy as np
import pandas as pd
import torch
from sklearn.linear_model import LogisticRegression  # Simple, explainable model
# from xgboost import XGBClassifier  # Removed in favor of LogisticRegression

MODEL_DIR = "models"
FEATURE_COLS = [
    "amount", "hour", "merchant_risk_score", "distance_from_home_km",
    "txns_last_24h", "is_foreign", "account_age_days"
]


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


def prepare_data(data_path="../data/transactions.csv"):
    df = pd.read_csv(data_path)
    X, y = df[FEATURE_COLS], df["label"]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    scaler = StandardScaler()
    return scaler.fit_transform(X_tr), scaler.transform(X_te), y_tr, y_te, scaler


def train_xgboost(X_train_scaled, y_train, X_test_scaled, y_test):
    print("\n--- 1. Training Supervised XGBoost ---")
    smote = SMOTE(random_state=42, k_neighbors=3)
    X_res, y_res = smote.fit_resample(X_train_scaled, y_train)

    model = LogisticRegression(max_iter=1000, class_weight='balanced')  # Balanced logistic regression
    model.fit(X_res, y_res)

    y_proba = model.predict_proba(X_test_scaled)[:, 1]
    auc_roc = roc_auc_score(y_test, y_proba)
    auc_pr = average_precision_score(y_test, y_proba)

    precisions, recalls, thresholds = precision_recall_curve(y_test, y_proba)
    f1s = 2 * (precisions * recalls) / (precisions + recalls + 1e-9)
    best_thresh = thresholds[np.argmax(f1s)] if np.argmax(f1s) < len(thresholds) else 0.5

    print(f"XGBoost ROC-AUC: {auc_roc:.4f} | PR-AUC: {auc_pr:.4f} | Best F1 Threshold: {best_thresh:.3f}")
    return model, y_proba, auc_roc, auc_pr, best_thresh


def train_autoencoder(X_train_scaled, y_train, X_test_scaled, y_test, epochs=60, batch_size=256):
    print("\n--- 2. Training Unsupervised PyTorch Autoencoder ---")
    legit_mask = y_train.values == 0
    X_legit = torch.tensor(X_train_scaled[legit_mask], dtype=torch.float32)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = FraudAutoencoder(input_dim=len(FEATURE_COLS)).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.MSELoss()

    X_legit = X_legit.to(device)
    for epoch in range(epochs):
        perm = torch.randperm(X_legit.size(0))
        for i in range(0, X_legit.size(0), batch_size):
            batch = X_legit[perm[i:i + batch_size]]
            optimizer.zero_grad()
            loss = loss_fn(model(batch), batch)
            loss.backward()
            optimizer.step()

    model.eval()
    with torch.no_grad():
        X_test_t = torch.tensor(X_test_scaled, dtype=torch.float32).to(device)
        recon_errors = torch.mean((X_test_t - model(X_test_t)) ** 2, dim=1).cpu().numpy()

    anomaly_threshold = float(np.percentile(recon_errors[y_test.values == 0], 95))
    ae_auc = roc_auc_score(y_test, recon_errors)
    print(f"Autoencoder ROC-AUC: {ae_auc:.4f} | Anomaly Threshold: {anomaly_threshold:.5f}")
    return model, recon_errors, anomaly_threshold, ae_auc


def run_training_pipeline():
    os.makedirs(MODEL_DIR, exist_ok=True)
    X_train, X_test, y_train, y_test, scaler = prepare_data()

    xgb_model, y_proba_xgb, auc_roc, auc_pr, best_thresh = train_xgboost(X_train, y_train, X_test, y_test)
    ae_model, recon_errors, anomaly_thresh, ae_auc = train_autoencoder(X_train, y_train, X_test, y_test)

    # Compute Ensemble PR-AUC
    to_anomaly_score = lambda err, th: 1 / (1 + np.exp(-8 * (err - th) / (th + 1e-9)))
    anomaly_scores = to_anomaly_score(recon_errors, anomaly_thresh)
    ensemble_scores = 0.7 * y_proba_xgb + 0.3 * anomaly_scores
    ensemble_pr_auc = average_precision_score(y_test, ensemble_scores)
    print(f"\n--- 3. Ensemble Performance ---")
    print(f"Ensemble PR-AUC: {ensemble_pr_auc:.4f}")

    joblib.dump(xgb_model, os.path.join(MODEL_DIR, "logreg_model.pkl"))  # Save logistic regression model

    with open(os.path.join(MODEL_DIR, "feature_names.json"), "w") as f:
        json.dump(FEATURE_COLS, f)

    metrics = {
        "xgb_roc_auc": round(auc_roc, 4),
        "xgb_pr_auc": round(auc_pr, 4),
        "autoencoder_roc_auc": round(ae_auc, 4),
        "ensemble_pr_auc": round(ensemble_pr_auc, 4),
        "best_threshold": round(float(best_thresh), 4),
        "anomaly_threshold": round(anomaly_thresh, 5),
        "ensemble_weight_supervised": 0.7,
        "test_set_size": int(len(y_test)),
        "test_fraud_count": int(y_test.sum()),
    }
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[SUCCESS] All artifacts successfully saved to ./{MODEL_DIR}/")


if __name__ == "__main__":
    run_training_pipeline()

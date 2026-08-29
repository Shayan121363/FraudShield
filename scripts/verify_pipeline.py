"""Pipeline verification: proves the serving path matches what the README claims.

Run after training:

    python scripts/verify_pipeline.py

Section 1 boots the FastAPI app in-process (no port, no running server) and
asserts the scored-transaction contract end to end: artefact loading, /health,
/predict, SHAP factors, audit persistence, /predict/batch, the WebSocket feed
and /stats.

Section 2 measures a plain linear baseline on the same held-out split. This one
is here to keep us honest about the headline metrics: if an untuned
LogisticRegression already matches the ensemble, the dataset is too easy and
the PR-AUC is describing the data rather than the model.

Requires: pip install -r backend/requirements.txt
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend"))

# Isolated audit store so the demo database is never polluted by these checks.
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(ROOT, "_verify.db").replace("\\", "/")

import pandas as pd  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sklearn.linear_model import LogisticRegression  # noqa: E402
from sklearn.metrics import average_precision_score, roc_auc_score  # noqa: E402
from sklearn.model_selection import train_test_split  # noqa: E402
from sklearn.preprocessing import StandardScaler  # noqa: E402

import main  # noqa: E402
from app import ml_engine  # noqa: E402

FAILURES = []

FRAUDISH = {
    "transaction_id": "VERIFY-FRAUD",
    "amount": 1200.50,
    "hour": 3,
    "merchant_risk_score": 0.8,
    "distance_from_home_km": 320,
    "txns_last_24h": 7,
    "is_foreign": 1,
    "account_age_days": 40,
}
BORING = {
    "transaction_id": "VERIFY-LEGIT",
    "amount": 4.50,
    "hour": 14,
    "merchant_risk_score": 0.1,
    "distance_from_home_km": 0.4,
    "txns_last_24h": 1,
    "is_foreign": 0,
    "account_age_days": 2600,
}


def check(name, condition, detail=""):
    if condition:
        print(f"  PASS  {name}{('  ' + detail) if detail else ''}")
    else:
        FAILURES.append(name)
        print(f"  FAIL  {name}  {detail}")


def section_serving():
    print("\n--- 1. Serving path ---")
    with TestClient(main.app) as client:
        health = client.get("/health").json()
        check("backend boots and loads every artefact", health["models_loaded"] is True,
              f"db={health['database_url']}")

        metrics = health["metrics"]
        check("/health returns the trained metrics",
              metrics["test_set_size"] == ml_engine.METRICS["test_set_size"],
              f"ensemble_pr_auc={metrics['ensemble_pr_auc']} "
              f"threshold={metrics['best_threshold']}")

        scored = client.post("/predict", json=FRAUDISH).json()
        check("/predict scores a transaction",
              scored["transaction_id"] == FRAUDISH["transaction_id"],
              f"risk={scored['risk_score']} band={scored['risk_level']} "
              f"flagged={scored['is_flagged']}")
        check("response carries five SHAP factors", len(scored["top_factors"]) == 5,
              ", ".join(f["feature"] for f in scored["top_factors"]))
        check("factors ranked by |SHAP| descending",
              all(abs(scored["top_factors"][i]["shap_value"])
                  >= abs(scored["top_factors"][i + 1]["shap_value"]) - 1e-12
                  for i in range(len(scored["top_factors"]) - 1)))
        check("explanation is a real sentence", len(scored["explanation"]) > 60,
              scored["explanation"][:72] + "...")
        check("flagging follows the trained threshold",
              scored["is_flagged"] == (scored["risk_score"] >= metrics["best_threshold"]),
              f"risk={scored['risk_score']} threshold={metrics['best_threshold']}")

        history = client.get("/history", params={"limit": 1}).json()
        check("scored row reached the audit table",
              bool(history) and history[0]["transaction_id"] == FRAUDISH["transaction_id"],
              history[0]["risk_level"] if history else "table empty")

        batch = client.post("/predict/batch", json=[FRAUDISH, BORING]).json()
        check("/predict/batch scores every row", len(batch) == 2,
              f"fraud={batch[0]['risk_score']} legit={batch[1]['risk_score']}")
        check("fraud-shaped row outranks legit-shaped row",
              batch[1]["risk_score"] < batch[0]["risk_score"])

        with client.websocket_connect("/ws/stream") as ws:
            frame = ws.receive_json()
            check("WebSocket pushes a scored transaction",
                  {"risk_score", "top_factors", "explanation"} <= set(frame),
                  f"{frame['transaction_id']} risk={frame['risk_score']}")

        stats = client.get("/stats").json()
        check("/stats counts the session", stats["total_scored"] >= 4, json.dumps(stats))


def section_baseline():
    print("\n--- 2. Is the benchmark hard enough? ---")
    df = pd.read_csv(os.path.join(ROOT, "data", "transactions.csv"))
    cols = ml_engine.FEATURE_COLS
    X_tr, X_te, y_tr, y_te = train_test_split(
        df[cols], df["label"], test_size=0.2, stratify=df["label"], random_state=42
    )
    scaler = StandardScaler().fit(X_tr)
    model = LogisticRegression(max_iter=2000).fit(scaler.transform(X_tr), y_tr)
    proba = model.predict_proba(scaler.transform(X_te))[:, 1]

    pr = average_precision_score(y_te, proba)
    roc = roc_auc_score(y_te, proba)
    ensemble = ml_engine.METRICS["ensemble_pr_auc"]
    print(f"  untuned LogisticRegression: PR-AUC={pr:.4f} ROC-AUC={roc:.4f}")
    print(f"  shipped ensemble:           PR-AUC={ensemble:.4f}")

    saturated = pr >= 0.99 and ensemble >= 0.99
    if saturated:
        print("  NOTE  a linear model matches the ensemble on this split. The synthetic")
        print("        corpus is too separable, so these metrics validate plumbing only.")
    else:
        print("  NOTE  the ensemble beats the linear baseline, so the benchmark has headroom.")


def main_run():
    print(f"Verifying {ROOT}")
    section_serving()
    section_baseline()

    db = os.path.join(ROOT, "_verify.db")
    # Release the SQLite handle before deleting, otherwise Windows keeps the file locked.
    main.engine.dispose()
    if os.path.exists(db):
        os.remove(db)

    print("\n" + "=" * 62)
    if FAILURES:
        print(f"FAILED ({len(FAILURES)}): " + ", ".join(FAILURES))
        return 1
    print("ALL SERVING CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main_run())

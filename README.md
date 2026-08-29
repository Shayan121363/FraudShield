# FraudShield — Real-Time Transaction Fraud Detection

An end-to-end fraud detection system that scores card transactions with a supervised
model and an unsupervised anomaly detector, explains every decision with SHAP, and
streams the results to a live analyst console over WebSocket.

Built as a solo project for the Alibaba Cloud AI Hackathon (Qualification Round).

---

## What is real right now

I would rather put this at the top than make you dig for it.

| Area | Status |
|---|---|
| Ensemble scoring engine (XGBoost + autoencoder + SHAP) | Works. Verified end to end. |
| REST and WebSocket API | Works. Six endpoints. |
| Database audit trail | Works. Postgres or SQLite via env var. |
| React analyst console | Works. Production build passes. |
| Training pipeline | Runs and regenerates every served artefact. Byte-identical across runs. |
| **Model performance data** | **Measured on synthetic transactions that are too easy** |
| Alibaba Cloud deployment | Not done yet |
| Analyst review workflow | Not done yet |

The performance numbers in this README come from a **synthetic dataset** whose classes
are more separated than production data would be. They are now known to be saturated: an
untuned `LogisticRegression` reaches the same PR-AUC as the full ensemble on the same
split (see [Results](#results)). Read the numbers as evidence that the architecture and
the explainability layer work end to end, and as no evidence at all about real-world
detection quality. Re-baselining against a real labelled corpus is the next piece of work
and the numbers will change.

---

## The problem

Three things make card fraud genuinely hard to model, and they are not the same thing
as "train a classifier".

**Severe class imbalance.** Fraud is a fraction of a percent of transactions. A model
that always predicts "legit" reaches 99.7% accuracy and is worthless. Any evaluation
built on accuracy is misleading here, so this project reports PR-AUC and
precision/recall at a tuned threshold.

**Concept drift.** Fraud rings change tactics within days of a rule or model shift.
A purely supervised model can only find fraud that resembles already-labelled fraud, so
novel attacks pass through exactly when losses begin. This is why the system carries a
second, unsupervised model that never sees a fraud label at all.

**Black-box scores are not actionable.** A risk analyst cannot block a customer's
payment because "the model said 0.91", and a compliance file needs a written
justification. So the system does not stop at a score. It attributes the score to
specific features and renders that attribution as a sentence.

---

## Architecture

```
                    ┌──────────────────────────────┐
 Transaction stream │        FastAPI backend       │  ┌──────────────────┐
 (simulated, or ────▶│                              │─▶│  React console   │
  POST /predict)    │  StandardScaler              │  │  (WebSocket)     │
                    │      │                       │  └──────────────────┘
                    │      ├─▶ XGBoost ──┐         │
                    │      │  (supervised)│        │
                    │      └─▶ Autoencoder┤        │
                    │         (anomaly)  │        │
                    │                    ▼        │
                    │        Weighted ensemble     │
                    │        + SHAP attribution    │
                    │        + NL explanation      │
                    └────────────┬─────────────────┘
                                 │
                                 ▼
                      SQLAlchemy audit store
                      (PostgreSQL / SQLite)
```

Every scored transaction returns three numbers, a risk band, the five features that
drove it, and a plain-English note. The same object is pushed over WebSocket to the
dashboard and written to the database, so what an analyst sees and what the audit trail
records cannot drift apart.

---

## ML approach

| Component | Technique | Why this one |
|---|---|---|
| Class imbalance | SMOTE oversampling | Stops the model collapsing to the majority class |
| Supervised model | XGBoost | Strong on tabular financial data, trains in seconds, and supports exact tree-path SHAP rather than a post-hoc approximation |
| Unsupervised model | PyTorch autoencoder, 7→16→8→3→8→16→7 | Trained only on legitimate transactions. Scores by reconstruction error, so it can flag patterns that carry no fraud label yet |
| Fusion | Weighted ensemble, 0.7 supervised / 0.3 anomaly | The two models fail differently, so the pair is more robust than either |
| Explainability | SHAP `TreeExplainer` | Additive, per-transaction, theoretically consistent attributions |
| Reporting | Rule-based generation from SHAP values | Deterministic and auditable. An LLM rewrite is planned, see roadmap |
| Evaluation | PR-AUC, precision/recall, F1-optimal threshold | Accuracy is meaningless under this imbalance |
| Baseline check | Untuned logistic regression on the same split | Stops a saturated synthetic metric being read as model quality |

### Results

Held-out test set: 10,000 transactions containing 25 fraud cases, drawn at the natural
class ratio and never resampled.

| Metric | Value |
|---|---|
| XGBoost PR-AUC | 1.0000 |
| XGBoost ROC-AUC | 1.0000 |
| Autoencoder ROC-AUC (reconstruction error) | 0.9969 |
| Ensemble PR-AUC | 1.0000 |
| F1-optimal decision threshold (ensemble score) | 0.6450 |
| F1-optimal threshold, supervised score alone | 0.5251 |
| Anomaly calibration threshold | 0.53891 |
| **Untuned `LogisticRegression` PR-AUC, same split** | **1.0000** |

That last row is the one that matters. A seven-feature linear model, with no SMOTE and no
tuning, separates this test set perfectly. Every metric above is therefore at ceiling and
the ensemble cannot be shown to add anything on this data. No single feature does it alone
(the best is `distance_from_home_km`, 0.7946 PR-AUC), but the combination is trivially
separable, which is a property of the generator rather than of the modelling. Both models
and the fusion weight only become testable against a real corpus.

These are reproducible from `ml/models/metrics.json`, and `/health` returns the same
object at runtime. With 25 positive cases in the test set the confidence interval on
every number above is wide. That is a further reason not to read them as production
quality.

---

## Tech stack

**ML** — Python, XGBoost, PyTorch, scikit-learn, imbalanced-learn (SMOTE), SHAP, pandas,
numpy, joblib

**Backend** — FastAPI, Pydantic v2, SQLAlchemy 2, Uvicorn, WebSockets

**Frontend** — React 19, Vite 8, Recharts 3

**Data** — PostgreSQL in production, SQLite locally. Chosen by a single `DATABASE_URL`
environment variable, so no code path differs between the two.

---

## Project layout

```
fraud-detection/
├── ml/
│   ├── generate_data.py        Synthetic transaction generator
│   ├── train.py                Training pipeline for both models
│   └── models/                 Committed artefacts, so a clone runs immediately
│       ├── xgb_model.json      XGBoost booster
│       ├── autoencoder.pt      PyTorch weights
│       ├── scaler.pkl          Fitted StandardScaler
│       ├── feature_names.json  Feature contract, read at startup
│       └── metrics.json        Held-out metrics, served by /health
├── backend/
│   ├── main.py                 FastAPI app, routes, WebSocket, persistence
│   ├── requirements.txt
│   └── app/
│       ├── config.py           Paths and DATABASE_URL
│       ├── database.py         Engine, session factory
│       ├── db_models.py        TransactionRecord audit table
│       ├── ml_engine.py        Scoring, ensemble, SHAP, explanation
│       └── schemas.py          Pydantic request and response models
├── frontend/
│   └── src/
│       ├── App.jsx             Console shell and WebSocket client
│       ├── components/
│       │   ├── Ledger.jsx              Rolling transaction table
│       │   ├── SignalStrip.jsx         Proportional risk bar
│       │   ├── StatCard.jsx            Session counters
│       │   ├── RiskChart.jsx           Ensemble score over time
│       │   └── ExplainabilityPanel.jsx SHAP factors and note
│       ├── App.css
│       └── index.css
├── scripts/
│   └── verify_pipeline.py      Serving-path contract checks + linear baseline probe
└── data/
    └── transactions.csv        Generated dataset, committed so the demo runs
```

---

## Running it

You need Python 3.10+ and Node 18+.

```bash
# 1. Backend dependencies
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # macOS / Linux
pip install -r backend/requirements.txt

# 2. Start the API. Model artefacts are already in ml/models/.
cd backend
python main.py
# API    http://localhost:8000
# Docs   http://localhost:8000/docs

# 3. Start the console in a second terminal
cd frontend
npm install
npm run dev
# Dashboard http://localhost:5173
```

Open the dashboard. Transactions stream in every 0.5 to 1.2 seconds, already scored.
Click any row to inspect its SHAP factors and the written explanation. Rows above the
decision threshold are highlighted.

To regenerate the dataset or retrain from scratch:

```bash
cd ml
python generate_data.py     # writes ../data/transactions.csv
python train.py             # writes ./models/*

# From the repository root, check the serving path against whatever is in ml/models/
python scripts/verify_pipeline.py
```

`train.py` is deterministic. It pins seeds, runs XGBoost with `n_jobs=1` so split order
does not depend on core count, and calibrates the anomaly threshold on legitimate
*training* rows only rather than on the test set. Two consecutive runs produce
byte-identical artefacts, which is what makes the committed models trustworthy as an
actual product of this script. Paths resolve relative to `train.py`, so it runs from any
working directory.

### Scoring a transaction by hand

```bash
curl -X POST http://localhost:8000/predict ^
  -H "Content-Type: application/json" ^
  -d "{\"amount\": 1200.50, \"hour\": 3, \"merchant_risk_score\": 0.8, \"distance_from_home_km\": 320, \"txns_last_24h\": 7, \"is_foreign\": 1, \"account_age_days\": 40}"
```

That payload scores as `critical` with a risk score of 1.0, driven by merchant risk,
distance from home and account age. The response above is captured live, not hand-written,
and `scripts/verify_pipeline.py` re-checks it. Note the `fraud_probability` of exactly 1.0:
on saturated synthetic data the supervised model pins to the ceiling, so the ordering of
factors is currently more informative than the number.

---

## API

| Endpoint | Method | Description |
|---|---|---|
| `/predict` | POST | Score one transaction |
| `/predict/batch` | POST | Score a list of transactions |
| `/history` | GET | Last N scored transactions from the database, newest first |
| `/stats` | GET | Session totals, flagged count, fraud rate, uptime |
| `/health` | GET | Liveness, loaded metrics, database driver |
| `/ws/stream` | WebSocket | Live simulated feed of pre-scored transactions |

A scoring response looks like this:

```json
{
  "transaction_id": "TXN001",
  "fraud_probability": 1.0,
  "anomaly_score": 1.0,
  "risk_score": 1.0,
  "is_flagged": true,
  "risk_level": "critical",
  "top_factors": [
    { "feature": "merchant_risk_score", "shap_value": 4.376, "value": 0.8 },
    { "feature": "distance_from_home_km", "shap_value": 3.318, "value": 320.0 },
    { "feature": "account_age_days", "shap_value": 2.758, "value": 40.0 },
    { "feature": "amount", "shap_value": 1.987, "value": 1200.5 },
    { "feature": "hour", "shap_value": 0.763, "value": 3.0 }
  ],
  "explanation": "This transaction shows strong indicators of fraud and should be blocked pending review. Primary factors: high-risk merchant, transaction far from home, newer account (fraud probability: 100.0%)."
}
```

Risk bands are `low` below 0.2, `medium` to 0.5, `high` to 0.8, `critical` at 0.8 and
above. Flagging uses the F1-optimal threshold from training, not a round number, and that
threshold is fitted on the blended ensemble score because that is the value the server
compares against. An earlier build fitted it on the supervised probability and then
applied it to the ensemble score, which is why the number moved from 0.8616 to 0.6450 when
the pipeline was made reproducible.

---

## Data

Currently a synthetic generator producing 50,000 transactions at a 0.25% fraud rate over
seven features: amount, hour, merchant risk score, distance from home, transactions in
the last 24 hours, foreign usage and account age. Fraud rows are drawn from
distributions that carry the signal you would expect, heavier amounts, late-night skew,
riskier merchants, velocity spikes, newer accounts, and a higher foreign-usage rate.

The generator exists so the whole serving path can be exercised without waiting on a
download. It is not the target dataset.

### Real data

A public IEEE-CIS mirror is available on Hugging Face with 590,540 transactions and
20,663 labelled frauds, already cleaned, with `hour_of_day` extracted and the counter
columns preserved. Mapping it onto the existing seven-feature contract requires changing
nothing outside the data layer, since `FEATURE_COLS` is read from `feature_names.json`
at startup and the schema, database table and dashboard all follow it.

Two cautions for whoever picks this up. The mirror's `card1_historical_fraud_rate`
column is computed across the whole period and leaks the target, so merchant risk has to
be re-derived on an expanding time-ordered window. And the split must be temporal rather
than random, because the corpus spans 2017 to 2018 and fraud patterns drift.

---

## Known issues

Honest list, roughly in the order I plan to clear it.

- Every headline metric is pinned at 1.0 because the synthetic corpus is too separable.
  The ensemble is unproven on this data, and the 0.7/0.3 fusion weight is asserted rather
  than measured. Resolving this needs the real corpus, not more tuning.
- Metrics are synthetic-data metrics. See above.
- `scripts/verify_pipeline.py` checks the serving path end to end, but there are no unit
  tests for the scoring internals and no CI running any of it.
- No authentication on any endpoint, and CORS is open to `*`. Fine for a local demo, not
  for a deployed one.
- `SESSION_STATS` is process-local memory, so the numbers reset on restart and do not
  aggregate across workers. The durable figures are in `/history`.
- The committed `xgb_model.json` is now a true product of `train.py`, but it is not the
  model that shipped before this was fixed. Those hyperparameters were lost when the script
  drifted to `LogisticRegression`, so the booster was retrained rather than matched. Every
  score and threshold therefore shifted, and the previous artefacts still sit in git history.

### Cleared

- `train.py` trained a `LogisticRegression`, was missing seven imports so it exited with a
  `NameError`, and never wrote `scaler.pkl`. It now trains the XGBoost booster the backend
  loads, persists all five artefacts, and reproduces them byte-identically. Verified by
  deleting `ml/models/` entirely and rebuilding from `data/transactions.csv` alone.
- The console header and browser tab rendered the earlier working title; both say FraudShield now.

---

## Roadmap

1. ~~Make `train.py` runnable and self-consistent, and persist the scaler~~ done, and
   covered by `scripts/verify_pipeline.py`
2. Public repository with real commit history
3. Retrain on IEEE-CIS with a temporal split and leak-free merchant risk encoding,
   then update every number in this file. This is the only step that can produce a metric
   worth quoting, and it should also re-measure whether the autoencoder earns its 0.3 weight.
4. Containers, model artefacts in Alibaba Cloud OSS under versioned keys, deploy with a
   public URL, managed PostgreSQL audit store
5. Analyst review queue recording true and false-positive verdicts, which also produces
   the label set for the next training cycle
6. Endpoint authentication and input hardening
7. Optional: Qwen through Alibaba Cloud Model Studio to turn the deterministic
   explanation into a narrative report, with SHAP values supplied as grounded context

Out of scope for the build phase, deliberately: distributed Flink streaming, PAI-EAS
model serving, and multi-tenant access control.

---

## License

Not yet chosen.

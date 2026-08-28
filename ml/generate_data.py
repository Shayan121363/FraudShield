"""
Generates a realistic synthetic credit card transaction dataset.
Mimics the structure of the Kaggle Credit Card Fraud dataset but lets us
control fraud rate, feature meaning, and size without needing a download.

Run: python generate_data.py
Output: ../data/transactions.csv
"""
import numpy as np
import pandas as pd

np.random.seed(42)

N_SAMPLES = 50000
FRAUD_RATIO = 0.0025  # ~0.25%, realistic for card fraud

n_fraud = int(N_SAMPLES * FRAUD_RATIO)
n_legit = N_SAMPLES - n_fraud

def make_legit(n):
    return pd.DataFrame({
        "amount": np.round(np.random.lognormal(mean=3.0, sigma=1.0, size=n), 2),
        "hour": np.random.normal(14, 5, n).clip(0, 23).astype(int),
        "merchant_risk_score": np.random.beta(2, 8, n),       # most merchants low risk
        "distance_from_home_km": np.random.exponential(5, n),
        "txns_last_24h": np.random.poisson(3, n),
        "is_foreign": np.random.binomial(1, 0.03, n),
        "account_age_days": np.random.gamma(shape=5, scale=300, size=n),
        "label": 0
    })

def make_fraud(n):
    return pd.DataFrame({
        "amount": np.round(np.random.lognormal(mean=5.0, sigma=1.5, size=n), 2),  # bigger, more variable
        "hour": np.random.choice(range(24), n, p=_night_weighted_probs()),
        "merchant_risk_score": np.random.beta(6, 3, n),       # riskier merchants
        "distance_from_home_km": np.random.exponential(80, n),  # far from home
        "txns_last_24h": np.random.poisson(8, n),              # velocity spike
        "is_foreign": np.random.binomial(1, 0.35, n),
        "account_age_days": np.random.gamma(shape=2, scale=200, size=n),
        "label": 1
    })

def _night_weighted_probs():
    # fraud skews toward late night / early morning
    hours = np.arange(24)
    weights = np.where((hours >= 0) & (hours <= 5), 3.0, 1.0)
    return weights / weights.sum()

legit_df = make_legit(n_legit)
fraud_df = make_fraud(n_fraud)

df = pd.concat([legit_df, fraud_df], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle
df.insert(0, "transaction_id", [f"TXN{100000+i}" for i in range(len(df))])

df.to_csv("../data/transactions.csv", index=False)
print(f"Generated {len(df)} transactions ({n_fraud} fraud, {n_legit} legit)")
print(df["label"].value_counts(normalize=True))

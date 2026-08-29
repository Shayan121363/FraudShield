import os
import sys
import numpy as np
import pandas as pd

def download_and_preprocess():
    print("Step 1: Installing huggingface_hub if not present...")
    try:
        import huggingface_hub
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface_hub"])
        import huggingface_hub

    from huggingface_hub import hf_hub_download

    print("Step 2: Downloading IEEE-CIS fraud detection files from Hugging Face...")
    # Using a public community copy of the dataset
    repo_id = "aliceczr/ieee-fraud-detection"
    
    print("Downloading train_transaction.csv...")
    train_txn_path = hf_hub_download(
        repo_id=repo_id,
        filename="train_transaction.csv",
        repo_type="dataset"
    )
    
    print("Downloading train_identity.csv...")
    train_id_path = hf_hub_download(
        repo_id=repo_id,
        filename="train_identity.csv",
        repo_type="dataset"
    )

    print("Step 3: Loading data...")
    df_txn = pd.read_csv(train_txn_path)
    df_id = pd.read_csv(train_id_path)

    print(f"Loaded {len(df_txn)} transactions and {len(df_id)} identity records.")

    print("Step 4: Merging datasets...")
    df = pd.merge(df_txn, df_id, on="TransactionID", how="left")

    print("Step 5: Preprocessing and mapping to 7 schema features...")
    
    # 1. amount = TransactionAmt
    amount = df["TransactionAmt"].round(2)

    # 2. hour = (TransactionDT // 3600) % 24
    hour = ((df["TransactionDT"] // 3600) % 24).astype(int)

    # 3. merchant_risk_score: Target-encoded risk on card1/addr1
    # We will compute the fraud probability of addr1 (defaulting to card1 if addr1 is null)
    global_mean = df["isFraud"].mean()
    addr1_counts = df.groupby("addr1")["isFraud"].count()
    addr1_sums = df.groupby("addr1")["isFraud"].sum()
    smooth = 10
    addr1_risk = (addr1_sums + smooth * global_mean) / (addr1_counts + smooth)
    
    # Map to df
    merchant_risk_score = df["addr1"].map(addr1_risk).fillna(global_mean)

    # 4. distance_from_home_km: Use dist1 (distance between billing address and mailing address/etc)
    # Fill missing values with median
    dist_median = df["dist1"].median()
    if pd.isna(dist_median):
        dist_median = 5.0
    distance_from_home_km = df["dist1"].fillna(dist_median)

    # 5. txns_last_24h: Count of transactions for the same card1 in the last 24h
    print("Computing transaction velocity (txns_last_24h)...")
    # Sort chronologically to do sliding window calculation correctly
    df = df.sort_values("TransactionDT")
    
    # To compute this efficiently:
    times = df["TransactionDT"].values
    card1s = df["card1"].values
    
    # We will do a fast grouping searchsorted
    def compute_velocity(group):
        t = group["TransactionDT"].values
        # How many prior txns fell in [t - 86400, t)
        idx_left = np.searchsorted(t, t - 86400, side="left")
        return pd.Series(np.arange(len(t)) - idx_left, index=group.index)
    
    # Group by card1 and apply velocity computation
    txns_last_24h = df.groupby("card1", group_keys=False).apply(compute_velocity)

    # 6. is_foreign: card3 (country code) not equal to 150 (US) OR addr2 not equal to 87 (US)
    # Most common US values: card3=150.0, addr2=87.0
    is_foreign = ((df["card3"].fillna(150.0) != 150.0) | (df["addr2"].fillna(87.0) != 87.0)).astype(int)

    # 7. account_age_days: D1 (days since card/account creation)
    account_age_days = df["D1"].fillna(0.0)

    # Build the target dataframe
    processed_df = pd.DataFrame({
        "transaction_id": "TXN" + df["TransactionID"].astype(str),
        "amount": amount,
        "hour": hour,
        "merchant_risk_score": merchant_risk_score,
        "distance_from_home_km": distance_from_home_km,
        "txns_last_24h": txns_last_24h,
        "is_foreign": is_foreign,
        "account_age_days": account_age_days,
        "label": df["isFraud"]
    })

    # Sort back by TransactionDT (which means chronologically sorted)
    processed_df = processed_df.loc[df.index]

    # Ensure output directories exist
    os.makedirs(os.path.join(os.path.dirname(__file__), "..", "data"), exist_ok=True)
    out_path = os.path.join(os.path.dirname(__file__), "..", "data", "transactions.csv")
    
    print(f"Saving preprocessed data to {out_path}...")
    processed_df.to_csv(out_path, index=False)
    print("Data download and preprocessing complete!")
    print(processed_df.head())
    print(processed_df["label"].value_counts())

if __name__ == "__main__":
    download_and_preprocess()

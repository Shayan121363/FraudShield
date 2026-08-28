import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "..", "ml", "models")
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "transactions.csv")

# Neon Postgres Database URL (falls back to local SQLite if DATABASE_URL is not set)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fraud.db")

# Convert postgres:// to postgresql:// if passed from platforms like Render/Heroku
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

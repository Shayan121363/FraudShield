import os
from dotenv import load_dotenv

# Load .env from the backend directory (works whether you run from repo root or /backend)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "..", "ml", "models")
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "transactions.csv")

# Loaded from backend/.env — set DATABASE_URL there, never hardcode secrets in source
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fraud.db")

# Convert postgres:// to postgresql:// if passed from platforms like Render/Heroku
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

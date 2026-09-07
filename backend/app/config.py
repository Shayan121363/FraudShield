import os
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(BACKEND_DIR)

# Load .env from the backend directory (works whether you run from repo root or /backend)
load_dotenv(dotenv_path=os.path.join(BACKEND_DIR, ".env"))

BASE_DIR = BACKEND_DIR

# ml/ and data/ live at repo root (sibling of backend/), not inside backend/
MODEL_DIR = os.getenv("MODEL_DIR", os.path.join(REPO_ROOT, "ml", "models"))
DATA_PATH = os.getenv("DATA_PATH", os.path.join(REPO_ROOT, "data", "transactions.csv"))

# Loaded from backend/.env — set DATABASE_URL there, never hardcode secrets in source
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fraud.db")

# Convert postgres:// to postgresql:// if passed from platforms like Render/Heroku
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

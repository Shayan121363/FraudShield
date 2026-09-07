import os
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(BACKEND_DIR)

# Load .env from the backend directory (works whether you run from repo root or /backend)
load_dotenv(dotenv_path=os.path.join(BACKEND_DIR, ".env"))

BASE_DIR = BACKEND_DIR


def resolve_artifact(env_var: str, relative: str) -> str:
    """Find a bundled artefact across the tree layouts this app actually runs in.

    ml/ and data/ sit at the repo root, a sibling of backend/. That holds locally and
    in the Dockerfile image, but a platform whose root directory is backend/ puts this
    package at /app with no repo root above it. An explicit env override wins when the
    path it names exists; otherwise the first candidate that exists wins, and the
    repo-root default is returned so the caller reports every path that was tried.
    """
    candidates = []
    override = os.getenv(env_var)
    if override:
        candidates.append(override)
    for root in (REPO_ROOT, BACKEND_DIR, os.getcwd()):
        candidates.append(os.path.join(root, relative))

    unique = list(dict.fromkeys(candidates))
    for path in unique:
        if os.path.exists(path):
            return path
    return unique[0]


# ml/ and data/ live at repo root (sibling of backend/), not inside backend/
MODEL_DIR = resolve_artifact("MODEL_DIR", os.path.join("ml", "models"))
DATA_PATH = resolve_artifact("DATA_PATH", os.path.join("data", "transactions.csv"))

# Loaded from backend/.env — set DATABASE_URL there, never hardcode secrets in source
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fraud.db")

# Convert postgres:// to postgresql:// if passed from platforms like Render/Heroku
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

import os
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(BACKEND_DIR)

# Load .env from the backend directory (works whether you run from repo root or /backend)
_ = load_dotenv(dotenv_path=os.path.join(BACKEND_DIR, ".env"))

BASE_DIR = BACKEND_DIR


def resolve_artifact(env_var: str, relative: str) -> str:

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


MODEL_DIR = resolve_artifact("MODEL_DIR", os.path.join("ml", "models"))
DATA_PATH = resolve_artifact("DATA_PATH", os.path.join("data", "transactions.csv"))


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fraud.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgresql+psycopg://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg2://", 1
    ).replace(
        "postgresql+psycopg://", "postgresql+psycopg2://", 1
    )

import os
import sys

# Add the backend directory (which contains the `app` package) to sys.path
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))
sys.path.append(PROJECT_ROOT)

# Load environment variables from .env (optional, SQLAlchemy reads DATABASE_URL from env)
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, '.env'))

from app.database import engine, Base

def main():
    Base.metadata.create_all(bind=engine)
    print('Tables created in PostgreSQL')

if __name__ == '__main__':
    main()

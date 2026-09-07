FROM python:3.13-slim

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY ml/ ml/
COPY data/ data/

WORKDIR /app/backend

ENV MODEL_DIR=/app/ml/models
ENV DATA_PATH=/app/data/transactions.csv

EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

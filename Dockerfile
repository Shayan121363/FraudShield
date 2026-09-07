FROM python:3.13-slim

WORKDIR /app

# torch's wheels need libgomp1 at import time and it is absent from -slim base images.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# CPU-only torch first: the default PyPI wheel drags in ~2 GB of CUDA that this
# service never uses. requirements.txt still lists torch, and pip skips it as satisfied.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

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

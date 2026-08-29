from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import predict, stats, stream
from app.services import SESSION_STATS, _full_df, _persist_scoring_result

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fraud Detection API",
    description="Real-Time Fraud Detection Engine backed by XGBoost, PyTorch Autoencoders, SHAP, and Neon PostgreSQL",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stats.router)
app.include_router(predict.router)
app.include_router(stream.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

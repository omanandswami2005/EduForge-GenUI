"""GenUI Service — BKT-constrained AI visualization generation via Claude."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import visualize, chat

app = FastAPI(title="EduForge GenUI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.environ.get("NEXT_PUBLIC_APP_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(visualize.router, prefix="/stream", tags=["stream"])
app.include_router(chat.router, prefix="/stream", tags=["chat"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "eduforge-genui"}

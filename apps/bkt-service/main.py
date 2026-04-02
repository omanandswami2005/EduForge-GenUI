"""
BKT Service — Bayesian Knowledge Tracing Engine
Cloud Run service handling BKT state updates, scaffold resolution, and component gating.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import update, state, scaffold

app = FastAPI(title="EduForge BKT Service", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(update.router, tags=["bkt"])
app.include_router(state.router, tags=["state"])
app.include_router(scaffold.router, tags=["scaffold"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "eduforge-bkt"}

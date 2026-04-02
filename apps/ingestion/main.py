"""Ingestion Service — PPTX extraction, AI topic generation, MCQ generation."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import trigger

app = FastAPI(title="EduForge Ingestion Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trigger.router, prefix="", tags=["ingestion"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "eduforge-ingestion"}

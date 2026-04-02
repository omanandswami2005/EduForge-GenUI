"""
API Gateway Service — Main entry point for EduForge.
FastAPI on Cloud Run. Handles lessons, students, enrollments, analytics.
"""
import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from src.routers import lessons, students, bkt_proxy, analytics, internal

app = FastAPI(title="EduForge API", version="1.0.0", docs_url="/docs")

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


@app.middleware("http")
async def add_timing(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    response.headers["X-Process-Time"] = f"{duration}ms"
    return response


app.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(bkt_proxy.router, prefix="/bkt", tags=["bkt"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(internal.router, prefix="/internal", tags=["internal"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "eduforge-api"}

"""BKT proxy router — Forwards requests to the BKT microservice."""
import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import httpx
from ..middleware.auth import verify_firebase_token

router = APIRouter()

BKT_SERVICE_URL = os.environ.get("BKT_SERVICE_URL", "http://localhost:8001")


class MCQAnswerRequest(BaseModel):
    student_id: str
    lesson_id: str
    subtopic_id: str
    concept_id: str
    mcq_id: str
    selected_answer: str
    is_correct: bool
    time_taken_seconds: int = 0


@router.post("/update")
async def proxy_bkt_update(
    request: MCQAnswerRequest,
    token: dict = Depends(verify_firebase_token),
):
    """Proxy BKT update request to the BKT microservice."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BKT_SERVICE_URL}/update",
            json=request.model_dump(),
        )
        resp.raise_for_status()
        return resp.json()


@router.get("/state")
async def proxy_bkt_state(
    studentId: str,
    conceptId: str,
    token: dict = Depends(verify_firebase_token),
):
    """Proxy BKT state request."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{BKT_SERVICE_URL}/state",
            params={"studentId": studentId, "conceptId": conceptId},
        )
        resp.raise_for_status()
        return resp.json()


@router.get("/scaffold")
async def proxy_scaffold(
    p_mastery: float,
    token: dict = Depends(verify_firebase_token),
):
    """Proxy scaffold request."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{BKT_SERVICE_URL}/scaffold",
            params={"p_mastery": p_mastery},
        )
        resp.raise_for_status()
        return resp.json()

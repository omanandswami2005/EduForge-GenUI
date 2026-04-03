"""Lessons router — CRUD for lessons, upload, ingestion triggers."""
import uuid
import json
import base64
import asyncio
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..services.firestore_service import FirestoreService
from ..services.storage_service import StorageService
from ..services.pubsub_service import PubSubService
from ..middleware.auth import verify_firebase_token

INGESTION_SERVICE_URL = os.environ.get("INGESTION_SERVICE_URL", "")

router = APIRouter()


class UploadURLRequest(BaseModel):
    filename: str
    contentType: str
    lessonTitle: str
    subject: str


class StartIngestionRequest(BaseModel):
    lessonId: str
    gcsPath: str


@router.post("/upload-url")
async def get_upload_url(
    request: UploadURLRequest,
    token: dict = Depends(verify_firebase_token),
):
    """Generate a signed URL for direct PPTX upload to GCS."""
    fs = FirestoreService()
    ss = StorageService()

    # Create lesson document
    lesson_id = await fs.create_lesson({
        "title": request.lessonTitle,
        "subject": request.subject,
        "teacherId": token["uid"],
    })

    # Generate GCS path and signed URL
    ext = request.filename.rsplit(".", 1)[-1] if "." in request.filename else "pptx"
    gcs_path = f"lessons/{lesson_id}/upload.{ext}"
    upload_url = ss.generate_signed_upload_url(gcs_path, request.contentType)

    return {
        "uploadUrl": upload_url,
        "lessonId": lesson_id,
        "gcsPath": f"gs://{ss.bucket.name}/{gcs_path}",
    }


@router.post("/start-ingestion")
async def start_ingestion(
    request: StartIngestionRequest,
    token: dict = Depends(verify_firebase_token),
):
    """Trigger the ingestion pipeline via Pub/Sub."""
    fs = FirestoreService()
    ps = PubSubService()

    # Verify lesson exists and belongs to this teacher
    lesson = await fs.get_lesson(request.lessonId)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if lesson.get("teacherId") != token["uid"]:
        raise HTTPException(status_code=403, detail="Not your lesson")

    # Update status
    await fs.update_lesson(request.lessonId, {
        "status": "processing",
        "gcsPath": request.gcsPath,
        "ingestion": {"step": "queued", "progress": 0, "message": "Queued for processing..."},
    })

    payload = {"lesson_id": request.lessonId, "gcs_path": request.gcsPath}

    if INGESTION_SERVICE_URL:
        # Local dev: call ingestion service directly (Pub/Sub can't reach localhost)
        # Format message the same way Pub/Sub push would, fire-and-forget
        pubsub_envelope = {
            "message": {
                "data": base64.b64encode(json.dumps(payload).encode()).decode(),
                "messageId": "local-dev",
            }
        }
        asyncio.create_task(_trigger_ingestion_direct(pubsub_envelope))
    else:
        # Production: publish to Pub/Sub (push subscription calls /trigger)
        ps = PubSubService()
        ps.publish("lesson-ingestion-requests", payload)

    return {"status": "queued", "lessonId": request.lessonId}


async def _trigger_ingestion_direct(envelope: dict):
    """Fire-and-forget HTTP call to ingestion service for local dev."""
    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            await client.post(f"{INGESTION_SERVICE_URL}/trigger", json=envelope)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Direct ingestion trigger failed: {e}")


@router.get("/{lesson_id}")
async def get_lesson(
    lesson_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Get lesson details."""
    fs = FirestoreService()
    lesson = await fs.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.get("/{lesson_id}/subtopics")
async def get_subtopics(
    lesson_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Get all subtopics for a lesson."""
    fs = FirestoreService()
    return await fs.get_subtopics(lesson_id)


@router.get("/{lesson_id}/subtopics/{subtopic_id}/mcqs")
async def get_mcqs(
    lesson_id: str,
    subtopic_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Get MCQ bank for a subtopic."""
    fs = FirestoreService()
    return await fs.get_mcqs(lesson_id, subtopic_id)


@router.patch("/{lesson_id}/publish")
async def publish_lesson(
    lesson_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Publish a lesson so students can enroll."""
    fs = FirestoreService()
    lesson = await fs.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if lesson.get("teacherId") != token["uid"]:
        raise HTTPException(status_code=403, detail="Not your lesson")
    if lesson.get("ingestion", {}).get("step") != "complete":
        raise HTTPException(status_code=400, detail="Ingestion not complete")
    await fs.update_lesson(lesson_id, {"status": "published"})
    return {"status": "published", "lessonId": lesson_id}


@router.get("")
async def list_lessons(token: dict = Depends(verify_firebase_token)):
    """List all lessons for the authenticated teacher."""
    fs = FirestoreService()
    return await fs.get_teacher_lessons(token["uid"])

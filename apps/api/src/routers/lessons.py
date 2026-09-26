"""Lessons router — CRUD for lessons, upload, ingestion triggers."""
import uuid
import json
import base64
import asyncio
import os
import secrets
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from ..services.firestore_service import FirestoreService
from ..services.storage_service import StorageService, LOCAL_UPLOAD_MODE, local_upload_path
from ..services.pubsub_service import PubSubService
from ..services.join_codes import format_code
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


class JoinSettingsRequest(BaseModel):
    enabled: bool


@router.post("/upload-url")
async def get_upload_url(
    request: UploadURLRequest,
    http_request: Request,
    token: dict = Depends(verify_firebase_token),
):
    """Generate a signed URL for direct PPTX upload to GCS."""
    fs = FirestoreService()
    ext = request.filename.rsplit(".", 1)[-1] if "." in request.filename else "pptx"

    if LOCAL_UPLOAD_MODE:
        # One-time token plays the role of the signed URL's signature — the
        # browser PUTs the file without an Authorization header.
        upload_token = secrets.token_urlsafe(24)
        lesson_id = await fs.create_lesson({
            "title": request.lessonTitle,
            "subject": request.subject,
            "teacherId": token["uid"],
            "localUploadToken": upload_token,
        })
        return {
            "uploadUrl": str(http_request.url_for("local_upload", lesson_id=lesson_id, ext=ext))
            + f"?token={upload_token}",
            "lessonId": lesson_id,
            "gcsPath": local_upload_path(lesson_id, ext).as_uri(),
        }

    ss = StorageService()

    # Create lesson document
    lesson_id = await fs.create_lesson({
        "title": request.lessonTitle,
        "subject": request.subject,
        "teacherId": token["uid"],
    })

    # Generate GCS path and signed URL
    gcs_path = f"lessons/{lesson_id}/upload.{ext}"
    upload_url = ss.generate_signed_upload_url(gcs_path, request.contentType)

    return {
        "uploadUrl": upload_url,
        "lessonId": lesson_id,
        "gcsPath": f"gs://{ss.bucket.name}/{gcs_path}",
    }


@router.put("/local-upload/{lesson_id}/upload.{ext}", name="local_upload", include_in_schema=False)
async def local_upload(lesson_id: str, ext: str, token: str, http_request: Request):
    """Local-dev stand-in for the GCS signed-URL PUT."""
    if not LOCAL_UPLOAD_MODE:
        raise HTTPException(status_code=404, detail="Not found")
    fs = FirestoreService()
    lesson = await fs.get_lesson(lesson_id)
    if not lesson or not secrets.compare_digest(lesson.get("localUploadToken", ""), token):
        raise HTTPException(status_code=403, detail="Invalid upload token")
    path = local_upload_path(lesson_id, ext)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(await http_request.body())
    return {"status": "uploaded", "bytes": path.stat().st_size}


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
    if request.gcsPath.startswith("file://"):
        # Only accept the exact on-disk location local_upload wrote for this lesson
        ext = request.gcsPath.rsplit(".", 1)[-1]
        if not LOCAL_UPLOAD_MODE or request.gcsPath != local_upload_path(request.lessonId, ext).as_uri():
            raise HTTPException(status_code=400, detail="Invalid upload path")

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


async def _owned_published_lesson(fs: FirestoreService, lesson_id: str, uid: str) -> dict:
    lesson = await fs.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if lesson.get("teacherId") != uid:
        raise HTTPException(status_code=403, detail="Not your lesson")
    if lesson.get("status") != "published":
        raise HTTPException(status_code=400, detail="Publish the lesson before sharing it")
    return lesson


def _join_code_response(info: dict) -> dict:
    return {"code": info["code"], "display": format_code(info["code"]), "enabled": info["enabled"]}


@router.get("/{lesson_id}/join-code")
async def get_join_code(lesson_id: str, token: dict = Depends(verify_firebase_token)):
    """The lesson's student join code — created on first request after publishing."""
    fs = FirestoreService()
    lesson = await _owned_published_lesson(fs, lesson_id, token["uid"])
    return _join_code_response(await fs.ensure_join_code(lesson))


@router.post("/{lesson_id}/join-code/regenerate")
async def regenerate_join_code(lesson_id: str, token: dict = Depends(verify_firebase_token)):
    """Replace the join code (e.g. it leaked). Enrolled students are unaffected."""
    fs = FirestoreService()
    lesson = await _owned_published_lesson(fs, lesson_id, token["uid"])
    return _join_code_response(await fs.ensure_join_code(lesson, regenerate=True))


@router.patch("/{lesson_id}/join-code")
async def update_join_settings(
    lesson_id: str,
    request: JoinSettingsRequest,
    token: dict = Depends(verify_firebase_token),
):
    """Open or close the lesson to new students."""
    fs = FirestoreService()
    lesson = await _owned_published_lesson(fs, lesson_id, token["uid"])
    info = await fs.ensure_join_code(lesson)
    await fs.update_lesson(lesson_id, {"joinEnabled": request.enabled})
    return _join_code_response({**info, "enabled": request.enabled})


@router.get("")
async def list_lessons(token: dict = Depends(verify_firebase_token)):
    """List all lessons for the authenticated teacher."""
    fs = FirestoreService()
    return await fs.get_teacher_lessons(token["uid"])

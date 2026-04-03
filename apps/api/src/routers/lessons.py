"""Lessons router — CRUD for lessons, upload, ingestion triggers."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..services.firestore_service import FirestoreService
from ..services.storage_service import StorageService
from ..services.pubsub_service import PubSubService
from ..middleware.auth import verify_firebase_token

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

    # Publish to ingestion topic
    ps.publish("lesson-ingestion-requests", {
        "lesson_id": request.lessonId,
        "gcs_path": request.gcsPath,
    })

    return {"status": "queued", "lessonId": request.lessonId}


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

"""Internal router — Pub/Sub callbacks (not exposed publicly)."""
import json
import base64
from fastapi import APIRouter, Request
from ..services.firestore_service import FirestoreService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/lesson-complete")
async def lesson_ingestion_complete(request: Request):
    """Pub/Sub push callback when ingestion completes."""
    body = await request.json()
    try:
        pubsub_message = body.get("message", {})
        message_data = base64.b64decode(pubsub_message.get("data", "")).decode("utf-8")
        payload = json.loads(message_data)

        lesson_id = payload.get("lesson_id")
        status = payload.get("status", "complete")

        fs = FirestoreService()
        if status == "complete":
            await fs.update_lesson(lesson_id, {"status": "published"})
            logger.info(f"Lesson {lesson_id} published successfully")
        else:
            await fs.update_lesson(lesson_id, {"status": "failed"})
            logger.error(f"Lesson {lesson_id} ingestion failed")

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing completion: {e}")
        return {"status": "error", "detail": str(e)}

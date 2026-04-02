"""Students router — Enrollment and student management."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..services.firestore_service import FirestoreService
from ..middleware.auth import verify_firebase_token

router = APIRouter()


class EnrollRequest(BaseModel):
    lessonId: str


@router.post("/enroll")
async def enroll_student(
    request: EnrollRequest,
    token: dict = Depends(verify_firebase_token),
):
    """Enroll a student in a lesson."""
    fs = FirestoreService()
    lesson = await fs.get_lesson(request.lessonId)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if lesson.get("status") != "published":
        raise HTTPException(status_code=400, detail="Lesson not published yet")

    enrollment_id = await fs.create_enrollment(token["uid"], request.lessonId)
    return {"enrollmentId": enrollment_id, "status": "active"}


@router.get("/{student_id}/lessons")
async def get_student_lessons(
    student_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Get all enrolled lessons for a student."""
    if token["uid"] != student_id:
        raise HTTPException(status_code=403, detail="Can only view your own enrollments")
    fs = FirestoreService()
    return await fs.get_student_enrollments(student_id)

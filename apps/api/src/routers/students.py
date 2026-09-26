"""Students router — Enrollment and student management."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..services.firestore_service import FirestoreService
from ..services.join_codes import FailedLookupLimiter, normalize_code
from ..middleware.auth import verify_firebase_token

router = APIRouter()

_limiter = FailedLookupLimiter()


class EnrollRequest(BaseModel):
    lessonId: str


class JoinRequest(BaseModel):
    code: str


async def _lesson_for_code(fs: FirestoreService, raw_code: str, uid: str) -> dict:
    """Resolve a typed code to a joinable lesson, or raise a student-readable error."""
    if _limiter.is_blocked(uid):
        raise HTTPException(status_code=429, detail="Too many incorrect codes. Try again in a few minutes.")
    code = normalize_code(raw_code)
    lesson = await fs.resolve_join_code(code) if code else None
    if not lesson:
        _limiter.record_failure(uid)
        raise HTTPException(status_code=404, detail="No lesson found for that code. Check it with your teacher.")
    if lesson.get("status") != "published" or not lesson.get("joinEnabled", True):
        raise HTTPException(status_code=403, detail="This lesson isn't accepting new students right now.")
    return lesson


@router.get("/join/{code}")
async def preview_join(code: str, token: dict = Depends(verify_firebase_token)):
    """What a code points to, so the student can confirm before joining."""
    fs = FirestoreService()
    lesson = await _lesson_for_code(fs, code, token["uid"])
    teacher = await fs.db.collection("users").document(lesson.get("teacherId", "")).get()
    teacher_name = (teacher.to_dict() or {}).get("displayName") if teacher.exists else None
    return {
        "lessonId": lesson["id"],
        "title": lesson.get("title", "Untitled lesson"),
        "subject": lesson.get("subject", ""),
        "subtopicCount": (lesson.get("ingestion") or {}).get("subtopicsFound"),
        "teacherName": teacher_name,
        "alreadyEnrolled": await fs.is_enrolled(token["uid"], lesson["id"]),
    }


@router.post("/join")
async def join_with_code(request: JoinRequest, token: dict = Depends(verify_firebase_token)):
    """Enroll via join code. Idempotent — re-joining keeps the original enrollment."""
    fs = FirestoreService()
    lesson = await _lesson_for_code(fs, request.code, token["uid"])
    if await fs.is_enrolled(token["uid"], lesson["id"]):
        return {"lessonId": lesson["id"], "alreadyEnrolled": True}
    await fs.create_enrollment(token["uid"], lesson["id"])
    return {"lessonId": lesson["id"], "alreadyEnrolled": False}


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
    enrollments = await fs.get_student_enrollments(student_id)
    # Flatten to lesson objects (frontend expects flat list with id, title, subject)
    return [
        {**e["lesson"], "enrolledAt": e["enrollment"].get("enrolledAt")}
        for e in enrollments
        if e.get("lesson")
    ]

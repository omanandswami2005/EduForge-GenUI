"""Analytics router — Teacher class-level analytics."""
import asyncio
from fastapi import APIRouter, Depends
from ..services.firestore_service import FirestoreService
from ..services.teacher_overview import build_teacher_overview
from ..middleware.auth import verify_firebase_token

router = APIRouter()


@router.get("/teacher-overview")
async def get_teacher_overview(token: dict = Depends(verify_firebase_token)):
    """Cross-lesson dashboard stats for the authenticated teacher."""
    fs = FirestoreService()
    lessons = await fs.get_teacher_lessons(token["uid"])
    published = [l["id"] for l in lessons if l.get("status") == "published"]

    classes, insights = await asyncio.gather(
        asyncio.gather(*(fs.get_class_analytics(lid) for lid in published)),
        asyncio.gather(*(fs.get_misconception_insights(lid) for lid in published)),
    )
    return build_teacher_overview(
        lessons,
        dict(zip(published, classes)),
        dict(zip(published, insights)),
    )


@router.get("/class/{lesson_id}")
async def get_class_analytics(
    lesson_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Get class-level BKT aggregates for a lesson (teacher only)."""
    fs = FirestoreService()
    return await fs.get_class_analytics(lesson_id)


@router.get("/misconceptions/{lesson_id}")
async def get_misconception_insights(
    lesson_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Top misconceptions per concept for a lesson, ranked by frequency (teacher only)."""
    fs = FirestoreService()
    return await fs.get_misconception_insights(lesson_id)

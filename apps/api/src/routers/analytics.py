"""Analytics router — Teacher class-level analytics."""
from fastapi import APIRouter, Depends
from ..services.firestore_service import FirestoreService
from ..middleware.auth import verify_firebase_token

router = APIRouter()


@router.get("/class/{lesson_id}")
async def get_class_analytics(
    lesson_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Get class-level BKT aggregates for a lesson (teacher only)."""
    fs = FirestoreService()
    return await fs.get_class_analytics(lesson_id)

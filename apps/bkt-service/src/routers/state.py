"""BKT State Router — Read current BKT state."""
from fastapi import APIRouter, Query
from ..services.firestore_service import FirestoreService

router = APIRouter()


@router.get("/state")
async def get_bkt_state(
    studentId: str = Query(...),
    conceptId: str = Query(...),
):
    """Get current BKT state for a student-concept pair."""
    fs = FirestoreService()
    state = await fs.get_student_concept_state(studentId, conceptId)

    if not state:
        return {
            "student_id": studentId,
            "concept_id": conceptId,
            "p_mastery": 0.2,
            "attempts": 0,
            "mastered": False,
            "consecutive_wrong": 0,
        }

    return {
        "student_id": state.student_id,
        "concept_id": state.concept_id,
        "subtopic_id": state.subtopic_id,
        "lesson_id": state.lesson_id,
        "p_mastery": state.p_mastery,
        "attempts": state.attempts,
        "correct_streak": state.correct_streak,
        "mastered": state.mastered,
        "consecutive_wrong": state.consecutive_wrong,
    }


@router.get("/lesson-states")
async def get_lesson_states(
    studentId: str = Query(...),
    lessonId: str = Query(...),
):
    """Get all BKT states for a student in a lesson."""
    fs = FirestoreService()
    docs = fs.db.collection("bkt_states").document(studentId)\
        .collection("concepts")
    
    results = {}
    async for doc in docs.stream():
        data = doc.to_dict()
        if data.get("lessonId") == lessonId:
            results[doc.id] = {
                "conceptId": doc.id,
                "pMastery": data.get("pMastery", 0.2),
                "mastered": data.get("mastered", False),
                "attempts": data.get("attempts", 0),
            }

    return {"states": results}

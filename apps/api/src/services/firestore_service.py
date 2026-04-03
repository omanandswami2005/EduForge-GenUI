"""Firestore service for API gateway."""
import os
from google.cloud import firestore

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "eduforge-genui-2026")

# Singleton client — created once at import time, reused across all requests
_client: firestore.AsyncClient | None = None


def get_db() -> firestore.AsyncClient:
    global _client
    if _client is None:
        _client = firestore.AsyncClient(project=PROJECT_ID)
    return _client


class FirestoreService:
    def __init__(self):
        self.db = get_db()

    async def create_lesson(self, data: dict) -> str:
        """Create a new lesson document. Returns lesson ID."""
        doc_ref = self.db.collection("lessons").document()
        await doc_ref.set({
            **data,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "status": "draft",
            "ingestion": {"step": "queued", "progress": 0, "message": "Waiting to start..."},
        })
        return doc_ref.id

    async def get_lesson(self, lesson_id: str) -> dict | None:
        doc = await self.db.collection("lessons").document(lesson_id).get()
        if doc.exists:
            return {"id": doc.id, **doc.to_dict()}
        return None

    async def get_teacher_lessons(self, teacher_id: str) -> list[dict]:
        query = self.db.collection("lessons").where("teacherId", "==", teacher_id)
        docs = []
        async for doc in query.stream():
            docs.append({"id": doc.id, **doc.to_dict()})
        return docs

    async def update_lesson(self, lesson_id: str, data: dict):
        await self.db.collection("lessons").document(lesson_id).update(data)

    async def get_subtopics(self, lesson_id: str) -> list[dict]:
        query = self.db.collection("lessons").document(lesson_id)\
            .collection("subtopics").order_by("order")
        docs = []
        async for doc in query.stream():
            docs.append({"id": doc.id, **doc.to_dict()})
        return docs

    async def get_mcqs(self, lesson_id: str, subtopic_id: str) -> list[dict]:
        query = self.db.collection("lessons").document(lesson_id)\
            .collection("mcqs").where("subtopicId", "==", subtopic_id)
        docs = []
        async for doc in query.stream():
            docs.append({"id": doc.id, **doc.to_dict()})
        return docs

    async def create_enrollment(self, student_id: str, lesson_id: str) -> str:
        doc_id = f"{student_id}_{lesson_id}"
        doc_ref = self.db.collection("enrollments").document(doc_id)
        await doc_ref.set({
            "studentId": student_id,
            "lessonId": lesson_id,
            "enrolledAt": firestore.SERVER_TIMESTAMP,
            "status": "active",
        })
        return doc_id

    async def get_student_enrollments(self, student_id: str) -> list[dict]:
        query = self.db.collection("enrollments").where("studentId", "==", student_id)
        docs = []
        async for doc in query.stream():
            data = doc.to_dict()
            lesson = await self.get_lesson(data["lessonId"])
            if lesson:
                docs.append({"enrollment": data, "lesson": lesson})
        return docs

    async def get_class_analytics(self, lesson_id: str) -> dict:
        """Get aggregated BKT states for all students in a lesson."""
        # Query all responses for this lesson
        query = self.db.collection("responses").where("lessonId", "==", lesson_id)
        responses = []
        async for doc in query.stream():
            responses.append(doc.to_dict())

        # Aggregate by student and concept
        student_states: dict[str, dict] = {}
        for r in responses:
            sid = r.get("studentId", "")
            cid = r.get("conceptId", "")
            key = f"{sid}_{cid}"
            student_states[key] = {
                "studentId": sid,
                "conceptId": cid,
                "pMastery": r.get("pMasteryAfter", 0),
                "isCorrect": r.get("isCorrect", False),
            }

        return {
            "totalResponses": len(responses),
            "uniqueStudents": len(set(r.get("studentId") for r in responses)),
            "states": list(student_states.values()),
        }

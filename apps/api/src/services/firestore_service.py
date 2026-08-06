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
        """
        Class mastery matrix for the teacher heatmap: every student enrolled in
        this lesson x every concept they have live BKT state for. Reads current
        mastery directly from bkt_states (the same source the student's own
        mastery HUD reads from), not derived from historical responses.
        """
        enroll_query = self.db.collection("enrollments").where("lessonId", "==", lesson_id)
        student_ids: list[str] = []
        async for doc in enroll_query.stream():
            sid = doc.to_dict().get("studentId")
            if sid:
                student_ids.append(sid)

        students: list[dict] = []
        concept_order: list[str] = []
        seen_concepts: set[str] = set()
        matrix: dict[str, dict[str, dict]] = {}

        for sid in student_ids:
            user_doc = await self.db.collection("users").document(sid).get()
            user_data = user_doc.to_dict() if user_doc.exists else {}
            name = user_data.get("displayName") or user_data.get("email") or sid

            concepts_query = self.db.collection("bkt_states").document(sid).collection("concepts")
            student_matrix: dict[str, dict] = {}
            async for cdoc in concepts_query.stream():
                cdata = cdoc.to_dict()
                if cdata.get("lessonId") != lesson_id:
                    continue
                concept_id = cdata.get("conceptId", cdoc.id)
                student_matrix[concept_id] = {
                    "pMastery": cdata.get("pMastery", 0),
                    "mastered": cdata.get("mastered", False),
                    "attempts": cdata.get("attempts", 0),
                }
                if concept_id not in seen_concepts:
                    seen_concepts.add(concept_id)
                    concept_order.append(concept_id)

            students.append({"id": sid, "name": name})
            matrix[sid] = student_matrix

        return {
            "lessonId": lesson_id,
            "students": students,
            "concepts": concept_order,
            "matrix": matrix,
        }

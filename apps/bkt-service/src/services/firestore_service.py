"""Firestore service for BKT state persistence."""
import os
from google.cloud import firestore
from ..bkt.engine import BKTParams, StudentConceptState

# Use async client if available, sync fallback for local dev
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "eduforge-genui-2026")


class FirestoreService:
    def __init__(self):
        self.db = firestore.AsyncClient(project=PROJECT_ID)

    async def get_bkt_params(self, lesson_id: str, concept_id: str) -> BKTParams:
        """Load BKT params for a concept from Firestore."""
        doc_ref = self.db.collection("lessons").document(lesson_id)\
            .collection("bkt_params").document(concept_id)
        doc = await doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            return BKTParams(
                concept_id=concept_id,
                p_initial=data.get("pInitial", 0.2),
                p_learn=data.get("pLearn", 0.2),
                p_slip=data.get("pSlip", 0.1),
                p_guess=data.get("pGuess", 0.25),
            )
        # Return defaults if not found
        return BKTParams(concept_id=concept_id)

    async def get_student_concept_state(
        self, student_id: str, concept_id: str
    ) -> StudentConceptState | None:
        """Load current BKT state for a student-concept pair."""
        doc_ref = self.db.collection("bkt_states").document(student_id)\
            .collection("concepts").document(concept_id)
        doc = await doc_ref.get()

        if not doc.exists:
            return None

        data = doc.to_dict()
        return StudentConceptState(
            student_id=student_id,
            concept_id=concept_id,
            subtopic_id=data.get("subtopicId", ""),
            lesson_id=data.get("lessonId", ""),
            p_mastery=data.get("pMastery", 0.2),
            attempts=data.get("attempts", 0),
            correct_streak=data.get("correctStreak", 0),
            mastered=data.get("mastered", False),
            consecutive_wrong=data.get("consecutiveWrong", 0),
            response_history=data.get("responseHistory", []),
        )

    async def save_student_concept_state(self, state: StudentConceptState):
        """Persist updated BKT state to Firestore."""
        doc_ref = self.db.collection("bkt_states").document(state.student_id)\
            .collection("concepts").document(state.concept_id)
        await doc_ref.set({
            "studentId": state.student_id,
            "conceptId": state.concept_id,
            "subtopicId": state.subtopic_id,
            "lessonId": state.lesson_id,
            "pMastery": state.p_mastery,
            "attempts": state.attempts,
            "correctStreak": state.correct_streak,
            "mastered": state.mastered,
            "consecutiveWrong": state.consecutive_wrong,
            "responseHistory": state.response_history[-20:],
            "lastUpdated": firestore.SERVER_TIMESTAMP,
        }, merge=True)

    async def record_mcq_response(self, data: dict):
        """Record an MCQ response for analytics."""
        await self.db.collection("responses").add({
            **data,
            "answeredAt": firestore.SERVER_TIMESTAMP,
        })

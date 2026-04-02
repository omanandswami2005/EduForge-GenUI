"""Firestore service for the ingestion pipeline."""
from google.cloud import firestore
from datetime import datetime
import structlog

logger = structlog.get_logger()


class IngestionFirestoreService:
    def __init__(self):
        self.db = firestore.AsyncClient()

    async def update_ingestion_status(
        self, lesson_id: str, step: str, progress: int, message: str, **extra
    ):
        """Update the ingestion status on the lesson document."""
        update = {
            "ingestion.step": step,
            "ingestion.progress": progress,
            "ingestion.message": message,
        }
        for k, v in extra.items():
            update[f"ingestion.{k}"] = v

        await self.db.collection("lessons").document(lesson_id).update(update)
        logger.info("ingestion_status_updated", lesson_id=lesson_id, step=step, progress=progress)

    async def save_subtopics(self, lesson_id: str, subtopics: list[dict]) -> list[str]:
        """Save subtopics as subcollection documents. Returns list of generated IDs."""
        ids = []
        batch = self.db.batch()
        for st in subtopics:
            ref = self.db.collection("lessons").document(lesson_id).collection("subtopics").document()
            st_data = {**st, "createdAt": datetime.utcnow()}
            # Convert prerequisiteSubtopicOrders to prerequisiteSubtopicIds later
            batch.set(ref, st_data)
            ids.append(ref.id)
        await batch.commit()
        logger.info("subtopics_saved", lesson_id=lesson_id, count=len(ids))
        return ids

    async def save_mcqs(self, lesson_id: str, subtopic_id: str, mcqs: list[dict]):
        """Save MCQs as subcollection of the lesson."""
        batch = self.db.batch()
        for mcq in mcqs:
            ref = self.db.collection("lessons").document(lesson_id).collection("mcqs").document()
            mcq_data = {
                **mcq,
                "subtopicId": subtopic_id,
                "createdAt": datetime.utcnow(),
            }
            batch.set(ref, mcq_data)
        await batch.commit()
        logger.info("mcqs_saved", lesson_id=lesson_id, subtopic_id=subtopic_id, count=len(mcqs))

    async def save_bkt_params(self, lesson_id: str, subtopic_id: str, params: list[dict]):
        """Save BKT parameters as subcollection of the lesson."""
        batch = self.db.batch()
        for p in params:
            concept_id = p["concept_id"]
            ref = (
                self.db.collection("lessons")
                .document(lesson_id)
                .collection("bkt_params")
                .document(concept_id)
            )
            param_data = {
                "conceptId": concept_id,
                "conceptLabel": p.get("concept_label", concept_id),
                "subtopicId": subtopic_id,
                "pInitial": p["p_initial"],
                "pLearn": p["p_learn"],
                "pSlip": p["p_slip"],
                "pGuess": p["p_guess"],
                "createdAt": datetime.utcnow(),
            }
            batch.set(ref, param_data)
        await batch.commit()
        logger.info("bkt_params_saved", lesson_id=lesson_id, subtopic_id=subtopic_id, count=len(params))

    async def mark_lesson_published(self, lesson_id: str, subtopics_count: int, mcqs_count: int):
        """Mark lesson as published after successful ingestion."""
        await self.db.collection("lessons").document(lesson_id).update({
            "status": "published",
            "publishedAt": datetime.utcnow(),
            "ingestion.step": "complete",
            "ingestion.progress": 100,
            "ingestion.message": "Lesson ready!",
            "ingestion.subtopicsFound": subtopics_count,
            "ingestion.mcqsGenerated": mcqs_count,
        })
        logger.info("lesson_published", lesson_id=lesson_id)

"""Ingestion trigger router — receives Pub/Sub push and runs the full pipeline."""
import json
import base64
import asyncio
import traceback
from fastapi import APIRouter, Request
from ..extractors.pptx_extractor import PPTXExtractor
from ..generators.topic_hierarchy import TopicHierarchyGenerator
from ..generators.mcq_generator import MCQGenerator
from ..generators.bkt_params import BKTParamsGenerator
from ..services.firestore_service import IngestionFirestoreService
from ..services.storage_service import StorageService
from ..services.pubsub_service import PubSubService
import os
import structlog

logger = structlog.get_logger()

router = APIRouter()

ASSETS_BUCKET = os.environ.get("LESSON_ASSETS_BUCKET", "eduforge-genui-2026-lesson-assets")


@router.post("/trigger")
async def trigger_ingestion(request: Request):
    """
    Pub/Sub push endpoint. Receives a message with lesson_id and gcs_path,
    then runs the full ingestion pipeline:
    1. Download PPTX from GCS
    2. Extract slides (text + images)
    3. Generate topic hierarchy via Gemini
    4. Generate MCQs per subtopic via Gemini
    5. Generate BKT params per concept via Gemini
    6. Save everything to Firestore
    7. Publish completion notification
    """
    body = await request.json()

    # Parse Pub/Sub message
    pubsub_message = body.get("message", {})
    message_data = base64.b64decode(pubsub_message.get("data", "")).decode("utf-8")
    payload = json.loads(message_data)

    lesson_id = payload["lesson_id"]
    gcs_path = payload["gcs_path"]

    logger.info("ingestion_started", lesson_id=lesson_id, gcs_path=gcs_path)

    fs = IngestionFirestoreService()
    pubsub = PubSubService()

    try:
        # Fetch lesson title from Firestore
        lesson_doc = await fs.db.collection("lessons").document(lesson_id).get()
        lesson_title = lesson_doc.to_dict().get("title", "Untitled Lesson") if lesson_doc.exists else "Untitled Lesson"
        # Step 1: Download PPTX
        await fs.update_ingestion_status(lesson_id, "extracting", 10, "Downloading presentation...")
        storage_svc = StorageService()
        pptx_bytes = storage_svc.download_pptx(gcs_path)

        # Step 2: Extract slides
        await fs.update_ingestion_status(lesson_id, "extracting", 20, "Extracting slide content...")
        extractor = PPTXExtractor(ASSETS_BUCKET)
        slides_data = extractor.extract(pptx_bytes, lesson_id)
        logger.info("slides_extracted", lesson_id=lesson_id, count=len(slides_data))

        # Step 3: Generate topic hierarchy
        await fs.update_ingestion_status(lesson_id, "generating_topics", 35, "Analyzing topics with AI...")
        topic_gen = TopicHierarchyGenerator()
        subtopics_raw = await topic_gen.generate(slides_data, lesson_title)

        # Save subtopics and get IDs
        await fs.update_ingestion_status(lesson_id, "generating_topics", 45, "Saving topic structure...")
        subtopic_ids = await fs.save_subtopics(lesson_id, subtopics_raw)

        # Map order to IDs for prerequisite resolution
        order_to_id = {}
        for st_raw, st_id in zip(subtopics_raw, subtopic_ids):
            order_to_id[st_raw["order"]] = st_id

        # Step 4: Generate MCQs for each subtopic (parallel)
        await fs.update_ingestion_status(lesson_id, "generating_mcqs", 55, "Generating assessment questions...")
        mcq_gen = MCQGenerator()
        total_mcqs = 0

        mcq_tasks = []
        for st_raw, st_id in zip(subtopics_raw, subtopic_ids):
            # Get relevant slides content
            slide_nums = st_raw.get("slideNumbers", [])
            relevant_content = "\n".join(
                s["text_content"] for s in slides_data if s["slide_number"] in slide_nums
            )
            mcq_tasks.append((st_raw, st_id, relevant_content))

        for idx, (st_raw, st_id, content) in enumerate(mcq_tasks):
            progress = 55 + int((idx / len(mcq_tasks)) * 20)
            await fs.update_ingestion_status(
                lesson_id,
                "generating_mcqs",
                progress,
                f"Generating MCQs for: {st_raw['title']}...",
            )
            mcqs = await mcq_gen.generate(st_raw, content)
            await fs.save_mcqs(lesson_id, st_id, mcqs)
            total_mcqs += len(mcqs)

        # Step 5: Generate BKT parameters
        await fs.update_ingestion_status(lesson_id, "generating_bkt", 80, "Calibrating knowledge model...")
        bkt_gen = BKTParamsGenerator()

        for st_raw, st_id in zip(subtopics_raw, subtopic_ids):
            concepts = st_raw.get("keyConcepts", [])
            if concepts:
                params = await bkt_gen.generate(st_raw, concepts)
                await fs.save_bkt_params(lesson_id, st_id, params)

        # Step 6: Mark lesson published
        await fs.mark_lesson_published(lesson_id, len(subtopics_raw), total_mcqs)

        # Step 7: Notify completion
        pubsub.publish_completion(lesson_id, "complete")

        logger.info(
            "ingestion_complete",
            lesson_id=lesson_id,
            subtopics=len(subtopics_raw),
            mcqs=total_mcqs,
        )

        return {"status": "ok", "subtopics": len(subtopics_raw), "mcqs": total_mcqs}

    except Exception as e:
        logger.error("ingestion_failed", lesson_id=lesson_id, error=str(e), traceback=traceback.format_exc())
        await fs.update_ingestion_status(lesson_id, "failed", 0, f"Ingestion failed: {str(e)}", error=str(e))
        pubsub.publish_completion(lesson_id, "failed")
        return {"status": "error", "detail": str(e)}

"""Pub/Sub service for publishing completion notifications."""
import json
from google.cloud import pubsub_v1
import os
import structlog

logger = structlog.get_logger()

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "")


class PubSubService:
    def __init__(self):
        self.publisher = pubsub_v1.PublisherClient()

    def publish_completion(self, lesson_id: str, status: str = "complete"):
        """Publish ingestion completion message to lesson-complete topic."""
        topic_path = self.publisher.topic_path(PROJECT_ID, "lesson-ingestion-complete")
        message = json.dumps({"lesson_id": lesson_id, "status": status})
        future = self.publisher.publish(topic_path, message.encode("utf-8"))
        result = future.result()
        logger.info("completion_published", lesson_id=lesson_id, status=status, message_id=result)

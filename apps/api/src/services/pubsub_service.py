"""Pub/Sub service for publishing messages."""
import os
import json
from google.cloud import pubsub_v1

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "eduforge-genui-2026")


class PubSubService:
    def __init__(self):
        self.publisher = pubsub_v1.PublisherClient()

    def publish(self, topic_name: str, data: dict):
        """Publish a message to a Pub/Sub topic."""
        topic_path = self.publisher.topic_path(PROJECT_ID, topic_name)
        message_bytes = json.dumps(data).encode("utf-8")
        future = self.publisher.publish(topic_path, message_bytes)
        return future.result()

"""Storage service for GCS operations."""
import os
import datetime
from google.cloud import storage

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "eduforge-genui-2026")
UPLOAD_BUCKET = os.environ.get("UPLOAD_BUCKET", f"{PROJECT_ID}-lesson-uploads")


class StorageService:
    def __init__(self):
        self.client = storage.Client(project=PROJECT_ID)
        self.bucket = self.client.bucket(UPLOAD_BUCKET)

    def generate_signed_upload_url(self, blob_name: str, content_type: str) -> str:
        """Generate a signed URL for direct file upload to GCS."""
        blob = self.bucket.blob(blob_name)
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(hours=1),
            method="PUT",
            content_type=content_type,
        )
        return url

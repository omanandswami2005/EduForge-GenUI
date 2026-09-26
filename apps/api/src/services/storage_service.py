"""Storage service for GCS operations."""
import os
import datetime
from pathlib import Path
from google.cloud import storage

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "eduforge-genui-2026")
UPLOAD_BUCKET = os.environ.get("UPLOAD_BUCKET", f"{PROJECT_ID}-lesson-uploads")

# Local dev (Firebase emulators) has no service-account key, so GCS signed URLs
# can't be generated. In that mode uploads go to a directory on disk instead,
# via PUT /lessons/local-upload/... on this service, and ingestion reads the
# resulting file:// path directly.
LOCAL_UPLOAD_MODE = bool(os.environ.get("LOCAL_UPLOAD_DIR") or os.environ.get("FIRESTORE_EMULATOR_HOST"))
LOCAL_UPLOAD_DIR = Path(
    os.environ.get("LOCAL_UPLOAD_DIR")
    or Path(__file__).resolve().parents[4] / ".local-uploads"
)


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


def local_upload_path(lesson_id: str, ext: str) -> Path:
    """Where a local-mode upload for this lesson lives on disk."""
    return LOCAL_UPLOAD_DIR / "lessons" / lesson_id / f"upload.{ext}"

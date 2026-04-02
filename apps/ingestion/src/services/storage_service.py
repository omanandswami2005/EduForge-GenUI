"""GCS service for downloading uploaded PPTX files."""
from google.cloud import storage
import structlog

logger = structlog.get_logger()


class StorageService:
    def __init__(self):
        self.client = storage.Client()

    def download_pptx(self, gcs_path: str) -> bytes:
        """Download a PPTX from GCS. gcs_path format: gs://bucket/path/to/file.pptx"""
        if gcs_path.startswith("gs://"):
            gcs_path = gcs_path[5:]
        bucket_name, blob_path = gcs_path.split("/", 1)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        data = blob.download_as_bytes()
        logger.info("pptx_downloaded", bucket=bucket_name, path=blob_path, size_bytes=len(data))
        return data

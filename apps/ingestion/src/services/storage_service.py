"""GCS service for downloading uploaded PPTX files."""
from pathlib import Path
from urllib.parse import urlparse, unquote
from google.cloud import storage
import structlog

logger = structlog.get_logger()


class StorageService:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = storage.Client()
        return self._client

    def download_pptx(self, gcs_path: str) -> bytes:
        """Download a PPTX from GCS. gcs_path format: gs://bucket/path/to/file.pptx

        Local dev uploads (API gateway LOCAL_UPLOAD_MODE) arrive as file:// URIs.
        """
        if gcs_path.startswith("file://"):
            data = Path(unquote(urlparse(gcs_path).path)).read_bytes()
            logger.info("pptx_loaded_local", path=gcs_path, size_bytes=len(data))
            return data
        if gcs_path.startswith("gs://"):
            gcs_path = gcs_path[5:]
        bucket_name, blob_path = gcs_path.split("/", 1)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        data = blob.download_as_bytes()
        logger.info("pptx_downloaded", bucket=bucket_name, path=blob_path, size_bytes=len(data))
        return data

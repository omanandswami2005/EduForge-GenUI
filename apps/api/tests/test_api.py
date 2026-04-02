"""
Tests for the API gateway — endpoint structure and request validation.
These tests use FastAPI's TestClient to test routes without Firestore.
"""
import sys
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

# Pre-mock all GCP/Firebase modules before any imports
mock_modules = {
    "google": MagicMock(),
    "google.cloud": MagicMock(),
    "google.cloud.firestore": MagicMock(),
    "google.cloud.storage": MagicMock(),
    "google.cloud.pubsub_v1": MagicMock(),
    "firebase_admin": MagicMock(_apps={"default": True}),
    "firebase_admin.auth": MagicMock(),
    "firebase_admin.credentials": MagicMock(),
}

for mod_name, mock_obj in mock_modules.items():
    sys.modules[mod_name] = mock_obj

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_check(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "eduforge-api"


class TestAPIRouteStructure:
    def test_lessons_requires_auth(self):
        resp = client.get("/lessons/")
        assert resp.status_code == 401 or resp.status_code == 403

    def test_upload_url_requires_auth(self):
        resp = client.post("/lessons/upload-url", json={
            "filename": "test.pptx",
            "contentType": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "lessonTitle": "Test Lesson",
            "subject": "Math",
        })
        assert resp.status_code == 401 or resp.status_code == 403

    def test_enroll_requires_auth(self):
        resp = client.post("/students/enroll", json={"lessonId": "test123"})
        assert resp.status_code == 401 or resp.status_code == 403

    def test_bkt_proxy_requires_auth(self):
        resp = client.get("/bkt/state", params={"studentId": "s1", "conceptId": "c1"})
        assert resp.status_code == 401 or resp.status_code == 403

    def test_analytics_requires_auth(self):
        resp = client.get("/analytics/class/lesson123")
        assert resp.status_code == 401 or resp.status_code == 403

    def test_internal_endpoint_no_auth(self):
        """Internal Pub/Sub endpoint does not require auth."""
        resp = client.post("/internal/lesson-complete", json={"message": {"data": ""}})
        # Won't crash — just handles empty message gracefully
        assert resp.status_code == 200


class TestTimingHeader:
    def test_response_has_timing_header(self):
        resp = client.get("/health")
        assert "X-Process-Time" in resp.headers

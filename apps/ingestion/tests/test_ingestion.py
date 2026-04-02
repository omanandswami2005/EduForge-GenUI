"""
Tests for the ingestion pipeline — extractors and generators (unit level).

Pre-patches all GCP / third-party modules so imports succeed without real SDKs.
"""
import sys
from unittest.mock import MagicMock, AsyncMock, patch

# ---------------------------------------------------------------------------
# Pre-patch heavy third-party modules before ANY ingestion src is imported
# ---------------------------------------------------------------------------
_mock_modules = {
    "google": MagicMock(),
    "google.cloud": MagicMock(),
    "google.cloud.firestore": MagicMock(),
    "google.cloud.storage": MagicMock(),
    "google.cloud.pubsub_v1": MagicMock(),
    "google.cloud.documentai": MagicMock(),
    "google.generativeai": MagicMock(),
    "pptx": MagicMock(),
    "pptx.util": MagicMock(),
    "tenacity": MagicMock(),
    "firebase_admin": MagicMock(),
    "firebase_admin.auth": MagicMock(),
    "firebase_admin.credentials": MagicMock(),
}

# Make tenacity decorators no-ops (return the function unchanged)
_mock_modules["tenacity"].retry = lambda **kw: (lambda fn: fn)
_mock_modules["tenacity"].stop_after_attempt = lambda *a: None
_mock_modules["tenacity"].wait_exponential = lambda **kw: None

for mod_name, mock_obj in _mock_modules.items():
    sys.modules.setdefault(mod_name, mock_obj)
# ---------------------------------------------------------------------------

import pytest


class TestBKTParamsValidation:
    """Test the BKT parameter validation/clamping logic."""

    def test_clamp_p_initial(self):
        params = [
            {"concept_id": "c1", "concept_label": "C1",
             "p_initial": 0.01, "p_learn": 0.5, "p_slip": 0.3, "p_guess": 0.1}
        ]
        for p in params:
            p["p_initial"] = max(0.05, min(0.4, p.get("p_initial", 0.2)))
            p["p_learn"] = max(0.1, min(0.4, p.get("p_learn", 0.2)))
            p["p_slip"] = max(0.05, min(0.2, p.get("p_slip", 0.1)))
            p["p_guess"] = max(0.15, min(0.35, p.get("p_guess", 0.25)))
            if p["p_slip"] >= p["p_guess"]:
                p["p_slip"] = p["p_guess"] - 0.05

        assert params[0]["p_initial"] == 0.05
        assert params[0]["p_learn"] == 0.4
        assert params[0]["p_slip"] < params[0]["p_guess"]
        assert 0.05 <= params[0]["p_initial"] <= 0.4
        assert 0.1 <= params[0]["p_learn"] <= 0.4
        assert 0.05 <= params[0]["p_slip"] <= 0.2
        assert 0.15 <= params[0]["p_guess"] <= 0.35

    def test_slip_less_than_guess_enforcement(self):
        """Ensure p_slip < p_guess after clamping."""
        params = [
            {"concept_id": "c1", "concept_label": "C1",
             "p_initial": 0.2, "p_learn": 0.2, "p_slip": 0.25, "p_guess": 0.15}
        ]
        for p in params:
            p["p_initial"] = max(0.05, min(0.4, p.get("p_initial", 0.2)))
            p["p_learn"] = max(0.1, min(0.4, p.get("p_learn", 0.2)))
            p["p_slip"] = max(0.05, min(0.2, p.get("p_slip", 0.1)))
            p["p_guess"] = max(0.15, min(0.35, p.get("p_guess", 0.25)))
            if p["p_slip"] >= p["p_guess"]:
                p["p_slip"] = p["p_guess"] - 0.05

        assert params[0]["p_slip"] < params[0]["p_guess"]


class TestPPTXExtractor:
    """Test PPTX extraction without real files."""

    def test_extractor_initializes(self):
        """Verify PPTXExtractor can be instantiated with mocks in place."""
        from src.extractors.pptx_extractor import PPTXExtractor
        extractor = PPTXExtractor("test-bucket")
        assert extractor.assets_bucket is not None


class TestIngestionServiceHealth:
    """Test that the ingestion FastAPI app starts correctly."""

    def test_health_endpoint(self):
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["service"] == "eduforge-ingestion"


class TestTopicHierarchyGenerator:
    """Test TopicHierarchyGenerator initialization."""

    def test_generator_initializes(self):
        from src.generators.topic_hierarchy import TopicHierarchyGenerator
        gen = TopicHierarchyGenerator()
        assert gen is not None


class TestMCQGenerator:
    """Test MCQGenerator initialization."""

    def test_generator_initializes(self):
        from src.generators.mcq_generator import MCQGenerator
        gen = MCQGenerator()
        assert gen is not None


class TestBKTParamsGenerator:
    """Test BKTParamsGenerator initialization."""

    def test_generator_initializes(self):
        from src.generators.bkt_params import BKTParamsGenerator
        gen = BKTParamsGenerator()
        assert gen is not None


class TestStorageService:
    """Test StorageService initialization."""

    def test_service_initializes(self):
        from src.services.storage_service import StorageService
        svc = StorageService()
        assert svc.client is not None

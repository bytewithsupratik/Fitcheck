# apps/intelligence/tests/ade/test_ade_api.py
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.ade.persistence.repository import ade_repository

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean():
    ade_repository.clear()
    yield


def test_ade_api_lifecycle():
    event_payload = {
        "event": {
            "event_id": "EVT-API-01",
            "event_type": "REQUIREMENTS_CHANGED",
            "schema_version": "1.0",
            "producer": "CIE",
            "learner_id": "USR-API-1",
            "occurred_at": "2026-09-20T12:00:00Z",
            "correlation_id": "CORR-API-1",
            "data": {"requirements_changed": True}
        }
    }

    # 1. POST /events
    res = client.post("/api/v1/ade/events", json=event_payload)
    assert res.status_code == 200
    dec = res.json()
    dec_id = dec["decision_id"]
    assert dec["status"] == "APPROVAL_PENDING"

    # 2. GET /decisions/{id}
    get_res = client.get(f"/api/v1/ade/decisions/{dec_id}")
    assert get_res.status_code == 200

    # 3. GET /learners/{id}/decisions
    list_res = client.get("/api/v1/ade/learners/USR-API-1/decisions")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 4. POST /decisions/{id}/approve
    app_res = client.post(f"/api/v1/ade/decisions/{dec_id}/approve")
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "COMPLETED"
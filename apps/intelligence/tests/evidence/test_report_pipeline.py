# apps/intelligence/tests/test_report_pipeline.py
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_project_report_evaluation_with_page_provenance():
    """
    Verifies that a multi-page technical report:
    1. Segments into pages and technical facts
    2. Cites exact page numbers in the provenance audit trail
    3. Evaluates matching canonical capabilities correctly
    """
    report_pages = [
        {
            "page_number": 1,
            "text": "Executive Summary: This document details the architectural implementation of our e-commerce platform."
        },
        {
            "page_number": 2,
            "text": "Database Architecture: We selected PostgreSQL as our relational database to guarantee ACID compliance. The SQL schema includes partitioned tables and indices for high concurrency."
        },
        {
            "page_number": 3,
            "text": "Containerization and Deployment: The entire system was packaged using Docker and Dockerfile multi-stage builds to optimize image size."
        }
    ]

    full_text = "\n".join([p["text"] for p in report_pages])

    request_payload = {
        "evidence_id": "EV_REP_ARCHITECTURE_01",
        "user_id": "USR_SANKA_77",
        "title": "Final Architecture Report",
        "report_text": full_text,
        "pages": report_pages,
        "allowed_capabilities": [
            {
                "capability_id": "CAP-POSTGRESQL",
                "name": "PostgreSQL Database",
                "category": "DATABASE",
                "description": "Relational database integration and SQL schema design."
            },
            {
                "capability_id": "CAP-DOCKER",
                "name": "Docker Containerization",
                "category": "DEVOPS",
                "description": "Container packaging and Dockerfile optimization."
            }
        ]
    }

    response = client.post("/api/v1/evidence/evaluate/report", json=request_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["sections_and_facts_count"] > 0

    event = data["event"]
    assert event["event_type"] == "EVIDENCE_EVALUATED"
    assert event["data"]["provenance"]["evidence_type"] == "project_report"

    # Verify evaluated capabilities
    cap_ids = [c["capability_id"] for c in event["data"]["capabilities"]]
    assert "CAP-POSTGRESQL" in cap_ids
    assert "CAP-DOCKER" in cap_ids

    # Verify that the audit trail preserves exact page numbers (Section 16 Provenance)
    audit_chain = event["data"]["provenance"]["audit_chain"]
    locations = [entry["source_location"] for entry in audit_chain]
    assert any("page: 2" in loc for loc in locations)  # PostgreSQL was on page 2
    assert any("page: 3" in loc for loc in locations)  # Docker was on page 3


def test_rejects_insufficient_report():
    """Verifies that an empty or too-short report returns EVIDENCE_INSUFFICIENT."""
    request_payload = {
        "evidence_id": "EV_REP_EMPTY",
        "user_id": "USR_01",
        "title": "Short Note",
        "report_text": "Too short to evaluate"
    }

    response = client.post("/api/v1/evidence/evaluate/report", json=request_payload)
    assert response.status_code == 400
    assert response.json()["detail"]["error_code"] == "EVIDENCE_INSUFFICIENT"
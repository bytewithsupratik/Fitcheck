# apps/intelligence/tests/test_assessment_pipeline.py
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_assessment_pipeline_with_question_provenance():
    """
    Verifies Phase 3:
    1. Evaluates individual question-level results.
    2. Cites question_id in provenance audit chain (Section 16 & 24).
    3. Emits compliant CIG event payload.
    """
    questions_payload = [
        {
            "question_id": "Q17",
            "topic": "postgresql",
            "question_text": "How do indexes optimize B-Tree lookups in PostgreSQL?",
            "is_correct": True,
            "score": 1.0,
            "max_score": 1.0
        },
        {
            "question_id": "Q18",
            "topic": "postgresql",
            "question_text": "Explain PostgreSQL connection pooling with pgBouncer.",
            "is_correct": True,
            "score": 1.0,
            "max_score": 1.0
        },
        {
            "question_id": "Q25",
            "topic": "express",
            "question_text": "What is the role of error-handling middleware in Express?",
            "is_correct": True,
            "score": 1.0,
            "max_score": 1.0
        }
    ]

    request_payload = {
        "evidence_id": "EV_ASM_NODE_01",
        "user_id": "USR_SANKA_99",
        "assessment_id": "ASM_BACKEND_MIDTERM",
        "title": "Backend Engineering Certification Assessment",
        "questions": questions_payload,
        "allowed_capabilities": [
            {
                "capability_id": "CAP-POSTGRESQL",
                "name": "PostgreSQL Database",
                "category": "DATABASE",
                "description": "Relational queries, indices, and performance."
            },
            {
                "capability_id": "CAP-EXPRESS",
                "name": "Express.js Framework",
                "category": "BACKEND",
                "description": "Express middleware and HTTP routing."
            }
        ]
    }

    response = client.post("/api/v1/evidence/evaluate/assessment", json=request_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["questions_evaluated"] == 3

    event = data["event"]
    assert event["event_type"] == "EVIDENCE_EVALUATED"
    assert event["data"]["provenance"]["evidence_type"] == "assessment_result"
    assert event["data"]["provenance"]["source_reference"] == "ASM_BACKEND_MIDTERM"

    # Verify both capabilities evaluated
    cap_ids = [c["capability_id"] for c in event["data"]["capabilities"]]
    assert "CAP-POSTGRESQL" in cap_ids
    assert "CAP-EXPRESS" in cap_ids

    # Verify Question-Level Provenance (Section 16: "question_id = Q17")
    audit_chain = event["data"]["provenance"]["audit_chain"]
    locations = [entry["source_location"] for entry in audit_chain]
    assert any("question_id: 'Q17'" in loc or "topic_aggregate: 'postgresql'" in loc for loc in locations)
    assert any("question_id: 'Q25'" in loc or "topic_aggregate: 'express'" in loc for loc in locations)
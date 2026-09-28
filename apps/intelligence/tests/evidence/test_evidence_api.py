# apps/intelligence/tests/test_evidence_api.py
import sys
from pathlib import Path

# Injects apps/intelligence into Python search path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from src.main import app
from src.evidence.schemas import (
    AIEvaluationResponseDTO,
    AIClaimDTO,
    AICapabilityEvaluationDTO,
    ProjectClassification,
    ProficiencyLevel,
    MasteryLevel,
    EvidenceStrengthLevel
)

client = TestClient(app)


def test_health_endpoint():
    """Verifies that the EIE service health check responds with 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["service"] == "CareerOS-Intelligence-Suite"


@patch("src.evidence.engine.EIEIntelligenceEngine._call_llm")
def test_evaluate_evidence_endpoint_success(mock_call_llm):
    """
    Verifies POST /api/v1/evidence/evaluate:
    Sends raw observations and confirms grounded capability evaluation response.
    """
    mock_call_llm.return_value = AIEvaluationResponseDTO(
        classification=ProjectClassification(),
        overall_confidence=0.88,
        claims=[
            AIClaimDTO(
                temp_claim_id="TMP_CLM_EXP_01",
                capability_id="CAP-EXPRESS",
                statement="Evidence demonstrates verified usage of Express.js Framework based on 'express'.",
                supporting_observation_ids=["OBS_EXPRESS_01"],
                confidence=0.88
            )
        ],
        capability_evaluations=[
            AICapabilityEvaluationDTO(
                capability_id="CAP-EXPRESS",
                proficiency=ProficiencyLevel.PROFICIENT,
                mastery=MasteryLevel.DEMONSTRATED,
                evidence_strength=EvidenceStrengthLevel.STRONG,
                confidence=0.88,
                supporting_temp_claim_ids=["TMP_CLM_EXP_01"],
                supporting_observation_ids=["OBS_EXPRESS_01"]
            )
        ]
    )

    payload = {
        "evidence_id": "EV_API_TEST_001",
        "observations": [
            {
                "observation_id": "OBS_EXPRESS_01",
                "evidence_id": "EV_API_TEST_001",
                "category": "DEPENDENCY",
                "name": "express",
                "value": "4.19.2",
                "source_location": "package.json:dependencies.express",
                "verified": True
            }
        ],
        "allowed_capabilities": [
            {
                "capability_id": "CAP-EXPRESS",
                "name": "Express.js Framework",
                "category": "BACKEND",
                "description": "Building server applications with Express."
            }
        ]
    }

    response = client.post("/api/v1/evidence/evaluate", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert data["evidence_id"] == "EV_API_TEST_001"
    
    evaluation = data["evaluation"]
    assert evaluation["overall_confidence"] > 0.0
    assert len(evaluation["claims"]) == 1
    assert evaluation["claims"][0]["capability_id"] == "CAP-EXPRESS"
    assert "OBS_EXPRESS_01" in evaluation["claims"][0]["supporting_observation_ids"]
    assert evaluation["capability_evaluations"][0]["capability_id"] == "CAP-EXPRESS"
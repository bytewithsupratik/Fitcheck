# apps/intelligence/tests/test_github_pipeline.py
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


@patch("src.evidence.engine.EIEIntelligenceEngine._call_llm")
@patch("src.evidence.github_analyzer.httpx.Client")
def test_github_pipeline_golden_path(mock_httpx_cls, mock_call_llm):
    """
    Tests complete Golden Path deterministically:
    GitHub URL -> Deterministic Analyzer -> Observations -> AI Engine -> CIG Event
    """
    mock_client = MagicMock()
    mock_httpx_cls.return_value = mock_client

    # 1. Mock Repo details
    mock_repo_resp = MagicMock()
    mock_repo_resp.status_code = 200
    mock_repo_resp.json.return_value = {
        "owner": {"login": "testuser"},
        "name": "sample-backend",
        "default_branch": "main",
        "language": "JavaScript"
    }

    # 2. Mock Tree inspection (has package.json and test file)
    mock_tree_resp = MagicMock()
    mock_tree_resp.status_code = 200
    mock_tree_resp.json.return_value = {
        "tree": [
            {"path": "package.json", "type": "blob"},
            {"path": "tests/user.test.js", "type": "blob"},
            {"path": "README.md", "type": "blob"}
        ]
    }

    # 3. Mock package.json content (Express and PG dependencies)
    import base64
    pkg_payload = '{"dependencies": {"express": "^4.19.2", "pg": "^8.11.3"}}'
    mock_content_resp = MagicMock()
    mock_content_resp.status_code = 200
    mock_content_resp.json.return_value = {
        "encoding": "base64",
        "content": base64.b64encode(pkg_payload.encode()).decode()
    }

    mock_client.get.side_effect = [
        mock_repo_resp,
        mock_tree_resp,
        mock_content_resp,
        MagicMock(status_code=404)  # For README content mock
    ]

    # 4. Mock the LLM output so the test is hermetic, instantaneous, and grounded
    from src.evidence.schemas import (
        AIEvaluationResponseDTO,
        AIClaimDTO,
        AICapabilityEvaluationDTO,
        ProjectClassification,
        ProficiencyLevel,
        MasteryLevel,
        EvidenceStrengthLevel
    )

    mock_call_llm.return_value = AIEvaluationResponseDTO(
        classification=ProjectClassification(),
        overall_confidence=0.88,
        claims=[
            AIClaimDTO(
                temp_claim_id="TMP_01",
                capability_id="CAP-EXPRESS",
                statement="Verified usage of Express framework.",
                supporting_observation_ids=["OBS_DEP_express"],
                confidence=0.88
            ),
            AIClaimDTO(
                temp_claim_id="TMP_02",
                capability_id="CAP-POSTGRESQL",
                statement="Verified usage of PostgreSQL client library.",
                supporting_observation_ids=["OBS_DEP_pg"],
                confidence=0.85
            )
        ],
        capability_evaluations=[
            AICapabilityEvaluationDTO(
                capability_id="CAP-EXPRESS",
                proficiency=ProficiencyLevel.PROFICIENT,
                mastery=MasteryLevel.DEMONSTRATED,
                evidence_strength=EvidenceStrengthLevel.STRONG,
                confidence=0.88,
                supporting_temp_claim_ids=["TMP_01"],
                supporting_observation_ids=["OBS_DEP_express"]
            ),
            AICapabilityEvaluationDTO(
                capability_id="CAP-POSTGRESQL",
                proficiency=ProficiencyLevel.DEVELOPING,
                mastery=MasteryLevel.DEMONSTRATED,
                evidence_strength=EvidenceStrengthLevel.STRONG,
                confidence=0.85,
                supporting_temp_claim_ids=["TMP_02"],
                supporting_observation_ids=["OBS_DEP_pg"]
            )
        ]
    )

    request_payload = {
        "evidence_id": "EV_GH_GOLDEN_01",
        "user_id": "USR_SANKA_42",
        "repo_url": "https://github.com/testuser/sample-backend",
        "allowed_capabilities": [
            {
                "capability_id": "CAP-EXPRESS",
                "name": "Express.js Framework",
                "category": "BACKEND",
                "description": "Building web servers."
            },
            {
                "capability_id": "CAP-POSTGRESQL",
                "name": "PostgreSQL Database",
                "category": "DATABASE",
                "description": "Relational database integration."
            }
        ]
    }

    response = client.post("/api/v1/evidence/evaluate/github", json=request_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["observations_count"] > 0

    event = data["event"]
    assert event["event_type"] == "EVIDENCE_EVALUATED"
    assert event["producer"] == "EIE"
    assert event["data"]["user_id"] == "USR_SANKA_42"

    cap_ids = [c["capability_id"] for c in event["data"]["capabilities"]]
    assert "CAP-EXPRESS" in cap_ids
    assert "CAP-POSTGRESQL" in cap_ids
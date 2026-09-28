# apps/intelligence/tests/test_multi_evidence_cig.py
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from unittest.mock import patch, MagicMock
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


def create_mock_dto(claim_id, obs_id):
    return AIEvaluationResponseDTO(
        classification=ProjectClassification(),
        overall_confidence=0.88,
        claims=[
            AIClaimDTO(
                temp_claim_id=claim_id,
                capability_id="CAP-POSTGRESQL",
                statement="Demonstrates relational schema design and SQL client integration.",
                supporting_observation_ids=[obs_id],
                confidence=0.88
            )
        ],
        capability_evaluations=[
            AICapabilityEvaluationDTO(
                capability_id="CAP-POSTGRESQL",
                proficiency=ProficiencyLevel.PROFICIENT,
                mastery=MasteryLevel.DEMONSTRATED,
                evidence_strength=EvidenceStrengthLevel.STRONG,
                confidence=0.88,
                supporting_temp_claim_ids=[claim_id],
                supporting_observation_ids=[obs_id]
            )
        ]
    )


@patch("src.evidence.engine.EIEIntelligenceEngine._call_llm")
@patch("src.evidence.github_analyzer.httpx.Client")
def test_three_evidence_types_evaluated_independently(mock_httpx_cls, mock_call_llm):
    """
    Verifies Section 25:
    All 3 MVP evidence types (GitHub, Report, Assessment) submitted by the SAME user
    remain completely independent evaluations with distinct provenance and CIG events.
    """
    user_id = "USR_SANKA_FINAL_01"
    target_capability = {
        "capability_id": "CAP-POSTGRESQL",
        "name": "PostgreSQL Databases",
        "category": "DATABASE",
        "description": "Relational schema design and client integration."
    }

    # -------------------------------------------------------------
    # 1. Submit & Evaluate Evidence 1: GitHub Repository
    # -------------------------------------------------------------
    mock_client = MagicMock()
    mock_httpx_cls.return_value = mock_client

    import base64
    mock_client.get.side_effect = [
        MagicMock(status_code=200, json=lambda: {"default_branch": "main", "language": "JavaScript"}),
        MagicMock(status_code=200, json=lambda: {"tree": [{"path": "package.json", "type": "blob"}]}),
        MagicMock(
            status_code=200,
            json=lambda: {
                "encoding": "base64",
                "content": base64.b64encode(b'{"dependencies": {"pg": "^8.11.3"}}').decode()
            }
        ),
        MagicMock(status_code=404)
    ]

    mock_call_llm.side_effect = [
        create_mock_dto("TMP_GH_01", "OBS_DEP_pg"),
        create_mock_dto("TMP_REP_01", "OBS_TECH_POSTGRESQL_EV_REP_002_4"),
        create_mock_dto("TMP_ASM_01", "OBS_Q_Q17_EV_ASM_003"),
    ]

    gh_res = client.post(
        "/api/v1/evidence/evaluate/github",
        json={
            "evidence_id": "EV_GH_001",
            "user_id": user_id,
            "repo_url": "https://github.com/user/project",
            "allowed_capabilities": [target_capability]
        }
    )
    assert gh_res.status_code == 200
    gh_event = gh_res.json()["event"]

    # -------------------------------------------------------------
    # 2. Submit & Evaluate Evidence 2: Project Report
    # -------------------------------------------------------------
    rep_res = client.post(
        "/api/v1/evidence/evaluate/report",
        json={
            "evidence_id": "EV_REP_002",
            "user_id": user_id,
            "title": "Database Architecture Report",
            "report_text": "Detailed design of PostgreSQL tables with foreign keys and ACID transactions.",
            "pages": [{"page_number": 4, "text": "PostgreSQL database configuration and migrations."}],
            "allowed_capabilities": [target_capability]
        }
    )
    assert rep_res.status_code == 200
    rep_event = rep_res.json()["event"]

    # -------------------------------------------------------------
    # 3. Submit & Evaluate Evidence 3: Assessment Result
    # -------------------------------------------------------------
    asm_res = client.post(
        "/api/v1/evidence/evaluate/assessment",
        json={
            "evidence_id": "EV_ASM_003",
            "user_id": user_id,
            "assessment_id": "ASM_EXAM_99",
            "title": "PostgreSQL Certification",
            "questions": [
                {
                    "question_id": "Q17",
                    "topic": "postgresql",
                    "question_text": "Explain indexing strategies in PostgreSQL.",
                    "is_correct": True,
                    "score": 1.0,
                    "max_score": 1.0
                }
            ],
            "allowed_capabilities": [target_capability]
        }
    )
    assert asm_res.status_code == 200
    asm_event = asm_res.json()["event"]

    # -------------------------------------------------------------
    # 4. Strict Invariant Verification (Section 25 & Section 32)
    # -------------------------------------------------------------
    eval_ids = {
        gh_event["data"]["evaluation_id"],
        rep_event["data"]["evaluation_id"],
        asm_event["data"]["evaluation_id"]
    }
    assert len(eval_ids) == 3, "Each evaluation must produce an independent evaluation_id"

    assert gh_event["data"]["user_id"] == user_id
    assert rep_event["data"]["user_id"] == user_id
    assert asm_event["data"]["user_id"] == user_id

    assert gh_event["data"]["provenance"]["evidence_type"] == "github_repository"
    assert rep_event["data"]["provenance"]["evidence_type"] == "project_report"
    assert asm_event["data"]["provenance"]["evidence_type"] == "assessment_result"

    gh_audit = gh_event["data"]["provenance"]["audit_chain"]
    rep_audit = rep_event["data"]["provenance"]["audit_chain"]
    asm_audit = asm_event["data"]["provenance"]["audit_chain"]

    assert any("package.json" in item["source_location"] for item in gh_audit)
    assert any("page: 4" in item["source_location"] for item in rep_audit)
    assert any("question_id: 'Q17'" in item["source_location"] for item in asm_audit)
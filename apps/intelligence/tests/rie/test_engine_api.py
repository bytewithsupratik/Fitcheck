# apps/intelligence/tests/rie/test_engine_api.py
import sys
from pathlib import Path

# Add apps/intelligence to python search path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from fastapi.testclient import TestClient
from src.main import app

from src.evidence.schemas import ProficiencyLevel, MasteryLevel, EvidenceStrengthLevel
from src.cie.schemas import CapabilityRequirement, RequirementImportance, RequirementType
from src.rie.schemas import (
    RIEInput,
    CIGLearnerStateInput,
    CIGCapabilityStateInput,
    CIERequirementsInput,
)
from src.rie.engine import ReadinessIntelligenceEngine
from src.rie.events import RIEEventBuilder

client = TestClient(app)


def test_rie_engine_deterministic_orchestration():
    """
    Verifies full end-to-end deterministic evaluation:
    CIG state + CIE requirements -> RIE output -> CIG event contract.
    """
    learner_state = CIGLearnerStateInput(
        learner_id="USR_SANKA_RIE_01",
        state_version="CIG_STATE_014",
        goal_id="GOAL_AI_01",
        active_target_id="CAREER-AI-ENGINEER",
        capabilities=[
            CIGCapabilityStateInput(
                capability_id="CAP-PYTHON",
                proficiency=ProficiencyLevel.PROFICIENT,  # 3 / 4 = 0.75
                mastery=MasteryLevel.DEMONSTRATED,
                confidence=0.88,
                evidence_strength=EvidenceStrengthLevel.STRONG
            )
        ],
        consistency=0.75
    )

    cie_reqs = CIERequirementsInput(
        cie_evaluation_id="CIE_001",
        cie_version="CIE-1.0",
        target_id="CAREER-AI-ENGINEER",
        capability_requirements=[
            CapabilityRequirement(
                capability_id="CAP-PYTHON",
                importance=RequirementImportance.CORE,
                expected_proficiency=ProficiencyLevel.ADVANCED,  # 4
                requirement_type=RequirementType.TECHNICAL
            ),
            CapabilityRequirement(
                capability_id="CAP-ML",
                importance=RequirementImportance.CORE,
                expected_proficiency=ProficiencyLevel.PROFICIENT,  # 3
                requirement_type=RequirementType.TECHNICAL
            )
        ]
    )

    payload = RIEInput(
        learner_state=learner_state,
        cie_requirements=cie_reqs,
        previous_evaluation={"readiness": {"overall": 0.30}}
    )

    output = ReadinessIntelligenceEngine.evaluate(payload)

    # 1. Verification of Scores
    assert 0.0 <= output.readiness.overall <= 1.0
    assert output.readiness.confidence > 0.0
    assert output.readiness.interpretation.value in ["LOW", "DEVELOPING", "READYING", "HIGH"]

    # 2. Priority Gaps
    assert len(output.priority_gaps) >= 1
    # CAP-ML should be top gap since attained is 0
    top_gap = output.priority_gaps[0]
    assert top_gap.capability_id == "CAP-ML"
    assert top_gap.gap == 3

    # 3. Trend
    assert output.trend.direction.value == "IMPROVING"
    assert output.trend.delta > 0

    # 4. Provenance
    assert output.provenance.cig_state_version == "CIG_STATE_014"
    assert output.provenance.cie_evaluation_id == "CIE_001"

    # 5. CIG Event Builder verification (Section 35)
    event = RIEEventBuilder.build_readiness_evaluated_event(output)
    assert event["event_type"] == "READINESS_EVALUATED"
    assert event["producer"] == "RIE"
    assert event["data"]["learner_id"] == "USR_SANKA_RIE_01"


def test_rie_api_endpoint_success():
    """Verifies POST /api/v1/readiness/evaluate returns 200 OK with validated schema."""
    payload = {
        "learner_state": {
            "learner_id": "USR_SANKA_HTTP",
            "state_version": "CIG_STATE_014",
            "goal_id": "GOAL_FS_01",
            "active_target_id": "CAREER-FULLSTACK-DEV",
            "capabilities": [
                {
                    "capability_id": "CAP-TYPESCRIPT",
                    "proficiency": "PROFICIENT",
                    "mastery": "DEMONSTRATED",
                    "confidence": 0.90,
                    "evidence_strength": "STRONG"
                }
            ],
            "consistency": 0.80
        },
        "cie_requirements": {
            "cie_evaluation_id": "CIE_002",
            "cie_version": "CIE-1.0",
            "target_id": "CAREER-FULLSTACK-DEV",
            "capability_requirements": [
                {
                    "capability_id": "CAP-TYPESCRIPT",
                    "importance": "CORE",
                    "expected_proficiency": "PROFICIENT",
                    "requirement_type": "TECHNICAL"
                }
            ]
        }
    }

    response = client.post("/api/v1/readiness/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["learner_id"] == "USR_SANKA_HTTP"
    assert data["readiness"]["overall"] > 0.80
    assert data["readiness"]["interpretation"] in ["READYING", "HIGH"]
    assert data["provenance"]["model_version"] == "RIE-1.0"
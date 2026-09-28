# apps/intelligence/tests/cie/test_engine.py
import sys
from pathlib import Path

# Add apps/intelligence to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.cie.schemas import (
    CIEInput,
    CIEGoalInput,
    CIECapabilityInput,
    TargetType,
    ProficiencyLevel,
    MasteryLevel,
)
from src.cie.engine import CareerIntelligenceEngine
from src.cie.taxonomy import TargetNotFoundError


def test_cie_engine_milestone_evaluation():
    """
    Verifies Section 47 Milestone:
    Given structured target and valid CIG learner state, returns valid CIEOutput.
    """
    engine = CareerIntelligenceEngine()

    input_payload = CIEInput(
        learner_id="USR_SANKA_01",
        state_version="CIG_STATE_014",
        goal=CIEGoalInput(
            goal_id="GOAL_AI_01",
            target_id="CAREER-AI-ENGINEER",
            target_type=TargetType.CAREER,
            priority="HIGH"
        ),
        capabilities=[
            CIECapabilityInput(
                capability_id="CAP-PYTHON",
                proficiency=ProficiencyLevel.DEVELOPING,
                mastery=MasteryLevel.PARTIALLY_DEMONSTRATED,
                confidence=0.72
            )
        ],
        career_dna={"preferred_domains": ["AI"]}
    )

    output = engine.evaluate(input_payload)

    # 1. Identity & Versioning
    assert output.learner_id == "USR_SANKA_01"
    assert output.input_state_version == "CIG_STATE_014"
    assert output.target.target_id == "CAREER-AI-ENGINEER"

    # 2. Relevance
    assert 0.0 <= output.relevance.score <= 1.0
    assert output.relevance.score > 0.40  # Python + AI interest gives a solid start

    # 3. Alignment
    assert len(output.capability_alignment.required) > 0
    # Python is developing but requires proficient, so it should be in missing or supporting depending on rank
    assert len(output.capability_alignment.missing) > 0

    # 4. Roadmap & Trajectory
    assert len(output.roadmap.stages) >= 2
    assert output.trajectory.status.value == "ACTIVE"
    assert output.trajectory.current_stage_id is not None

    # 5. Alternatives
    assert len(output.alternative_directions) > 0

    # 6. Provenance
    assert output.provenance["input_state_version"] == "CIG_STATE_014"
    assert output.provenance["taxonomy_version"] == "TAX_001"


def test_cie_engine_rejects_unregistered_target():
    """Verifies that an unknown career target raises TargetNotFoundError."""
    engine = CareerIntelligenceEngine()

    input_payload = CIEInput(
        learner_id="USR_01",
        state_version="CIG_STATE_001",
        goal=CIEGoalInput(
            goal_id="GOAL_INVALID",
            target_id="CAREER-UNREGISTERED-HERO",
            target_type=TargetType.CAREER,
            priority="HIGH"
        )
    )

    with pytest.raises(TargetNotFoundError):
        engine.evaluate(input_payload)
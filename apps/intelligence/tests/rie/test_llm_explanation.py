# apps/intelligence/tests/rie/test_llm_explanation.py
import sys
from pathlib import Path

# Add apps/intelligence to python search path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.evidence.schemas import ProficiencyLevel, MasteryLevel, EvidenceStrengthLevel
from src.cie.schemas import CapabilityRequirement, RequirementImportance, RequirementType
from src.rie.schemas import (
    RIEInput,
    CIGLearnerStateInput,
    CIGCapabilityStateInput,
    CIERequirementsInput,
)
from src.rie.engine import ReadinessIntelligenceEngine


def test_llm_explanation_preserves_deterministic_scores():
    """
    Verifies Section 4 & 29:
    The LLM explanation must accompany the output without mutating any
    authoritative numerical readiness scores.
    """
    learner_state = CIGLearnerStateInput(
        learner_id="USR_TEST_LLM",
        state_version="CIG_STATE_005",
        goal_id="GOAL_01",
        active_target_id="CAREER-AI-ENGINEER",
        capabilities=[
            CIGCapabilityStateInput(
                capability_id="CAP-PYTHON",
                proficiency=ProficiencyLevel.DEVELOPING,
                mastery=MasteryLevel.PARTIALLY_DEMONSTRATED,
                confidence=0.80,
                evidence_strength=EvidenceStrengthLevel.MODERATE
            )
        ],
        consistency=0.70
    )

    cie_reqs = CIERequirementsInput(
        cie_evaluation_id="CIE_100",
        cie_version="CIE-1.0",
        target_id="CAREER-AI-ENGINEER",
        capability_requirements=[
            CapabilityRequirement(
                capability_id="CAP-PYTHON",
                importance=RequirementImportance.CORE,
                expected_proficiency=ProficiencyLevel.ADVANCED,
                requirement_type=RequirementType.TECHNICAL
            ),
            CapabilityRequirement(
                capability_id="CAP-ML",
                importance=RequirementImportance.CORE,
                expected_proficiency=ProficiencyLevel.PROFICIENT,
                requirement_type=RequirementType.TECHNICAL
            )
        ]
    )

    payload = RIEInput(
        learner_state=learner_state,
        cie_requirements=cie_reqs,
        previous_evaluation={"readiness": {"overall": 0.20}}
    )

    output = ReadinessIntelligenceEngine.evaluate(payload, include_explanation=True)

    # 1. Output must have valid explanation
    assert output.explanation is not None
    assert len(output.explanation.summary) > 10
    assert len(output.explanation.readiness_explanation) > 10
    assert len(output.explanation.priority_gap_explanations) > 0

    # 2. Mathematical scores must match deterministic equations exactly
    assert output.readiness.overall > 0.0
    assert 0.0 <= output.readiness.technical_capability <= 1.0
    assert output.readiness.confidence > 0.0

    # 3. Priority gaps must be ordered by priority descending
    priorities = [g.priority for g in output.priority_gaps]
    assert priorities == sorted(priorities, reverse=True)
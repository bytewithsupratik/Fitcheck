# apps/intelligence/tests/cie/test_matcher.py
import sys
from pathlib import Path

# Add apps/intelligence to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.cie.schemas import (
    CIEGoalInput,
    CIECapabilityInput,
    TargetType,
    ProficiencyLevel,
    MasteryLevel,
)
from src.cie.taxonomy import DynamicTaxonomyRegistry
from src.cie.matcher import DeterministicMatcher


@pytest.fixture
def taxonomy_registry():
    return DynamicTaxonomyRegistry()


def test_matcher_fully_aligned_learner(taxonomy_registry):
    """Learner has all required capabilities at expected proficiencies."""
    profile = taxonomy_registry.get_profile("CAREER-AI-ENGINEER")
    goal = CIEGoalInput(
        goal_id="GOAL_01",
        target_id="CAREER-AI-ENGINEER",
        target_type=TargetType.CAREER,
        priority="HIGH"
    )

    # Capabilities matching AI Engineer profile
    learner_caps = [
        CIECapabilityInput(
            capability_id="CAP-PYTHON",
            proficiency=ProficiencyLevel.PROFICIENT,
            mastery=MasteryLevel.DEMONSTRATED,
            confidence=0.90
        ),
        CIECapabilityInput(
            capability_id="CAP-OPENAI",
            proficiency=ProficiencyLevel.PROFICIENT,
            mastery=MasteryLevel.DEMONSTRATED,
            confidence=0.88
        ),
        CIECapabilityInput(
            capability_id="CAP-POSTGRESQL",
            proficiency=ProficiencyLevel.DEVELOPING,
            mastery=MasteryLevel.DEMONSTRATED,
            confidence=0.85
        ),
        CIECapabilityInput(
            capability_id="CAP-DOCKER",
            proficiency=ProficiencyLevel.DEVELOPING,
            mastery=MasteryLevel.DEMONSTRATED,
            confidence=0.85
        ),
        CIECapabilityInput(
            capability_id="CAP-TESTING",
            proficiency=ProficiencyLevel.DEVELOPING,
            mastery=MasteryLevel.DEMONSTRATED,
            confidence=0.85
        )
    ]

    alignment, relevance = DeterministicMatcher.match(
        target_profile=profile,
        goal=goal,
        learner_capabilities=learner_caps,
        career_dna={"preferred_domains": ["AI"]}
    )

    # All 5 capabilities should be supporting
    assert len(alignment.supporting) == 5
    assert len(alignment.missing) == 0
    assert len(alignment.required) == 5

    # Relevance score should be high (> 0.85) based on 50/30/20 weights
    assert relevance.score > 0.85
    assert relevance.confidence > 0.80
    assert relevance.breakdown["capability_alignment"] > 0.80


def test_matcher_partial_aligned_gap_analysis(taxonomy_registry):
    """Learner has Python, but is missing OpenAI, Docker, and Database skills."""
    profile = taxonomy_registry.get_profile("CAREER-AI-ENGINEER")
    goal = CIEGoalInput(
        goal_id="GOAL_02",
        target_id="CAREER-AI-ENGINEER",
        target_type=TargetType.CAREER,
        priority="HIGH"
    )

    learner_caps = [
        CIECapabilityInput(
            capability_id="CAP-PYTHON",
            proficiency=ProficiencyLevel.PROFICIENT,
            mastery=MasteryLevel.DEMONSTRATED,
            confidence=0.85
        )
    ]

    alignment, relevance = DeterministicMatcher.match(
        target_profile=profile,
        goal=goal,
        learner_capabilities=learner_caps
    )

    # 1 supporting (Python), 4 missing
    assert len(alignment.supporting) == 1
    assert len(alignment.missing) == 4
    assert len(alignment.required) == 5

    # Missing must include CAP-OPENAI and CAP-DOCKER
    missing_ids = [m.capability_id for m in alignment.missing]
    assert "CAP-OPENAI" in missing_ids
    assert "CAP-DOCKER" in missing_ids


def test_matcher_frozen_weighting_formula(taxonomy_registry):
    """Verifies that relevance exactly equals: 0.50 * Cap + 0.30 * Goal + 0.20 * DNA."""
    profile = taxonomy_registry.get_profile("CAREER-AI-ENGINEER")
    goal = CIEGoalInput(
        goal_id="GOAL_03",
        target_id="CAREER-AI-ENGINEER",
        target_type=TargetType.CAREER,
        priority="HIGH"
    )

    alignment, relevance = DeterministicMatcher.match(
        target_profile=profile,
        goal=goal,
        learner_capabilities=[],  # Empty capabilities
        career_dna={"preferred_domains": []}
    )

    # When learner has 0 capabilities, capability_alignment is 0.0
    # Goal is 1.0 (Direct match), DNA baseline is 0.7
    # Relevance = (0.50 * 0.0) + (0.30 * 1.0) + (0.20 * 0.70) = 0.30 + 0.14 = 0.44
    expected_score = round((0.50 * 0.0) + (0.30 * 1.0) + (0.20 * 0.70), 3)
    assert relevance.score == expected_score
    assert relevance.breakdown["capability_alignment"] == 0.0
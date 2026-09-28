# apps/intelligence/tests/rie/test_deterministic_core.py
import sys
from pathlib import Path

# Add apps/intelligence to python search path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.evidence.schemas import ProficiencyLevel, MasteryLevel, EvidenceStrengthLevel
from src.cie.schemas import CapabilityRequirement, RequirementImportance, RequirementType
from src.rie.schemas import CIGCapabilityStateInput
from src.rie.enums import CapabilityReadinessState, ReadinessInterpretation, TrendDirection
from src.rie.capability import CapabilityReadinessEvaluator
from src.rie.gaps import GapAnalyzer
from src.rie.aggregation import ReadinessAggregator
from src.rie.trend import TrendEvaluator


def test_section_44_sanity_check():
    """
    Verifies Section 44 Sanity Check:
    Python: required = ADVANCED (4), attained = PROFICIENT (3),
    confidence = 0.88, importance = CORE (1.0).
    AttainmentRatio = 3 / 4 = 0.75
    CapabilityReadiness = 0.75 * 0.88 = 0.66
    State = PARTIALLY_READY (because 3 < 4, not because of confidence)
    """
    reqs = [
        CapabilityRequirement(
            capability_id="CAP-PYTHON",
            importance=RequirementImportance.CORE,
            expected_proficiency=ProficiencyLevel.ADVANCED,
            requirement_type=RequirementType.TECHNICAL
        )
    ]
    learner_caps = [
        CIGCapabilityStateInput(
            capability_id="CAP-PYTHON",
            proficiency=ProficiencyLevel.PROFICIENT,
            mastery=MasteryLevel.DEMONSTRATED,
            confidence=0.88,
            evidence_strength=EvidenceStrengthLevel.STRONG
        )
    ]

    evaluated, tech_readiness = CapabilityReadinessEvaluator.evaluate_capabilities(reqs, learner_caps)
    item = evaluated[0]

    assert item.attainment_ratio == 0.75
    assert item.readiness == 0.66
    assert item.state == CapabilityReadinessState.PARTIALLY_READY
    assert tech_readiness == 0.66


def test_missing_dimension_renormalization_section_19():
    """
    Verifies Section 19:
    If Experience is unavailable:
    Available weights: Tech 0.40, Evidence 0.20, Consistency 0.10, Goal 0.15 = sum 0.85
    AdjustedReadiness = weighted_available_score / 0.85
    """
    scores = ReadinessAggregator.aggregate_overall(
        technical_readiness=0.60,
        evidence_readiness=0.50,
        experience_readiness=None,  # Missing dimension!
        consistency=0.70,
        goal_alignment=1.0,
        overall_confidence=0.80
    )

    # Expected:
    # weighted = (0.60 * 0.40) + (0.50 * 0.20) + (0.70 * 0.10) + (1.0 * 0.15)
    #          = 0.24 + 0.10 + 0.07 + 0.15 = 0.56
    # adjusted = 0.56 / 0.85 = 0.6588
    expected = round(0.56 / 0.85, 4)
    assert scores.overall == expected
    assert "experience" not in scores.active_weights
    assert scores.interpretation == ReadinessInterpretation.DEVELOPING


def test_gap_priority_formula_section_22():
    """
    Verifies Section 22:
    Priority = NormalizedGap * ImportanceWeight * Confidence
    """
    reqs = [
        CapabilityRequirement(
            capability_id="CAP-ML",
            importance=RequirementImportance.CORE,
            expected_proficiency=ProficiencyLevel.ADVANCED,  # 4
            requirement_type=RequirementType.TECHNICAL
        )
    ]
    learner_caps = [
        CIGCapabilityStateInput(
            capability_id="CAP-ML",
            proficiency=ProficiencyLevel.FOUNDATIONAL,  # 1
            mastery=MasteryLevel.PARTIALLY_DEMONSTRATED,
            confidence=0.84,
            evidence_strength=EvidenceStrengthLevel.MODERATE
        )
    ]

    evaluated, _ = CapabilityReadinessEvaluator.evaluate_capabilities(reqs, learner_caps)
    gaps = GapAnalyzer.analyze_gaps(evaluated)

    gap_item = gaps[0]
    assert gap_item.gap == 3
    assert gap_item.normalized_gap == 0.75  # 3 / 4
    # Priority = 0.75 * 1.0 * 0.84 = 0.63
    assert gap_item.priority == round(0.75 * 1.0 * 0.84, 4)


def test_trend_calculation_section_24():
    """Verifies Section 24: Trend calculation and directions."""
    # Case 1: Improving
    trend_improving = TrendEvaluator.evaluate_trend(0.58, {"readiness": {"overall": 0.54}})
    assert trend_improving.delta == 0.04
    assert trend_improving.direction == TrendDirection.IMPROVING

    # Case 2: Declining
    trend_declining = TrendEvaluator.evaluate_trend(0.50, {"readiness": {"overall": 0.55}})
    assert trend_declining.delta == -0.05
    assert trend_declining.direction == TrendDirection.DECLINING

    # Case 3: No previous
    trend_none = TrendEvaluator.evaluate_trend(0.50, None)
    assert trend_none.direction == TrendDirection.NO_PREVIOUS_DATA
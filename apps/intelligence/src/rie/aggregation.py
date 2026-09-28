# apps/intelligence/src/rie/aggregation.py
from typing import List, Dict, Optional, Tuple
from src.rie.schemas import (
    EvaluatedCapabilityReadiness,
    ReadinessScores,
)
from src.rie.enums import ReadinessInterpretation
from src.rie.constants import (
    READINESS_DIMENSION_WEIGHTS,
    READINESS_BANDS,
)


class ReadinessAggregator:
    @classmethod
    def calculate_confidence(
        cls,
        capabilities: List[EvaluatedCapabilityReadiness],
    ) -> float:
        """
        Calculates overall capability confidence weighted by importance (Section 17).
        """
        total_weighted_conf = sum(c.confidence * c.importance_weight for c in capabilities)
        total_weights = sum(c.importance_weight for c in capabilities)
        if total_weights == 0.0:
            return 0.0
        return round(total_weighted_conf / total_weights, 4)

    @classmethod
    def aggregate_overall(
        cls,
        technical_readiness: float,
        evidence_readiness: Optional[float],
        experience_readiness: Optional[float],
        consistency: Optional[float],
        goal_alignment: float,
        overall_confidence: float,
    ) -> ReadinessScores:
        """
        Calculates overall readiness using canonical weights and dynamic renormalization
        for unavailable dimensions (Sections 18, 19, 20).
        """
        dimension_values: Dict[str, Optional[float]] = {
            "technical_capability": technical_readiness,
            "evidence_strength": evidence_readiness,
            "experience": experience_readiness,
            "consistency": consistency,
            "goal_alignment": goal_alignment,
        }

        # Filter available dimensions and sum active weights
        active_weights: Dict[str, float] = {}
        weighted_sum = 0.0

        for dim, val in dimension_values.items():
            if val is not None:
                base_w = READINESS_DIMENSION_WEIGHTS[dim]
                active_weights[dim] = base_w
                weighted_sum += val * base_w

        sum_active_weights = sum(active_weights.values())

        if sum_active_weights == 0.0:
            overall_score = 0.0
        else:
            # Renormalization (Section 19)
            overall_score = round(weighted_sum / sum_active_weights, 4)
            overall_score = min(1.0, max(0.0, overall_score))

        # Determine interpretation band (Section 20)
        interpretation = cls._classify_interpretation(overall_score)

        return ReadinessScores(
            overall=overall_score,
            technical_capability=technical_readiness,
            evidence_strength=evidence_readiness,
            experience=experience_readiness,
            consistency=consistency,
            goal_alignment=goal_alignment,
            confidence=overall_confidence,
            interpretation=interpretation,
            active_weights=active_weights
        )

    @classmethod
    def _classify_interpretation(cls, score: float) -> ReadinessInterpretation:
        for band_name, (low, high) in READINESS_BANDS.items():
            if low <= score <= high:
                return ReadinessInterpretation(band_name)
        return ReadinessInterpretation.HIGH if score > 1.0 else ReadinessInterpretation.LOW
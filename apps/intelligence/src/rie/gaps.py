# apps/intelligence/src/rie/gaps.py
from typing import List
from src.rie.schemas import (
    EvaluatedCapabilityReadiness,
    PriorityGap,
)
from src.rie.enums import CapabilityReadinessState


class GapAnalyzer:
    @classmethod
    def analyze_gaps(
        cls,
        capabilities: List[EvaluatedCapabilityReadiness],
    ) -> List[PriorityGap]:
        """
        Computes gap, normalized gap, and deterministic priority for each capability.
        Returns priority gaps sorted by priority descending.
        """
        priority_gaps: List[PriorityGap] = []

        for cap in capabilities:
            gap = max(cap.required_rank - cap.attained_rank, 0)
            normalized_gap = round(gap / cap.required_rank, 4) if cap.required_rank > 0 else 0.0

            if gap > 0:
                # Priority Formula (Section 22):
                # NormalizedGap * ImportanceWeight * ConfidenceFactor
                # For untested capabilities (confidence == 0), use 1.0 as gap penalty
                conf_factor = cap.confidence if cap.confidence > 0.0 else 1.0
                priority = round(normalized_gap * cap.importance_weight * conf_factor, 4)
                priority = min(1.0, max(0.0, priority))

                item = PriorityGap(
                    capability_id=cap.capability_id,
                    required_proficiency=cap.required_proficiency,
                    attained_proficiency=cap.attained_proficiency,
                    gap=gap,
                    normalized_gap=normalized_gap,
                    importance=cap.importance,
                    importance_weight=cap.importance_weight,
                    confidence=cap.confidence,
                    priority=priority,
                    state=cap.state
                )
                priority_gaps.append(item)

        # Sort priority gaps descending by priority, then importance weight
        priority_gaps.sort(
            key=lambda g: (g.priority, g.importance_weight),
            reverse=True
        )
        return priority_gaps
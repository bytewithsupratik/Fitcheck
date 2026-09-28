# apps/intelligence/src/upe/depth.py
from typing import List, Tuple
from src.upe.schemas import CapabilityStateInput, CapabilityProgress
from src.upe.enums import CapabilityProgressTrend
from src.upe.constants import PROFICIENCY_RANKS, IMPORTANCE_WEIGHTS


class DepthCalculator:
    """
    Computes substantive capability progression (Section 6 & 14).
    D_i = (CurrentRank_i - 1) / 3
    Depth_i = D_i * Confidence_i
    Depth = sum(Depth_i * W_i) / sum(W_i)
    """

    @classmethod
    def calculate_depth(
        cls,
        capability_states: List[CapabilityStateInput],
    ) -> Tuple[float, List[CapabilityProgress]]:
        if not capability_states:
            return 0.0, []

        total_weighted_depth = 0.0
        total_weights = 0.0
        cap_progress_list: List[CapabilityProgress] = []

        for cap in capability_states:
            current_rank = PROFICIENCY_RANKS[cap.proficiency]
            conf = cap.confidence
            imp_weight = IMPORTANCE_WEIGHTS.get(cap.importance, 1.0)

            # Normalized capability depth: D_i in [0.0, 1.0]
            d_i = (current_rank - 1) / 3.0
            depth_i = d_i * conf

            total_weighted_depth += depth_i * imp_weight
            total_weights += imp_weight

            # Longitudinal tracking against historical capability state
            if cap.historical_proficiency is not None:
                prev_rank = PROFICIENCY_RANKS[cap.historical_proficiency]
                prev_conf = cap.historical_confidence or 0.0

                if current_rank > prev_rank or (current_rank == prev_rank and conf > prev_conf + 0.02):
                    trend = CapabilityProgressTrend.IMPROVING
                elif current_rank < prev_rank or (current_rank == prev_rank and conf < prev_conf - 0.02):
                    trend = CapabilityProgressTrend.REGRESSING
                else:
                    trend = CapabilityProgressTrend.STABLE
            else:
                prev_rank = None
                prev_conf = None
                trend = CapabilityProgressTrend.INSUFFICIENT_HISTORY

            cap_progress_list.append(
                CapabilityProgress(
                    capability_id=cap.capability_id,
                    previous_rank=prev_rank,
                    current_rank=current_rank,
                    previous_confidence=prev_conf,
                    current_confidence=conf,
                    depth=round(depth_i, 4),
                    trend=trend
                )
            )

        overall_depth = (
            round(total_weighted_depth / total_weights, 4)
            if total_weights > 0.0 else 0.0
        )
        return min(1.0, max(0.0, overall_depth)), cap_progress_list
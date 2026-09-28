# apps/intelligence/src/upe/aggregation.py
from typing import Optional, Dict
from src.upe.enums import ProgressBand
from src.upe.constants import PROGRESS_DIMENSION_WEIGHTS, PROGRESS_BANDS


class ProgressAggregator:
    """
    Aggregates Depth (35%), Velocity (20%), Consistency (25%), Alignment (20%)
    with dynamic N/A weight renormalization (Section 11).
    """

    @classmethod
    def aggregate(
        cls,
        depth: float,
        velocity: Optional[float],
        consistency: Optional[float],
        alignment: Optional[float],
    ) -> tuple[float, ProgressBand, Dict[str, float]]:
        dimension_values: Dict[str, Optional[float]] = {
            "depth": depth,
            "velocity": velocity,
            "consistency": consistency,
            "alignment": alignment,
        }

        active_weights: Dict[str, float] = {}
        weighted_sum = 0.0

        for dim, val in dimension_values.items():
            if val is not None:
                w = PROGRESS_DIMENSION_WEIGHTS[dim]
                active_weights[dim] = w
                weighted_sum += val * w

        sum_weights = sum(active_weights.values())
        if sum_weights <= 0.0:
            overall = 0.0
        else:
            overall = round(weighted_sum / sum_weights, 4)
            overall = min(1.0, max(0.0, overall))

        band = cls.classify_band(overall)
        return overall, band, active_weights

    @classmethod
    def classify_band(cls, score: float) -> ProgressBand:
        for band_name, (low, high) in PROGRESS_BANDS.items():
            if low <= score <= high:
                return ProgressBand(band_name)
        return ProgressBand.VERY_STRONG if score >= 1.0 else ProgressBand.VERY_LOW
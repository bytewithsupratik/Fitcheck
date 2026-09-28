# apps/intelligence/src/upe/velocity.py
from typing import Optional
from src.upe.constants import DEFAULT_V_REF


class VelocityCalculator:
    """
    Computes learning pace over time (Section 7).
    V = clamp((P_t - P_(t-1)) / (V_ref * delta_t), 0, 1)
    """

    @classmethod
    def calculate_velocity(
        cls,
        current_progress: float,
        previous_progress: Optional[float],
        elapsed_time: Optional[float],
        v_ref: float = DEFAULT_V_REF,
    ) -> Optional[float]:
        # If no previous progress exists or elapsed time is missing/invalid, velocity is N/A
        if previous_progress is None or elapsed_time is None or elapsed_time <= 0.0:
            return None

        delta_p = current_progress - previous_progress
        divisor = v_ref * elapsed_time

        if divisor <= 0.0:
            return None

        v_raw = delta_p / divisor
        v_clamped = min(1.0, max(0.0, v_raw))
        return round(v_clamped, 4)
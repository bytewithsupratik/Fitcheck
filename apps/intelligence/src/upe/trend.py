# apps/intelligence/src/upe/trend.py
from typing import Optional
from src.upe.enums import ProgressTrendDirection, VelocityTrendDirection
from src.upe.schemas import TrendSummary
from src.upe.constants import DEFAULT_PROGRESS_EPSILON, DEFAULT_VELOCITY_EPSILON


class TrendEvaluator:
    """
    Computes overall progress trend and velocity trend with versioned tolerances (Sections 8 & 12).
    """

    @classmethod
    def evaluate_trends(
        cls,
        current_progress: float,
        previous_progress: Optional[float],
        current_velocity: Optional[float],
        previous_velocity: Optional[float],
        progress_epsilon: float = DEFAULT_PROGRESS_EPSILON,
        velocity_epsilon: float = DEFAULT_VELOCITY_EPSILON,
    ) -> TrendSummary:
        # 1. Overall Progress Trend
        if previous_progress is None:
            prog_trend = ProgressTrendDirection.INSUFFICIENT_HISTORY
            delta_p = None
        else:
            delta_p = round(current_progress - previous_progress, 4)
            if delta_p > progress_epsilon:
                prog_trend = ProgressTrendDirection.IMPROVING
            elif delta_p < -progress_epsilon:
                prog_trend = ProgressTrendDirection.DECLINING
            else:
                prog_trend = ProgressTrendDirection.STABLE

        # 2. Velocity Trend
        if current_velocity is None or previous_velocity is None:
            vel_trend = VelocityTrendDirection.INSUFFICIENT_HISTORY
            delta_v = None
        else:
            delta_v = round(current_velocity - previous_velocity, 4)
            if delta_v > velocity_epsilon:
                vel_trend = VelocityTrendDirection.ACCELERATING
            elif delta_v < -velocity_epsilon:
                vel_trend = VelocityTrendDirection.SLOWING
            else:
                vel_trend = VelocityTrendDirection.STABLE

        return TrendSummary(
            overall=prog_trend,
            velocity=vel_trend,
            delta_progress=delta_p,
            delta_velocity=delta_v
        )
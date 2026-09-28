# apps/intelligence/src/rie/trend.py
from typing import Optional, Dict, Any
from src.rie.schemas import ReadinessTrend
from src.rie.enums import TrendDirection


class TrendEvaluator:
    @classmethod
    def evaluate_trend(
        cls,
        current_readiness: float,
        previous_evaluation: Optional[Dict[str, Any]],
    ) -> ReadinessTrend:
        if not previous_evaluation:
            return ReadinessTrend(
                current=current_readiness,
                previous=None,
                delta=None,
                direction=TrendDirection.NO_PREVIOUS_DATA
            )

        # Extract previous overall score safely
        prev_readiness_data = previous_evaluation.get("readiness", {})
        prev_score = (
            prev_readiness_data.get("overall")
            if isinstance(prev_readiness_data, dict)
            else previous_evaluation.get("overall_readiness")
        )

        if prev_score is None:
            return ReadinessTrend(
                current=current_readiness,
                previous=None,
                delta=None,
                direction=TrendDirection.NO_PREVIOUS_DATA
            )

        prev_float = float(prev_score)
        delta = round(current_readiness - prev_float, 4)

        if delta > 0.0:
            direction = TrendDirection.IMPROVING
        elif delta < 0.0:
            direction = TrendDirection.DECLINING
        else:
            direction = TrendDirection.STABLE

        return ReadinessTrend(
            current=current_readiness,
            previous=prev_float,
            delta=delta,
            direction=direction
        )
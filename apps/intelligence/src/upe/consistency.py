# apps/intelligence/src/upe/consistency.py
from typing import List, Optional
from src.upe.schemas import PeriodActivity
from src.upe.constants import MINIMUM_ELIGIBLE_PERIODS


class ConsistencyCalculator:
    """
    Computes productive / eligible periods ratio (Section 9).
    Minimum-history rule: < 2 eligible periods -> Consistency = None (N/A).
    """

    @classmethod
    def calculate_consistency(
        cls,
        periods: List[PeriodActivity],
        min_periods: int = MINIMUM_ELIGIBLE_PERIODS,
    ) -> Optional[float]:
        if not periods or len(periods) < min_periods:
            return None

        eligible_count = len(periods)
        productive_count = sum(1 for p in periods if p.meaningful_progress > 0.0)

        consistency = productive_count / eligible_count
        return round(min(1.0, max(0.0, consistency)), 4)
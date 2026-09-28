# apps/intelligence/src/upe/alignment.py
from typing import List, Optional
from src.upe.schemas import LearningActivitySignal


class AlignmentCalculator:
    """
    Computes alignment of meaningful progress with the active target (Section 10).
    Alignment = sum(Progress_j * AlignmentWeight_j) / sum(Progress_j)
    If no meaningful progress occurred in the evaluation window -> Alignment = None (N/A).
    """

    @classmethod
    def calculate_alignment(
        cls,
        signals: List[LearningActivitySignal],
    ) -> Optional[float]:
        if not signals:
            return None

        total_progress = sum(s.progress_delta for s in signals)
        if total_progress <= 0.0:
            return None

        weighted_progress = sum(s.progress_delta * s.alignment_weight for s in signals)
        alignment = weighted_progress / total_progress
        return round(min(1.0, max(0.0, alignment)), 4)
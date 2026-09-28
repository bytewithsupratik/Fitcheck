# apps/intelligence/src/rie/experience.py
from typing import List, Dict, Optional
from src.cie.schemas import ExperienceRequirement
from src.rie.enums import ExperienceReadinessStatus


class ExperienceReadinessEvaluator:
    STATUS_SCORES: Dict[ExperienceReadinessStatus, float] = {
        ExperienceReadinessStatus.SATISFIED: 1.0,
        ExperienceReadinessStatus.PARTIAL: 0.5,
        ExperienceReadinessStatus.UNSATISFIED: 0.0,
    }

    @classmethod
    def evaluate_experience(
        cls,
        requirements: List[ExperienceRequirement],
        experience_state: Dict[str, ExperienceReadinessStatus],
    ) -> Optional[float]:
        """
        Evaluates experience readiness across declared experience requirements.
        Returns: float in [0.0, 1.0], or None if no requirements exist.
        """
        if not requirements:
            return None

        scores: List[float] = []
        for req in requirements:
            status = experience_state.get(
                req.requirement_id,
                ExperienceReadinessStatus.UNSATISFIED
            )
            scores.append(cls.STATUS_SCORES[status])

        return round(sum(scores) / len(scores), 4)
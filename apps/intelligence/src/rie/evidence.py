# apps/intelligence/src/rie/evidence.py
from typing import List, Dict, Optional, Tuple
from src.rie.schemas import (
    CIGCapabilityStateInput,
    EvaluatedEvidenceReadiness,
)
from src.cie.schemas import EvidenceExpectation
from src.rie.constants import EVIDENCE_STRENGTH_RANKS


class EvidenceReadinessEvaluator:
    @classmethod
    def evaluate_evidence(
        cls,
        expectations: List[EvidenceExpectation],
        learner_states: List[CIGCapabilityStateInput],
    ) -> Tuple[List[EvaluatedEvidenceReadiness], Optional[float]]:
        """
        Evaluates evidence readiness against CIE evidence expectations.
        Returns: (List[EvaluatedEvidenceReadiness], overall_evidence_readiness_or_None)
        """
        if not expectations:
            return [], None

        state_map: Dict[str, CIGCapabilityStateInput] = {
            c.capability_id: c for c in learner_states
        }

        evaluated: List[EvaluatedEvidenceReadiness] = []
        readiness_scores: List[float] = []

        for exp in expectations:
            req_rank = EVIDENCE_STRENGTH_RANKS[exp.minimum_strength]
            # Match expectation to corresponding learner capability state
            # Note: expectation_id or requirement_id may match capability_id
            learner_cap = state_map.get(exp.requirement_id) or state_map.get(exp.expectation_id)

            if learner_cap:
                attained_rank = EVIDENCE_STRENGTH_RANKS[learner_cap.evidence_strength]
                confidence = learner_cap.confidence
                attainment = min(attained_rank / req_rank, 1.0)
                readiness = round(attainment * confidence, 4)
                attained_strength = learner_cap.evidence_strength
            else:
                attained_rank = 0
                confidence = 0.0
                attainment = 0.0
                readiness = 0.0
                attained_strength = None

            item = EvaluatedEvidenceReadiness(
                requirement_id=exp.requirement_id,
                capability_id=exp.requirement_id,
                required_strength=exp.minimum_strength,
                attained_strength=attained_strength,
                required_rank=req_rank,
                attained_rank=attained_rank,
                attainment_ratio=round(attainment, 4),
                confidence=confidence,
                readiness=readiness
            )
            evaluated.append(item)
            readiness_scores.append(readiness)

        overall = (
            round(sum(readiness_scores) / len(readiness_scores), 4)
            if readiness_scores else None
        )
        return evaluated, overall
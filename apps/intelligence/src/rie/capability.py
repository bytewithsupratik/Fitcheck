# apps/intelligence/src/rie/capability.py
from typing import List, Dict, Tuple
from src.rie.schemas import (
    CIGCapabilityStateInput,
    EvaluatedCapabilityReadiness,
)
from src.cie.schemas import CapabilityRequirement
from src.rie.enums import CapabilityReadinessState
from src.rie.constants import (
    PROFICIENCY_RANKS,
    IMPORTANCE_WEIGHTS,
)


class CapabilityReadinessEvaluator:
    @classmethod
    def evaluate_capabilities(
        cls,
        requirements: List[CapabilityRequirement],
        learner_states: List[CIGCapabilityStateInput],
    ) -> Tuple[List[EvaluatedCapabilityReadiness], float]:
        """
        Evaluates capability readiness for each required capability
        and computes technical capability readiness.
        Returns: (List[EvaluatedCapabilityReadiness], technical_readiness_score)
        """
        state_map: Dict[str, CIGCapabilityStateInput] = {
            c.capability_id: c for c in learner_states
        }

        evaluated: List[EvaluatedCapabilityReadiness] = []
        weighted_readiness_sum = 0.0
        total_weights = 0.0

        for req in requirements:
            req_rank = PROFICIENCY_RANKS[req.expected_proficiency]
            imp_weight = IMPORTANCE_WEIGHTS[req.importance]
            total_weights += imp_weight

            learner_cap = state_map.get(req.capability_id)

            if learner_cap:
                attained_rank = PROFICIENCY_RANKS[learner_cap.proficiency]
                confidence = learner_cap.confidence
                attainment_ratio = min(attained_rank / req_rank, 1.0)
                readiness = round(attainment_ratio * confidence, 4)

                # State classification is purely based on attainment, not confidence (Section 10)
                if attained_rank >= req_rank:
                    state = CapabilityReadinessState.READY
                else:
                    state = CapabilityReadinessState.PARTIALLY_READY

                item = EvaluatedCapabilityReadiness(
                    capability_id=req.capability_id,
                    required_proficiency=req.expected_proficiency,
                    attained_proficiency=learner_cap.proficiency,
                    required_rank=req_rank,
                    attained_rank=attained_rank,
                    attainment_ratio=round(attainment_ratio, 4),
                    confidence=confidence,
                    readiness=readiness,
                    importance=req.importance,
                    importance_weight=imp_weight,
                    state=state
                )
            else:
                # No state in CIG -> NOT_READY, readiness = 0.0 (Section 9)
                item = EvaluatedCapabilityReadiness(
                    capability_id=req.capability_id,
                    required_proficiency=req.expected_proficiency,
                    attained_proficiency=None,
                    required_rank=req_rank,
                    attained_rank=0,
                    attainment_ratio=0.0,
                    confidence=0.0,
                    readiness=0.0,
                    importance=req.importance,
                    importance_weight=imp_weight,
                    state=CapabilityReadinessState.NOT_READY
                )

            weighted_readiness_sum += item.readiness * imp_weight
            evaluated.append(item)

        technical_readiness = (
            round(weighted_readiness_sum / total_weights, 4)
            if total_weights > 0 else 0.0
        )
        technical_readiness = min(1.0, max(0.0, technical_readiness))

        return evaluated, technical_readiness
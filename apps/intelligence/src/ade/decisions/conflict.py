# apps/intelligence/src/ade/decisions/conflict.py
from typing import List, Optional
from src.ade.schemas import CandidateDecision
from src.ade.enums import ADEDecisionType
from src.ade.constants import DECISION_PRECEDENCE


class ConflictResolver:
    """
    Resolves competing candidate decisions using canonical precedence and compatibility rules (Section 18).
    Never uses 'latest candidate wins'.
    """

    @classmethod
    def resolve(cls, candidates: List[CandidateDecision]) -> CandidateDecision:
        if not candidates:
            raise ValueError("Cannot resolve empty candidates list.")

        # 1. Filter out NO_ACTION if meaningful candidates exist
        meaningful = [c for c in candidates if c.decision_type != ADEDecisionType.NO_ACTION]
        if not meaningful:
            return candidates[0]

        # 2. Check for Contradictory Load Changes (REDUCE_LOAD vs INCREASE_LOAD)
        has_reduce = any(c.decision_type == ADEDecisionType.REDUCE_LOAD for c in meaningful)
        has_increase = any(c.decision_type == ADEDecisionType.INCREASE_LOAD for c in meaningful)

        if has_reduce and has_increase:
            # Safety invariant: Reduce Load takes precedence over Increase Load when in conflict
            meaningful = [c for c in meaningful if c.decision_type != ADEDecisionType.INCREASE_LOAD]

        # 3. Sort strictly by canonical precedence descending
        meaningful.sort(
            key=lambda c: (DECISION_PRECEDENCE.get(c.decision_type, 0), c.impact.magnitude),
            reverse=True
        )

        return meaningful[0]
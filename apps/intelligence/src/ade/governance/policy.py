# apps/intelligence/src/ade/governance/policy.py
from src.ade.enums import ADEDecisionType
from src.ade.constants import APPROVAL_MANDATORY_DECISIONS


class GovernancePolicy:
    """
    Server-side authoritative approval governance (Sections 8, 22).
    Never trusts approval_required flags supplied by clients.
    """

    @classmethod
    def requires_approval(cls, decision_type: ADEDecisionType, is_manual_pause: bool = False) -> bool:
        if decision_type in APPROVAL_MANDATORY_DECISIONS:
            return True
        if decision_type == ADEDecisionType.RESUME_LEARNING_PATH and is_manual_pause:
            return True
        return False
# apps/intelligence/src/ade/handoffs/cie.py
from typing import Dict, Any, List


class CIEHandoffBuilder:
    @classmethod
    def build_cie_handoff(
        cls,
        decision_id: str,
        learner_id: str,
        target_id: str,
        action: str,
        source_state: Dict[str, Any],
        reason_codes: List[str]
    ) -> Dict[str, Any]:
        return {
            "handoff_id": f"HND-ADE-CIE-{decision_id[-8:]}",
            "decision_id": decision_id,
            "learner_id": learner_id,
            "action": action,
            "executor": "CIE",
            "target_id": target_id,
            "reason_codes": reason_codes,
            "source_state": source_state,
            "idempotency_key": f"{decision_id}:{action}",
            "schema_version": "1.0"
        }
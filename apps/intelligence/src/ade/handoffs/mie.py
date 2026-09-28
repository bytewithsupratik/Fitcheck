# apps/intelligence/src/ade/handoffs/mie.py
from typing import Dict, Any, List


class MIEHandoffBuilder:
    @classmethod
    def build_mie_handoff(
        cls,
        decision_id: str,
        learner_id: str,
        action: str,
        reason_codes: List[str],
        constraints: Dict[str, Any],
        source_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        return {
            "handoff_id": f"HND-ADE-MIE-{decision_id[-8:]}",
            "decision_id": decision_id,
            "learner_id": learner_id,
            "action": action,
            "executor": "MIE",
            "reason_codes": reason_codes,
            "constraints": constraints,
            "source_state": source_state,
            "idempotency_key": f"{decision_id}:{action}",
            "schema_version": "1.0"
        }
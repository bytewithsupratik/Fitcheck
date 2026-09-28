# apps/intelligence/src/ade/handoffs/rie.py
from typing import Dict, Any, List


class RIEHandoffBuilder:
    @classmethod
    def build_rie_handoff(
        cls,
        decision_id: str,
        learner_id: str,
        source_state: Dict[str, Any],
        reason_codes: List[str]
    ) -> Dict[str, Any]:
        return {
            "handoff_id": f"HND-ADE-RIE-{decision_id[-8:]}",
            "decision_id": decision_id,
            "learner_id": learner_id,
            "action": "REASSESS_READINESS",
            "executor": "RIE",
            "reason_codes": reason_codes,
            "source_state": source_state,
            "idempotency_key": f"{decision_id}:REASSESS_READINESS",
            "schema_version": "1.0"
        }
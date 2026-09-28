# apps/intelligence/src/ade/context/builder.py
from typing import Dict, Any, Optional
from src.ade.schemas import ADEDecisionContext
from src.ade.events.schemas import EventEnvelope


class ContextBuilder:
    """
    Assembles authoritative decision context from event data & CIG state (Section 12).
    Never replaces missing signals with zero. Missing data remains explicitly None.
    """

    @classmethod
    def build_context(
        cls,
        event: EventEnvelope,
        cig_state: Optional[Dict[str, Any]] = None,
        decision_history: Optional[list] = None
    ) -> ADEDecisionContext:
        cig = cig_state or {}
        data = event.data or {}

        cig_version = (
            data.get("cig_state_version")
            or cig.get("state_version")
            or "CIG_STATE_INITIAL"
        )

        return ADEDecisionContext(
            learner_id=event.learner_id,
            active_goal=cig.get("active_goal", data.get("goal", {})),
            career_target=cig.get("career_target", data.get("target", {})),
            trajectory=cig.get("trajectory", data.get("trajectory", {})),
            relevant_capabilities=cig.get("capabilities", data.get("capabilities", [])),
            progress_state=data.get("progress") or data.get("overall_progress") or cig.get("progress_state"),
            readiness_state=data.get("readiness") or data.get("overall_readiness") or cig.get("readiness_state"),
            evidence_changes=data.get("evidence_changes", []),
            learning_experience=data.get("learning_experience") or cig.get("current_experience"),
            decision_history=decision_history or [],
            governance_state=cig.get("governance_state", {}),
            cig_state_version=cig_version,
            system_metadata={"source_event_type": event.event_type, "producer": event.producer}
        )
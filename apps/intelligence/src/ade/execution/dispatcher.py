# apps/intelligence/src/ade/execution/dispatcher.py
from typing import Dict, Any
from src.ade.schemas import ADEDecisionRecord
from src.ade.enums import Executor, DecisionStatus, ExecutionStatus
from src.ade.handoffs.mie import MIEHandoffBuilder
from src.ade.handoffs.rie import RIEHandoffBuilder
from src.ade.handoffs.cie import CIEHandoffBuilder
from src.ade.state_machine.machine import DecisionStateMachine


class HandoffDispatcher:
    """
    Dispatches approved/autonomous decisions to target engines (Section 33, 34).
    """

    @classmethod
    def dispatch(cls, decision: ADEDecisionRecord) -> Dict[str, Any]:
        DecisionStateMachine.assert_transition(decision.status, DecisionStatus.DISPATCHED)
        decision.status = DecisionStatus.DISPATCHED

        executor = decision.target_executor
        action = decision.decision_type.value

        if executor == Executor.MIE:
            payload = MIEHandoffBuilder.build_mie_handoff(
                decision.decision_id, decision.learner_id, action,
                decision.reason_codes, decision.action_payload, {"cig_state_version": decision.provenance.cig_state_version}
            )
        elif executor == Executor.RIE:
            payload = RIEHandoffBuilder.build_rie_handoff(
                decision.decision_id, decision.learner_id,
                {"cig_state_version": decision.provenance.cig_state_version}, decision.reason_codes
            )
        elif executor == Executor.CIE:
            payload = CIEHandoffBuilder.build_cie_handoff(
                decision.decision_id, decision.learner_id,
                decision.action_payload.get("target_id", "CAREER-DEFAULT"),
                action, {"cig_state_version": decision.provenance.cig_state_version}, decision.reason_codes
            )
        else:
            payload = {"status": "NO_DISPATCH_REQUIRED", "action": action}

        DecisionStateMachine.assert_transition(decision.status, DecisionStatus.EXECUTING)
        decision.status = DecisionStatus.EXECUTING
        decision.execution_status = ExecutionStatus.STARTED
        return payload
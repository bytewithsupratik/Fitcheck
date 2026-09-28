# apps/intelligence/tests/ade/test_state_machine_dispatch.py
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.ade.enums import DecisionStatus, ADEDecisionType, ImpactLevel, ApprovalStatus, ExecutionStatus, Executor
from src.ade.schemas import ADEDecisionRecord, ADEDecisionProvenance
from src.ade.state_machine.machine import DecisionStateMachine, IllegalStateTransitionError
from src.ade.execution.dispatcher import HandoffDispatcher


def test_state_machine_legal_and_illegal_transitions():
    # Legal: PROPOSED -> VALIDATED -> DISPATCHED
    DecisionStateMachine.assert_transition(DecisionStatus.PROPOSED, DecisionStatus.VALIDATED)
    DecisionStateMachine.assert_transition(DecisionStatus.VALIDATED, DecisionStatus.DISPATCHED)

    # Illegal: PROPOSED -> COMPLETED (bypassing validation and dispatch)
    with pytest.raises(IllegalStateTransitionError):
        DecisionStateMachine.assert_transition(DecisionStatus.PROPOSED, DecisionStatus.COMPLETED)


def test_handoff_dispatcher_creates_correct_mie_payload():
    record = ADEDecisionRecord(
        decision_id="DEC-TEST-01",
        learner_id="USR-1",
        decision_type=ADEDecisionType.ADD_REMEDIATION,
        impact_level=ImpactLevel.HIGH,
        status=DecisionStatus.VALIDATED,
        approval_status=ApprovalStatus.NOT_REQUIRED,
        execution_status=ExecutionStatus.PENDING,
        trigger_event_id="EVT-1",
        correlation_id="CORR-1",
        target_executor=Executor.MIE,
        action_payload={"target_id": "CAREER-AI-ENGINEER"},
        provenance=ADEDecisionProvenance(trigger_event_id="EVT-1", cig_state_version="CIG-42", rule_id="R1")
    )
    payload = HandoffDispatcher.dispatch(record)
    assert payload["executor"] == "MIE"
    assert payload["action"] == "ADD_REMEDIATION"
    assert payload["idempotency_key"] == "DEC-TEST-01:ADD_REMEDIATION"
    assert record.status == DecisionStatus.EXECUTING
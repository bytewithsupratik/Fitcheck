# apps/intelligence/src/ade/execution/verifier.py
from src.ade.schemas import ADEDecisionRecord
from src.ade.enums import DecisionStatus, ExecutionStatus
from src.ade.state_machine.machine import DecisionStateMachine


class ExecutionVerifier:
    """
    Verifies execution results from external engines (Section 35).
    """

    @classmethod
    def record_execution_result(
        cls,
        decision: ADEDecisionRecord,
        status: ExecutionStatus
    ) -> ADEDecisionRecord:
        decision.execution_status = status

        if status == ExecutionStatus.SUCCESS:
            DecisionStateMachine.assert_transition(decision.status, DecisionStatus.COMPLETED)
            decision.status = DecisionStatus.COMPLETED
        elif status == ExecutionStatus.PARTIAL_SUCCESS:
            DecisionStateMachine.assert_transition(decision.status, DecisionStatus.PARTIAL_SUCCESS)
            decision.status = DecisionStatus.PARTIAL_SUCCESS
        elif status == ExecutionStatus.TIMEOUT:
            DecisionStateMachine.assert_transition(decision.status, DecisionStatus.TIMEOUT)
            decision.status = DecisionStatus.TIMEOUT
        else:
            DecisionStateMachine.assert_transition(decision.status, DecisionStatus.FAILED)
            decision.status = DecisionStatus.FAILED

        return decision
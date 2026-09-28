# apps/intelligence/src/ade/engine.py
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from src.ade.schemas import (
    ADEDecisionRecord,
    ADEDecisionProvenance,
)
from src.ade.enums import (
    ADEDecisionType,
    DecisionStatus,
    ApprovalStatus,
    ExecutionStatus,
)
from src.ade.constants import (
    ADE_VERSION,
    ADE_CONFIG_VERSION,
    ADE_RULE_VERSION,
)
from src.ade.events.schemas import EventEnvelope
from src.ade.signals.validator import SignalValidator
from src.ade.signals.deduplicator import SignalDeduplicator
from src.ade.context.builder import ContextBuilder
from src.ade.impact.calculator import ImpactCalculator
from src.ade.rules.evaluator import RuleEvaluator
from src.ade.decisions.conflict import ConflictResolver
from src.ade.stability.cooldown import cooldown_manager
from src.ade.stability.oscillation import oscillation_detector
from src.ade.governance.policy import GovernancePolicy
from src.ade.state_machine.machine import DecisionStateMachine
from src.ade.execution.dispatcher import HandoffDispatcher
from src.ade.execution.verifier import ExecutionVerifier
from src.ade.persistence.repository import ade_repository


class ADEEngine:
    """
    Master Adaptive Decision Engine Orchestrator (Sections 1, 3, 52).
    Coordinates the 16-stage lifecycle:
    Event -> Validate -> Dedupe -> Context -> Impact -> Rules -> Candidates ->
    Conflict -> Hysteresis -> Cooldown -> Governance -> StateMachine -> Dispatch -> Verify
    """

    def __init__(self):
        self.deduplicator = SignalDeduplicator()

    def process_event(
        self,
        event: EventEnvelope,
        cig_state: Optional[Dict[str, Any]] = None
    ) -> ADEDecisionRecord:
        # 1. Signal Validation
        SignalValidator.validate_envelope(event)

        # 2. Deduplication Check (Section 13)
        if self.deduplicator.is_duplicate(event.event_id):
            existing = ade_repository.get_active_decision(event.learner_id)
            if existing:
                return existing

        self.deduplicator.mark_processed(event.event_id)

        # 3. Context Construction
        history = ade_repository.get_learner_decisions(event.learner_id)
        context = ContextBuilder.build_context(event, cig_state=cig_state, decision_history=[d.model_dump() for d in history])

        # 4. Impact Assessment
        impact = ImpactCalculator.calculate_impact(event, context)

        # 5. Rule Evaluation & Candidate Generation
        candidates = RuleEvaluator.evaluate_candidates(event, impact, context)

        # 6. Conflict Resolution & Precedence
        winning_candidate = ConflictResolver.resolve(candidates)
        dec_type = winning_candidate.decision_type

        # 7. Stability: Cooldown Check (Section 20)
        scope_key = winning_candidate.constraints.get("target_id", "DEFAULT")
        if dec_type != ADEDecisionType.NO_ACTION and cooldown_manager.is_in_cooldown(event.learner_id, dec_type, scope_key):
            # Cooldown active -> fallback to NO_ACTION
            dec_type = ADEDecisionType.NO_ACTION

        # 8. Stability: Oscillation Detection (Section 21)
        if oscillation_detector.is_oscillating(event.learner_id, dec_type):
            # Suppress automatic adaptation and request trajectory reassessment
            dec_type = ADEDecisionType.REASSESS_TRAJECTORY

        # Record decision for oscillation tracking
        oscillation_detector.record_decision(event.learner_id, dec_type)

        # 9. Server-Side Governance: Approval Check (Section 8, 22)
        requires_approval = GovernancePolicy.requires_approval(dec_type)

        now_iso = datetime.now(timezone.utc).isoformat()
        decision_id = f"DEC-{uuid.uuid4().hex[:8].upper()}"

        provenance = ADEDecisionProvenance(
            trigger_event_id=event.event_id,
            source_evaluations={"producer": event.producer, "event_type": event.event_type},
            cig_state_version=context.cig_state_version,
            rule_id=winning_candidate.rule_id,
            rule_version=ADE_RULE_VERSION,
            configuration_version=ADE_CONFIG_VERSION,
            ade_version=ADE_VERSION
        )

        initial_status = DecisionStatus.PROPOSED
        approval_status = ApprovalStatus.PENDING if requires_approval else ApprovalStatus.NOT_REQUIRED

        record = ADEDecisionRecord(
            decision_id=decision_id,
            learner_id=event.learner_id,
            decision_type=dec_type,
            impact_level=impact.impact_level,
            status=initial_status,
            approval_status=approval_status,
            execution_status=ExecutionStatus.PENDING,
            trigger_event_id=event.event_id,
            correlation_id=event.correlation_id,
            causation_id=event.causation_id,
            target_executor=winning_candidate.target_executor,
            action_payload=winning_candidate.constraints,
            reason_codes=winning_candidate.reason_codes,
            rule_id=winning_candidate.rule_id,
            provenance=provenance,
            created_at=now_iso,
            updated_at=now_iso
        )

        # 10. Transition to VALIDATED
        DecisionStateMachine.assert_transition(record.status, DecisionStatus.VALIDATED)
        record.status = DecisionStatus.VALIDATED

        # 11. Governance Branching: Approval vs Autonomous Execution
        if requires_approval:
            DecisionStateMachine.assert_transition(record.status, DecisionStatus.APPROVAL_PENDING)
            record.status = DecisionStatus.APPROVAL_PENDING
        else:
            # Autonomous execution
            if dec_type != ADEDecisionType.NO_ACTION:
                cooldown_manager.activate_cooldown(event.learner_id, dec_type, scope_key)
                HandoffDispatcher.dispatch(record)
                ExecutionVerifier.record_execution_result(record, ExecutionStatus.SUCCESS)
            else:
                record.status = DecisionStatus.COMPLETED
                record.execution_status = ExecutionStatus.SUCCESS

        ade_repository.save_decision(record)
        return record

    def approve_decision(self, decision_id: str) -> ADEDecisionRecord:
        decision = ade_repository.get_decision(decision_id)
        if not decision:
            raise ValueError(f"Decision '{decision_id}' not found.")

        DecisionStateMachine.assert_transition(decision.status, DecisionStatus.APPROVED)
        decision.status = DecisionStatus.APPROVED
        decision.approval_status = ApprovalStatus.APPROVED

        # Dispatch and complete
        HandoffDispatcher.dispatch(decision)
        ExecutionVerifier.record_execution_result(decision, ExecutionStatus.SUCCESS)
        ade_repository.save_decision(decision)
        return decision

    def reject_decision(self, decision_id: str, reason: str = "") -> ADEDecisionRecord:
        decision = ade_repository.get_decision(decision_id)
        if not decision:
            raise ValueError(f"Decision '{decision_id}' not found.")

        DecisionStateMachine.assert_transition(decision.status, DecisionStatus.REJECTED)
        decision.status = DecisionStatus.REJECTED
        decision.approval_status = ApprovalStatus.REJECTED

        # Section 21: Repeated rejection increases suppression/cooldown
        cooldown_manager.activate_cooldown(
            decision.learner_id,
            decision.decision_type,
            decision.action_payload.get("target_id", "DEFAULT"),
            duration_seconds=604800  # 7 days suppression on rejection
        )
        ade_repository.save_decision(decision)
        return decision


ade_engine = ADEEngine()
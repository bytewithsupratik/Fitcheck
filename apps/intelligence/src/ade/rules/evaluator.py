# apps/intelligence/src/ade/rules/evaluator.py
import uuid
from typing import List
from src.ade.schemas import ADEDecisionContext, StructuredImpact, CandidateDecision
from src.ade.enums import ADEDecisionType, Executor
from src.ade.constants import (
    APPROVAL_MANDATORY_DECISIONS,
    DECISION_EXECUTORS,
    DECISION_PRECEDENCE,
    ADE_RULE_VERSION,
)
from src.ade.events.schemas import EventEnvelope


class RuleEvaluator:
    """
    Deterministic rule evaluations mapping verified signals to candidate decisions (Sections 15, 16).
    """

    @classmethod
    def evaluate_candidates(
        cls,
        event: EventEnvelope,
        impact: StructuredImpact,
        context: ADEDecisionContext
    ) -> List[CandidateDecision]:
        candidates: List[CandidateDecision] = []
        ev_type = event.event_type
        data = event.data or {}

        def create_candidate(dec_type: ADEDecisionType, rule_id: str, reasons: List[str], constraints: dict = None) -> CandidateDecision:
            return CandidateDecision(
                candidate_id=f"CND-{uuid.uuid4().hex[:8].upper()}",
                decision_type=dec_type,
                learner_id=event.learner_id,
                trigger_event_id=event.event_id,
                reason_codes=reasons,
                impact=impact,
                priority=DECISION_PRECEDENCE.get(dec_type, 10),
                target_executor=DECISION_EXECUTORS.get(dec_type, Executor.NONE),
                approval_required=(dec_type in APPROVAL_MANDATORY_DECISIONS),
                constraints=constraints or {},
                source_state={"cig_state_version": context.cig_state_version},
                provenance={"trigger_event": ev_type, "producer": event.producer},
                rule_id=rule_id,
                rule_version=ADE_RULE_VERSION
            )

        # --- RULE FAMILY 1: UPE Progress & Velocity Signals ---
        if ev_type == "PROGRESS_EVALUATED":
            trend = data.get("trend")
            vel_trend = data.get("velocity_trend")

            if trend == "DECLINING":
                candidates.append(create_candidate(ADEDecisionType.REDUCE_LOAD, "RULE-UPE-001", ["PROGRESS_DECLINING"], {"load_factor": -0.2}))
                candidates.append(create_candidate(ADEDecisionType.ADD_REMEDIATION, "RULE-UPE-002", ["PROGRESS_DECLINING_REMEDIATE"]))
            elif trend == "IMPROVING":
                candidates.append(create_candidate(ADEDecisionType.ADJUST_DIFFICULTY, "RULE-UPE-003", ["PROGRESS_IMPROVING_ACCELERATE"], {"direction": "UP"}))
                candidates.append(create_candidate(ADEDecisionType.INCREASE_LOAD, "RULE-UPE-004", ["PROGRESS_IMPROVING_LOAD"], {"load_factor": 0.2}))

            if vel_trend == "SLOWING" and trend != "DECLINING":
                candidates.append(create_candidate(ADEDecisionType.INCREASE_PRACTICE, "RULE-UPE-005", ["VELOCITY_SLOWING"]))
            elif vel_trend == "ACCELERATING" and trend != "IMPROVING":
                candidates.append(create_candidate(ADEDecisionType.INCREASE_LOAD, "RULE-UPE-006", ["VELOCITY_ACCELERATING"]))

        # --- RULE FAMILY 2: RIE Readiness Signals ---
        elif ev_type == "READINESS_EVALUATED":
            trend_dir = data.get("trend_direction")
            gap_count = data.get("priority_gap_count", 0)

            if gap_count >= 1:
                candidates.append(create_candidate(ADEDecisionType.ADD_REMEDIATION, "RULE-RIE-001", ["HIGH_PRIORITY_GAP_DETECTED"], {"gap_count": gap_count}))

            if trend_dir == "DECLINING":
                candidates.append(create_candidate(ADEDecisionType.CHANGE_SEQUENCE, "RULE-RIE-002", ["READINESS_DECLINING"]))
            elif trend_dir == "IMPROVING":
                candidates.append(create_candidate(ADEDecisionType.ADJUST_DIFFICULTY, "RULE-RIE-003", ["READINESS_IMPROVED"], {"direction": "UP"}))

        # --- RULE FAMILY 3: EIE Evidence Signals ---
        elif ev_type == "EVIDENCE_EVALUATED":
            candidates.append(create_candidate(ADEDecisionType.REASSESS_READINESS, "RULE-EIE-001", ["NEW_EVIDENCE_EVALUATED"]))

        # --- RULE FAMILY 4: CIE Career & Trajectory Signals ---
        elif ev_type == "TARGET_CHANGED":
          candidates.append(create_candidate(ADEDecisionType.REASSESS_TRAJECTORY,"RULE-CIE-001",["CAREER_TARGET_CHANGED"],))
        elif ev_type == "REQUIREMENTS_CHANGED":
          candidates.append(create_candidate(ADEDecisionType.CHANGE_TOPIC,"RULE-CIE-002",["REQUIREMENTS_CHANGED"],))
        elif ev_type == "TRAJECTORY_UPDATED":candidates.append(create_candidate(ADEDecisionType.REASSESS_TRAJECTORY,"RULE-CIE-003",["TRAJECTORY_MISMATCH"],))

        # --- RULE FAMILY 5: MIE Learning Execution Signals ---
        elif ev_type in ["EXPERIENCE_FAILED", "EXPERIENCE_BLOCKED", "EXPERIENCE_EXPIRED"]:
            candidates.append(create_candidate(ADEDecisionType.REGENERATE_LEARNING_EXPERIENCE, "RULE-MIE-001", [f"MIE_{ev_type}"]))
            candidates.append(create_candidate(ADEDecisionType.CHANGE_SEQUENCE, "RULE-MIE-002", [f"MIE_{ev_type}_RESEQUENCE"]))
        elif ev_type in ["EXPERIENCE_COMPLETED", "LEARNING_EXPERIENCE_COMPLETED"]:
            candidates.append(create_candidate(ADEDecisionType.GENERATE_LEARNING_EXPERIENCE, "RULE-MIE-003", ["STEP_COMPLETED"]))
            candidates.append(create_candidate(ADEDecisionType.ADJUST_DIFFICULTY, "RULE-MIE-004", ["STEP_COMPLETED_ADVANCE"], {"direction": "UP"}))

        # Default: If no candidates survive, fall back to NO_ACTION
        if not candidates:
            candidates.append(create_candidate(ADEDecisionType.NO_ACTION, "RULE-DEF-001", ["NO_ACTIONABLE_TRIGGERS"]))

        return candidates
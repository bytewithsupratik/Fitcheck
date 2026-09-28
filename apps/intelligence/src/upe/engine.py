# apps/intelligence/src/upe/engine.py
import uuid
from datetime import datetime, timezone

from src.upe.schemas import (
    UPEInput,
    ProgressEvaluation,
    SourceStateMetadata,
    ADESignalPayload,
)
from src.upe.constants import (
    UPE_MODEL_VERSION,
    DEFAULT_V_REF,
    DEFAULT_VELOCITY_EPSILON,
    DEFAULT_PROGRESS_EPSILON,
)
from src.upe.depth import DepthCalculator
from src.upe.velocity import VelocityCalculator
from src.upe.consistency import ConsistencyCalculator
from src.upe.alignment import AlignmentCalculator
from src.upe.aggregation import ProgressAggregator
from src.upe.trend import TrendEvaluator
from src.upe.provenance import ProvenanceBuilder
from src.upe.validator import UPEValidator
from src.upe.events import UPEEventBuilder
from src.upe.repository import upe_repository


class UniversalProgressEngineError(Exception):
    pass


class UniversalProgressEngine:
    """
    Main Orchestrator for UPE (Sections 2, 23).
    Converts validated learner-state changes and meaningful activity into standardized progress signals.
    """

    @classmethod
    def evaluate(cls, payload: UPEInput) -> ProgressEvaluation:
        # 1. Idempotency Check (Section 30)
        idempotency_key = f"{payload.learner_id}:{payload.cig_state_version}:{payload.active_goal_id}"
        existing = upe_repository.get_idempotent_evaluation(idempotency_key)
        if existing:
            return existing

        # Configuration parameters
        v_ref = payload.v_ref or DEFAULT_V_REF
        v_eps = payload.velocity_epsilon or DEFAULT_VELOCITY_EPSILON
        p_eps = payload.progress_epsilon or DEFAULT_PROGRESS_EPSILON

        # 2. Dimension 1: Depth & Capability Progress (Section 6 & 14)
        depth_score, cap_progress = DepthCalculator.calculate_depth(payload.capability_states)

        # 3. Dimension 2: Velocity (Section 7)
        velocity_score = VelocityCalculator.calculate_velocity(
            current_progress=payload.meaningful_progress_current,
            previous_progress=payload.meaningful_progress_previous,
            elapsed_time=payload.elapsed_time_units,
            v_ref=v_ref
        )

        # 4. Dimension 3: Consistency (Section 9)
        consistency_score = ConsistencyCalculator.calculate_consistency(payload.eligible_periods)

        # 5. Dimension 4: Alignment (Section 10)
        alignment_score = AlignmentCalculator.calculate_alignment(payload.recent_activity_signals)

        # 6. Overall Aggregation & Renormalization (Section 11)
        overall_progress, band, active_weights = ProgressAggregator.aggregate(
            depth=depth_score,
            velocity=velocity_score,
            consistency=consistency_score,
            alignment=alignment_score
        )

        # 7. Trends (Section 8 & 12)
        prev_progress = (
            payload.previous_progress.overall_progress
            if payload.previous_progress else None
        )
        prev_velocity = (
            payload.previous_progress.velocity
            if payload.previous_progress else None
        )
        trend_summary = TrendEvaluator.evaluate_trends(
            current_progress=overall_progress,
            previous_progress=prev_progress,
            current_velocity=velocity_score,
            previous_velocity=prev_velocity,
            progress_epsilon=p_eps,
            velocity_epsilon=v_eps
        )

        # 8. Provenance
        provenance = ProvenanceBuilder.build_provenance(
            cig_state_version=payload.cig_state_version,
            target_id=payload.target_id,
            v_ref=v_ref,
            velocity_epsilon=v_eps,
            progress_epsilon=p_eps,
            dimension_weights=active_weights
        )

        # 9. ADE Signal Payload (Section 19: Signals, Not Decisions)
        ade_signal = ADESignalPayload(
            overall_progress=overall_progress,
            depth=depth_score,
            velocity=velocity_score,
            consistency=consistency_score,
            alignment=alignment_score,
            overall_trend=trend_summary.overall,
            velocity_trend=trend_summary.velocity
        )

        eval_id = f"UPE-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        evaluation = ProgressEvaluation(
            evaluation_id=eval_id,
            learner_id=payload.learner_id,
            goal_id=payload.active_goal_id,
            target_id=payload.target_id,
            source_state=SourceStateMetadata(
                cig_state_version=payload.cig_state_version,
                previous_progress_evaluation_id=payload.previous_progress.evaluation_id if payload.previous_progress else None,
                generated_at=now_iso
            ),
            depth=depth_score,
            velocity=velocity_score,
            consistency=consistency_score,
            alignment=alignment_score,
            overall_progress=overall_progress,
            progress_band=band,
            trend=trend_summary,
            capability_progress=cap_progress,
            ade_signal=ade_signal,
            provenance=provenance,
            model_version=UPE_MODEL_VERSION,
            created_at=now_iso
        )

        # 10. Strict Output Validation Guard (Section 27)
        validated = UPEValidator.validate_evaluation(evaluation)

        # 11. Persist in Repository Cache & Emit CIG Event (Section 18 & 20)
        upe_repository.save_evaluation(validated, idempotency_key)
        UPEEventBuilder.build_progress_evaluated_event(validated)

        return validated
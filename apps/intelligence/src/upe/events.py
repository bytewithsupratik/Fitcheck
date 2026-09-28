# apps/intelligence/src/upe/events.py
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from src.upe.schemas import ProgressEvaluation


class UPEEventBuilder:
    """
    Builds the canonical PROGRESS_EVALUATED event contract (Section 18).
    """

    @classmethod
    def build_progress_evaluated_event(cls, evaluation: ProgressEvaluation) -> Dict[str, Any]:
        return {
            "event_id": f"EVT-UPE-{uuid.uuid4().hex[:8].upper()}",
            "event_type": "PROGRESS_EVALUATED",
            "producer": "UPE",
            "schema_version": "1.0",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "data": {
                "evaluation_id": evaluation.evaluation_id,
                "learner_id": evaluation.learner_id,
                "cig_state_version": evaluation.source_state.cig_state_version,
                "overall_progress": evaluation.overall_progress,
                "progress_band": evaluation.progress_band.value,
                "depth": evaluation.depth,
                "velocity": evaluation.velocity,
                "consistency": evaluation.consistency,
                "alignment": evaluation.alignment,
                "trend": evaluation.trend.overall.value,
                "velocity_trend": evaluation.trend.velocity.value,
                "model_version": evaluation.model_version
            }
        }
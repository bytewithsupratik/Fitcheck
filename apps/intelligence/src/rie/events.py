# apps/intelligence/src/rie/events.py
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from src.rie.schemas import RIEOutput


class RIEEventBuilder:
    @classmethod
    def build_readiness_evaluated_event(cls, output: RIEOutput) -> Dict[str, Any]:
        return {
            "event_id": f"EVT_{uuid.uuid4().hex[:8]}",
            "event_type": "READINESS_EVALUATED",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "producer": "RIE",
            "schema_version": "1.0",
            "data": {
                "rie_evaluation_id": output.rie_evaluation_id,
                "learner_id": output.learner_id,
                "goal_id": output.goal_id,
                "target_id": output.target_id,
                "overall_readiness": output.readiness.overall,
                "confidence": output.readiness.confidence,
                "interpretation": output.readiness.interpretation.value,
                "priority_gap_count": len(output.priority_gaps),
                "trend_direction": output.trend.direction.value,
                "provenance": output.provenance.model_dump()
            }
        }
# apps/intelligence/src/mie/events.py
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List

from src.mie.schemas import LearningExperience, CodingProject, AssessmentResult
from src.mie.enums import MIEEventType


class MIEEventBuilder:
    @classmethod
    def build_event(cls, event_type: MIEEventType, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "event_id": f"EVT-MIE-{uuid.uuid4().hex[:8].upper()}",
            "event_type": event_type.value,
            "schema_version": "1.0",
            "producer": "MIE",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "data": data
        }

    @classmethod
    def experience_generated(cls, experience: LearningExperience) -> Dict[str, Any]:
        return cls.build_event(
            MIEEventType.LEARNING_EXPERIENCE_GENERATED,
            {
                "experience_id": experience.experience_id,
                "learner_id": experience.learner_id,
                "goal_id": experience.goal_id,
                "target_id": experience.target_id,
                "cie_version": experience.source_state.cie_version,
                "rie_evaluation_id": experience.source_state.rie_evaluation_id,
                "cig_state_version": experience.source_state.cig_state_version,
                "difficulty": experience.difficulty.value,
                "version": experience.version
            }
        )

    @classmethod
    def project_submitted(cls, project: CodingProject, github_url: str) -> Dict[str, Any]:
        return cls.build_event(
            MIEEventType.PROJECT_SUBMITTED,
            {
                "project_id": project.project_id,
                "learner_id": project.learner_id,
                "github_url": github_url,
                "capability_targets": project.capability_ids
            }
        )

    @classmethod
    def assessment_completed(cls, result: AssessmentResult, capability_ids: List[str]) -> Dict[str, Any]:
        return cls.build_event(
            MIEEventType.ASSESSMENT_COMPLETED,
            {
                "assessment_id": result.assessment_id,
                "assessment_result_id": result.assessment_result_id,
                "learner_id": result.learner_id,
                "score": result.score.percentage,
                "capability_ids": capability_ids
            }
        )
# apps/intelligence/src/mie/experience/generator.py
import uuid
from datetime import datetime, timezone
from typing import List

from src.mie.schemas import (
    LearningExperience,
    ExperienceStep,
    SourceStateTrace,
    Resource,
    CodingProject,
    Assessment,
)
from src.mie.enums import ExperienceStatus, StepType
from src.evidence.schemas import ProficiencyLevel


class ExperienceGenerator:
    """
    Assembles the complete LearningExperience orchestration object (Sections 7, 8).
    """

    @classmethod
    def assemble_experience(
        cls,
        learner_id: str,
        goal_id: str,
        target_id: str,
        source_state: SourceStateTrace,
        capability_ids: List[str],
        learning_requirement_ids: List[str],
        resources: List[Resource],
        project: CodingProject,
        assessment: Assessment,
        difficulty: ProficiencyLevel,
    ) -> LearningExperience:
        experience_id = f"LE-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Build Sequence (Section 8: Resources -> Project -> Assessment)
        sequence: List[ExperienceStep] = []
        step_idx = 1

        for res in resources:
            sequence.append(
                ExperienceStep(
                    step=step_idx,
                    type=StepType.RESOURCE,
                    item_id=res.resource_id,
                    title=f"Study: {res.title}"
                )
            )
            step_idx += 1

        sequence.append(
            ExperienceStep(
                step=step_idx,
                type=StepType.PROJECT,
                item_id=project.project_id,
                title=f"Build: {project.title}"
            )
        )
        step_idx += 1

        sequence.append(
            ExperienceStep(
                step=step_idx,
                type=StepType.ASSESSMENT,
                item_id=assessment.assessment_id,
                title="Verify: Assessment Evaluation"
            )
        )

        total_duration = (
            sum(r.estimated_duration_minutes for r in resources) +
            project.estimated_duration_minutes +
            assessment.estimated_duration_minutes
        )

        return LearningExperience(
            experience_id=experience_id,
            learner_id=learner_id,
            goal_id=goal_id,
            target_id=target_id,
            source_state=source_state,
            capability_ids=capability_ids,
            learning_requirement_ids=learning_requirement_ids,
            resources=resources,
            coding_project=project,
            assessment=assessment,
            sequence=sequence,
            difficulty=difficulty,
            estimated_duration_minutes=total_duration,
            status=ExperienceStatus.GENERATED,
            version=1,
            created_at=now_iso,
            updated_at=now_iso
        )
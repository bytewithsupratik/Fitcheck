# apps/intelligence/src/mie/engine.py
from typing import List, Dict

from src.mie.schemas import (
    MIEInput,
    LearningExperience,
    SourceStateTrace,
)
from src.mie.constants import DIFFICULTY_RANKS, RANK_TO_PROFICIENCY
from src.mie.resources.selector import ResourceSelector
from src.mie.projects.generator import ProjectGenerator
from src.mie.projects.validator import ProjectValidator
from src.mie.assessments.generator import AssessmentGenerator
from src.mie.assessments.validator import AssessmentValidator
from src.mie.experience.generator import ExperienceGenerator
from src.mie.events import MIEEventBuilder
from src.mie.repository import mie_repository
from src.evidence.schemas import ProficiencyLevel


class MissionIntelligenceEngineError(Exception):
    pass


class MissionIntelligenceEngine:
    @classmethod
    def generate_learning_experience(cls, payload: MIEInput) -> LearningExperience:
        learner_ctx = payload.learner_context
        cie = payload.cie_requirements
        rie = payload.rie_handoff

        if not cie.capability_requirements:
            raise MissionIntelligenceEngineError("Missing CIE capability requirements in MIE input.")

        if rie.priority_gaps:
            target_caps = [g.capability_id for g in rie.priority_gaps]
        else:
            target_caps = [cr.capability_id for cr in cie.capability_requirements]

        target_learning_req_ids = [
            lr.requirement_id for lr in cie.learning_requirements if lr.capability_id in target_caps
        ]

        learner_current_ranks: Dict[str, int] = {}
        for cs in payload.cig_context.capability_states:
            cid = cs.get("capability_id")
            prof = cs.get("proficiency")
            if cid and prof:
                learner_current_ranks[cid] = DIFFICULTY_RANKS.get(ProficiencyLevel(prof), 1)

        ranks = [learner_current_ranks.get(c, 1) for c in target_caps]
        avg_rank = sum(ranks) / max(1, len(ranks))
        exp_rank = min(4, max(1, int(avg_rank + 1)))
        experience_difficulty = RANK_TO_PROFICIENCY[exp_rank]

        selected_resources = ResourceSelector.select_resources(
            target_capability_ids=target_caps,
            target_learning_req_ids=target_learning_req_ids,
            learner_difficulty=experience_difficulty
        )

        project = ProjectGenerator.generate_project(
            learner_id=learner_ctx.learner_id,
            target_id=learner_ctx.target_id,
            capability_requirements=cie.capability_requirements,
            learning_requirements=cie.learning_requirements,
            experience_requirement=cie.experience_requirements[0] if cie.experience_requirements else None,
            learner_current_ranks=learner_current_ranks,
            highest_priority_caps=target_caps
        )
        ProjectValidator.validate(project, [cr.capability_id for cr in cie.capability_requirements])

        assessment = AssessmentGenerator.generate_assessment(
            learner_id=learner_ctx.learner_id,
            experience_id="PENDING",
            target_id=learner_ctx.target_id,
            capability_ids=target_caps,
            difficulty=experience_difficulty
        )
        AssessmentValidator.validate(assessment, [cr.capability_id for cr in cie.capability_requirements])

        source_state = SourceStateTrace(
            cie_version=cie.cie_version,
            rie_evaluation_id=rie.readiness_evaluation_id,
            cig_state_version=learner_ctx.current_state_version
        )

        experience = ExperienceGenerator.assemble_experience(
            learner_id=learner_ctx.learner_id,
            goal_id=learner_ctx.goal_id,
            target_id=learner_ctx.target_id,
            source_state=source_state,
            capability_ids=target_caps,
            learning_requirement_ids=target_learning_req_ids,
            resources=selected_resources,
            project=project,
            assessment=assessment,
            difficulty=experience_difficulty
        )

        experience.coding_project.project_id = f"PROJ-{experience.experience_id[-8:]}"
        experience.assessment.experience_id = experience.experience_id

        mie_repository.save_experience(experience)
        MIEEventBuilder.experience_generated(experience)

        return experience
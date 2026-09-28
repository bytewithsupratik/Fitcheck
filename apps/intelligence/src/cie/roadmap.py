# apps/intelligence/src/cie/roadmap.py
from typing import List, Dict
from src.cie.schemas import (
    TargetProfile,
    Roadmap,
    RoadmapStage,
    RoadmapStageType,
    RequirementImportance,
)


class RoadmapBuilder:
    """
    Constructs an objective, multi-stage curriculum for a given Career or Domain target.
    Section 15: Does not force every career into one universal roadmap;
    stages vary dynamically based on target requirements and prerequisites.
    """

    @classmethod
    def build_roadmap(cls, target_profile: TargetProfile) -> Roadmap:
        target_id = target_profile.target.target_id
        roadmap_id = f"RDM-{target_id}"

        # Group learning requirements by prerequisite depth
        # Items without prerequisites form Foundation; items with prerequisites form Core/Applied
        foundation_caps: List[str] = []
        foundation_lrs: List[str] = []
        core_caps: List[str] = []
        core_lrs: List[str] = []
        applied_caps: List[str] = []
        applied_lrs: List[str] = []

        lr_map = {lr.requirement_id: lr for lr in target_profile.learning_requirements}

        for lr in target_profile.learning_requirements:
            if not lr.prerequisite_ids:
                foundation_lrs.append(lr.requirement_id)
                if lr.capability_id not in foundation_caps:
                    foundation_caps.append(lr.capability_id)
            else:
                core_lrs.append(lr.requirement_id)
                if lr.capability_id not in core_caps:
                    core_caps.append(lr.capability_id)

        # Distribute capabilities based on importance if learning requirements were sparse
        for cap_req in target_profile.capability_requirements:
            c_id = cap_req.capability_id
            if c_id not in foundation_caps and c_id not in core_caps and c_id not in applied_caps:
                if cap_req.importance == RequirementImportance.CORE:
                    core_caps.append(c_id)
                elif cap_req.importance == RequirementImportance.IMPORTANT:
                    applied_caps.append(c_id)
                else:
                    applied_caps.append(c_id)

        # Assemble Roadmap Stages
        stages: List[RoadmapStage] = []
        order = 1

        # Stage 1: Foundation
        if foundation_caps or foundation_lrs:
            stages.append(
                RoadmapStage(
                    stage_id=f"STAGE-{target_id}-FOUNDATION",
                    name="Core Prerequisites & Foundations",
                    stage_type=RoadmapStageType.FOUNDATION,
                    order=order,
                    capability_ids=foundation_caps,
                    learning_requirement_ids=foundation_lrs
                )
            )
            order += 1

        # Stage 2: Core Engineering
        if core_caps or core_lrs:
            stages.append(
                RoadmapStage(
                    stage_id=f"STAGE-{target_id}-CORE",
                    name="Target Core Capabilities",
                    stage_type=RoadmapStageType.CORE,
                    order=order,
                    capability_ids=core_caps,
                    learning_requirement_ids=core_lrs
                )
            )
            order += 1

        # Stage 3: Applied Systems & Deployment
        if applied_caps:
            stages.append(
                RoadmapStage(
                    stage_id=f"STAGE-{target_id}-APPLIED",
                    name="Applied Systems & Production Integration",
                    stage_type=RoadmapStageType.APPLIED,
                    order=order,
                    capability_ids=applied_caps,
                    learning_requirement_ids=applied_lrs
                )
            )

        return Roadmap(
            roadmap_id=roadmap_id,
            target_id=target_id,
            version=target_profile.version,
            stages=stages
        )
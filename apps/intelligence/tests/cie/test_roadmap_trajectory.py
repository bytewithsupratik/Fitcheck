# apps/intelligence/tests/cie/test_roadmap_trajectory.py
import sys
from pathlib import Path

# Add apps/intelligence to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.cie.schemas import (
    CIEGoalInput,
    CIECapabilityInput,
    TargetType,
    ProficiencyLevel,
    MasteryLevel,
    TrajectoryStatus,
)
from src.cie.taxonomy import DynamicTaxonomyRegistry
from src.cie.matcher import DeterministicMatcher
from src.cie.roadmap import RoadmapBuilder
from src.cie.trajectory import TrajectoryBuilder


@pytest.fixture
def taxonomy_registry():
    return DynamicTaxonomyRegistry()


def test_roadmap_builder_creates_ordered_stages(taxonomy_registry):
    profile = taxonomy_registry.get_profile("CAREER-AI-ENGINEER")
    roadmap = RoadmapBuilder.build_roadmap(profile)

    assert roadmap.target_id == "CAREER-AI-ENGINEER"
    assert len(roadmap.stages) >= 2
    
    # Check ordering
    orders = [s.order for s in roadmap.stages]
    assert orders == sorted(orders)
    assert roadmap.stages[0].stage_type.value == "FOUNDATION"


def test_trajectory_large_capability_gap(taxonomy_registry):
    """
    Section 17: Large gap learner (Frontend Dev aiming for AI Engineer)
    must start at Stage 1 (Foundation) without being rejected.
    """
    profile = taxonomy_registry.get_profile("CAREER-AI-ENGINEER")
    goal = CIEGoalInput(
        goal_id="GOAL_SWITCH_01",
        target_id="CAREER-AI-ENGINEER",
        target_type=TargetType.CAREER,
        priority="HIGH"
    )

    # Learner only has Frontend skills (React, CSS)
    frontend_learner_caps = [
        CIECapabilityInput(
            capability_id="CAP-REACT",
            proficiency=ProficiencyLevel.PROFICIENT,
            mastery=MasteryLevel.DEMONSTRATED,
            confidence=0.90
        ),
        CIECapabilityInput(
            capability_id="CAP-CSS",
            proficiency=ProficiencyLevel.PROFICIENT,
            mastery=MasteryLevel.DEMONSTRATED,
            confidence=0.88
        )
    ]

    alignment, _ = DeterministicMatcher.match(profile, goal, frontend_learner_caps)
    roadmap = RoadmapBuilder.build_roadmap(profile)
    
    trajectory = TrajectoryBuilder.build_trajectory(
        goal_id=goal.goal_id,
        target_id=goal.target_id,
        starting_state_version="CIG_STATE_001",
        roadmap=roadmap,
        alignment=alignment
    )

    assert trajectory.status == TrajectoryStatus.ACTIVE
    # Must position learner at Foundation stage due to missing Python prerequisite
    assert "FOUNDATION" in trajectory.current_stage_id


def test_trajectory_completed_learner(taxonomy_registry):
    """Learner who already meets all criteria should have trajectory status COMPLETED."""
    profile = taxonomy_registry.get_profile("CAREER-AI-ENGINEER")
    goal = CIEGoalInput(
        goal_id="GOAL_DONE_01",
        target_id="CAREER-AI-ENGINEER",
        target_type=TargetType.CAREER,
        priority="HIGH"
    )

    all_caps = [
        CIECapabilityInput(
            capability_id=req.capability_id,
            proficiency=req.expected_proficiency,
            mastery=MasteryLevel.DEMONSTRATED,
            confidence=0.90
        )
        for req in profile.capability_requirements
    ]

    alignment, _ = DeterministicMatcher.match(profile, goal, all_caps)
    roadmap = RoadmapBuilder.build_roadmap(profile)

    trajectory = TrajectoryBuilder.build_trajectory(
        goal_id=goal.goal_id,
        target_id=goal.target_id,
        starting_state_version="CIG_STATE_099",
        roadmap=roadmap,
        alignment=alignment
    )

    assert trajectory.status == TrajectoryStatus.COMPLETED
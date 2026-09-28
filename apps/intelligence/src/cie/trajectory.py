# apps/intelligence/src/cie/trajectory.py
import uuid
from src.cie.schemas import (
    Roadmap,
    AlignmentResult,
    Trajectory,
    TrajectoryStatus,
)


class TrajectoryBuilder:
    """
    Constructs a learner-specific transit trajectory connecting their current CIG state
    to the target roadmap.
    """

    @classmethod
    def build_trajectory(
        cls,
        goal_id: str,
        target_id: str,
        starting_state_version: str,
        roadmap: Roadmap,
        alignment: AlignmentResult,
    ) -> Trajectory:
        trajectory_id = f"TRJ-{goal_id}-{uuid.uuid4().hex[:6]}"

        missing_cap_ids = {m.capability_id for m in alignment.missing}

        # Determine the learner's active stage:
        # Find the earliest stage in the roadmap where the learner still has missing capabilities
        current_stage_id = None
        for stage in roadmap.stages:
            stage_has_gaps = any(cid in missing_cap_ids for cid in stage.capability_ids)
            if stage_has_gaps:
                current_stage_id = stage.stage_id
                break

        # If learner has zero gaps across all stages, they are at the final stage
        if current_stage_id is None and roadmap.stages:
            current_stage_id = roadmap.stages[-1].stage_id

        # Determine status
        status = TrajectoryStatus.ACTIVE
        if not alignment.missing and alignment.supporting:
            status = TrajectoryStatus.COMPLETED

        return Trajectory(
            trajectory_id=trajectory_id,
            goal_id=goal_id,
            target_id=target_id,
            starting_state_version=starting_state_version,
            roadmap_id=roadmap.roadmap_id,
            current_stage_id=current_stage_id,
            status=status,
            version="1.0"
        )
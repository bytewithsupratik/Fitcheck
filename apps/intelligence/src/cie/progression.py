# apps/intelligence/src/cie/progression.py
from typing import Dict, Any, List
from src.cie.schemas import TargetProfile


class ProgressionBuilder:
    """
    Constructs primary seniority ladder progression paths (Section 22).
    Keeps immediate roadmap focused on current target without premature replacement.
    """

    @classmethod
    def build_progression(cls, target_profile: TargetProfile) -> Dict[str, Any]:
        return {
            "current_target_id": target_profile.target.target_id,
            "target_name": target_profile.target.name,
            "seniority_ladder": target_profile.progression_paths,
            "next_logical_tier": (
                target_profile.progression_paths[0]
                if target_profile.progression_paths
                else None
            ),
        }
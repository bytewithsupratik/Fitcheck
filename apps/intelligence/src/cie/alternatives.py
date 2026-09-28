# apps/intelligence/src/cie/alternatives.py
from typing import List
from src.cie.schemas import (
    TargetProfile,
    AlternativeDirection,
    AlternativeContext,
    CIEGoalInput,
    CIECapabilityInput,
)
from src.cie.taxonomy import DynamicTaxonomyRegistry
from src.cie.matcher import DeterministicMatcher


class AlternativesBuilder:
    """
    Identifies aligned alternative directions without replacing the active goal (Section 23).
    """

    @classmethod
    def find_alternatives(
        cls,
        active_goal: CIEGoalInput,
        current_profile: TargetProfile,
        taxonomy_registry: DynamicTaxonomyRegistry,
        learner_capabilities: List[CIECapabilityInput],
    ) -> List[AlternativeDirection]:
        alternatives: List[AlternativeDirection] = []

        all_targets = taxonomy_registry.list_targets()

        for target in all_targets:
            # Skip the active goal target itself
            if target.target_id == active_goal.target_id:
                continue

            candidate_profile = taxonomy_registry.get_profile(target.target_id)

            # Evaluate fit against candidate target
            _, candidate_relevance = DeterministicMatcher.match(
                target_profile=candidate_profile,
                goal=active_goal,
                learner_capabilities=learner_capabilities
            )

            # Accept as alternative if relevance meets baseline threshold (0.25)
            if candidate_relevance.score >= 0.25:
                alternatives.append(
                    AlternativeDirection(
                        target_id=target.target_id,
                        relevance=candidate_relevance.score,
                        reason=f"Parallel direction sharing foundational competencies with your profile ({target.name}).",
                        context=AlternativeContext.ACTIVE_GOAL
                    )
                )

        # Sort by relevance descending
        alternatives.sort(key=lambda x: x.relevance, reverse=True)
        
        # If none met the threshold, provide the top available target as fallback
        if not alternatives and len(all_targets) > 1:
            fallback_target = next(t for t in all_targets if t.target_id != active_goal.target_id)
            alternatives.append(
                AlternativeDirection(
                    target_id=fallback_target.target_id,
                    relevance=0.25,
                    reason=f"Available industry pathway ({fallback_target.name}).",
                    context=AlternativeContext.ACTIVE_GOAL
                )
            )

        return alternatives[:3]
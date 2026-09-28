# apps/intelligence/src/rie/mie_handoff.py
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from src.rie.schemas import RIEOutput, PriorityGap


class MIEMissionInputItem(BaseModel):
    """
    Contract consumed by MIE to generate targeted learning missions.
    Section 36: RIE supplies the gap; MIE designs the exercise.
    """
    capability_id: str
    target_proficiency: str
    current_proficiency: str
    gap_units: int
    normalized_gap: float
    urgency_priority: float
    importance_tier: str
    recommended_focus: str


class MIEHandoffPayload(BaseModel):
    learner_id: str
    goal_id: str
    target_id: str
    rie_evaluation_id: str
    overall_readiness: float
    confidence: float
    mission_candidates: List[MIEMissionInputItem] = Field(default_factory=list)


class MIEHandoffBuilder:
    @classmethod
    def build_mie_handoff(cls, output: RIEOutput) -> MIEHandoffPayload:
        candidates = []
        for g in output.priority_gaps:
            # Describe the instructional focus for MIE
            if g.attained_proficiency is None:
                focus = "FOUNDATION_BOOTSTRAP"  # Untested / 0 evidence -> start from basics
            elif g.gap >= 2:
                focus = "DEEP_PRACTICE"         # Large multi-rank gap -> extensive project
            else:
                focus = "POLISH_AND_VERIFY"     # Single-rank gap -> target challenge/assessment

            candidates.append(
                MIEMissionInputItem(
                    capability_id=g.capability_id,
                    target_proficiency=g.required_proficiency.value,
                    current_proficiency=g.attained_proficiency.value if g.attained_proficiency else "NONE",
                    gap_units=g.gap,
                    normalized_gap=g.normalized_gap,
                    urgency_priority=g.priority,
                    importance_tier=g.importance.value,
                    recommended_focus=focus
                )
            )

        return MIEHandoffPayload(
            learner_id=output.learner_id,
            goal_id=output.goal_id,
            target_id=output.target_id,
            rie_evaluation_id=output.rie_evaluation_id,
            overall_readiness=output.readiness.overall,
            confidence=output.readiness.confidence,
            mission_candidates=candidates
        )
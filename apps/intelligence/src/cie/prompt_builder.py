# apps/intelligence/src/cie/prompt_builder.py
import json
from typing import Dict, Any
from src.cie.schemas import (
    TargetProfile,
    AlignmentResult,
    RelevanceResult,
    Roadmap,
    Trajectory,
)


class CIEPromptBuilder:
    """
    Translates pre-computed, deterministic career facts into structured prompts.
    Strictly prevents the LLM from inventing new capabilities or recalculating math.
    """

    @staticmethod
    def build_synthesis_prompt(
        target_profile: TargetProfile,
        alignment: AlignmentResult,
        relevance: RelevanceResult,
        roadmap: Roadmap,
        trajectory: Trajectory,
    ) -> Dict[str, str]:
        system_prompt = """
You are the senior career advisory intelligence engine of CareerOS (CIE).
Your task is to provide objective, empowering, and human-readable explanations of pre-computed career requirements.

CRITICAL INVARIANTS:
1. Grounding: Base your explanation STRICTLY on the provided pre-computed facts.
2. Anti-Hallucination: Do NOT invent new skill requirements or dependencies not provided in the input.
3. No Mathematical Re-calculation: Do NOT change the relevance score or recalculate readiness.
4. Professional & Direct: Be concise, clear, and action-oriented.
5. Strict JSON Output: Respond ONLY with a valid JSON object adhering to this exact schema:
{
  "summary": "Brief 1-2 sentence overview of the learner's alignment with the target",
  "gap_narrative": "Clear narrative detailing the primary capability gaps to bridge",
  "trajectory_rationale": "Clear explanation of why the learner starts at their assigned roadmap stage"
}
"""

        user_payload: Dict[str, Any] = {
            "target": {
                "id": target_profile.target.target_id,
                "name": target_profile.target.name,
                "type": target_profile.target.target_type.value,
                "description": target_profile.description
            },
            "deterministic_relevance": {
                "score": relevance.score,
                "confidence": relevance.confidence,
                "breakdown": relevance.breakdown
            },
            "capability_alignment": {
                "supporting_capabilities": [
                    {
                        "capability_id": c.capability_id,
                        "current_proficiency": c.current_proficiency.value if c.current_proficiency else None,
                        "confidence": c.confidence
                    }
                    for c in alignment.supporting
                ],
                "missing_capabilities": [
                    {
                        "capability_id": c.capability_id,
                        "importance": c.importance.value,
                        "expected_proficiency": c.expected_proficiency.value
                    }
                    for c in alignment.missing
                ]
            },
            "roadmap_and_trajectory": {
                "roadmap_id": roadmap.roadmap_id,
                "active_stage_id": trajectory.current_stage_id,
                "total_stages": len(roadmap.stages),
                "stages_overview": [
                    {"stage_id": s.stage_id, "name": s.name, "type": s.stage_type.value, "order": s.order}
                    for s in roadmap.stages
                ]
            }
        }

        return {
            "system_prompt": system_prompt.strip(),
            "user_prompt": json.dumps(user_payload, indent=2)
        }
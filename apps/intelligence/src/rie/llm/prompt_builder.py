# apps/intelligence/src/rie/llm/prompt_builder.py
import json
from typing import Dict, Any
from src.rie.schemas import (
    ReadinessScores,
    PriorityGap,
    ReadinessTrend,
)


class RIEPromptBuilder:
    """
    Builds constrained prompt context for RIE explanations (Sections 30, 34).
    Sends ONLY pre-computed numbers, gaps, and trend data.
    """

    @staticmethod
    def build_explanation_prompt(
        target_id: str,
        readiness: ReadinessScores,
        priority_gaps: list[PriorityGap],
        trend: ReadinessTrend,
    ) -> Dict[str, str]:
        system_prompt = """
You are the senior readiness intelligence component of CareerOS (RIE).
Your task is to provide objective, clear, and grounded explanations of a learner's pre-computed readiness evaluation.

CRITICAL INVARIANTS:
1. Grounding: Base your explanation STRICTLY on the provided pre-computed numbers and gaps.
2. No Mathematical Modification: You CANNOT change the readiness score, confidence, or priority order.
3. No Hallucinations: Do NOT invent capabilities, missing evidence, or courses.
4. Professional & Direct: Explain WHY the learner has their readiness level and what their biggest priority gaps mean.
5. Strict JSON Output: Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "Brief 1-2 sentence executive overview of current readiness",
  "readiness_explanation": "Explanation of how technical capabilities, evidence, and consistency shaped the score",
  "priority_gap_explanations": [
    {
      "capability_id": "CAP-NAME",
      "explanation": "Why this specific gap is a high priority"
    }
  ],
  "trend_explanation": "Explanation of the readiness trend (improving, stable, or declining)",
  "confidence_explanation": "Clear distinction between what readiness measures vs what confidence measures"
}
"""

        user_payload: Dict[str, Any] = {
            "target_id": target_id,
            "readiness": {
                "overall_score": readiness.overall,
                "interpretation": readiness.interpretation.value,
                "technical_capability": readiness.technical_capability,
                "evidence_strength": readiness.evidence_strength,
                "experience": readiness.experience,
                "consistency": readiness.consistency,
                "goal_alignment": readiness.goal_alignment,
                "reliability_confidence": readiness.confidence,
                "active_weights": readiness.active_weights
            },
            "priority_gaps": [
                {
                    "capability_id": g.capability_id,
                    "gap_size": g.gap,
                    "normalized_gap": g.normalized_gap,
                    "importance": g.importance.value,
                    "priority_score": g.priority,
                    "attained_proficiency": g.attained_proficiency.value if g.attained_proficiency else "NONE",
                    "required_proficiency": g.required_proficiency.value,
                    "state": g.state.value
                }
                for g in priority_gaps[:5]  # Top 5 priority gaps
            ],
            "trend": {
                "current": trend.current,
                "previous": trend.previous,
                "delta": trend.delta,
                "direction": trend.direction.value
            }
        }

        return {
            "system_prompt": system_prompt.strip(),
            "user_prompt": json.dumps(user_payload, indent=2)
        }
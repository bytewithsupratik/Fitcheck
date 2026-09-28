# apps/intelligence/src/mie/llm/prompt_builder.py
import json
from typing import Dict, Any, List
from src.evidence.schemas import ProficiencyLevel


class MIEPromptBuilder:
    """
    Constructs constrained prompts for project narrative and assessment question synthesis.
    Enforces strict capability grounding and JSON schemas (Sections 17, 23).
    """

    @staticmethod
    def build_project_enrichment_prompt(
        target_id: str,
        capability_ids: List[str],
        difficulty: ProficiencyLevel,
        functional_requirements: List[Dict[str, Any]],
    ) -> Dict[str, str]:
        system_prompt = """
You are the principal engineering curriculum designer of CareerOS (MIE).
Your task is to enrich a pre-computed coding project with an engaging, realistic industry scenario and milestone task descriptions.

CRITICAL INVARIANTS:
1. Grounding: You MUST ONLY address the specified capabilities. Do NOT add new tools or libraries.
2. Technical Rigor: Reflect production-grade architecture appropriate for the given difficulty.
3. No Hallucinations: Do NOT alter functional requirements or capability IDs.
4. Strict JSON Output: Respond ONLY with a valid JSON object matching this schema:
{
  "title": "Engaging, professional project title",
  "scenario_description": "2-3 sentence realistic industry problem scenario",
  "enriched_milestones": [
    {
      "milestone_id": "M1",
      "title": "Milestone title",
      "tasks": ["Task 1", "Task 2"]
    }
  ]
}
"""

        user_payload: Dict[str, Any] = {
            "target_id": target_id,
            "capability_ids": capability_ids,
            "difficulty": difficulty.value,
            "functional_requirements": functional_requirements,
        }

        return {
            "system_prompt": system_prompt.strip(),
            "user_prompt": json.dumps(user_payload, indent=2)
        }

    @staticmethod
    def build_question_synthesis_prompt(
        capability_id: str,
        difficulty: ProficiencyLevel,
    ) -> Dict[str, str]:
        system_prompt = f"""
You are the technical assessment designer of CareerOS (MIE).
Generate one high-quality, practical production scenario MCQ for the capability: {capability_id}.

CRITICAL INVARIANTS:
1. Strictly test practical knowledge, architectural tradeoffs, or error handling in {capability_id}.
2. Provide exactly 4 options with plausible distractors and exactly 1 correct answer.
3. No trick questions or trivia. Focus on real-world engineering decisions.
4. Strict JSON Output: Respond ONLY with a valid JSON object matching this schema:
{{
  "prompt": "Detailed real-world scenario question text",
  "options": [
    {{"option_id": "opt-a", "text": "Option A text"}},
    {{"option_id": "opt-b", "text": "Option B text"}},
    {{"option_id": "opt-c", "text": "Option C text"}},
    {{"option_id": "opt-d", "text": "Option D text"}}
  ],
  "expected_answer": "opt-a",
  "explanation": "Clear explanation of why this answer is correct"
}}
"""

        user_payload: Dict[str, Any] = {
            "capability_id": capability_id,
            "difficulty": difficulty.value,
        }

        return {
            "system_prompt": system_prompt.strip(),
            "user_prompt": json.dumps(user_payload, indent=2)
        }
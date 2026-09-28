# apps/intelligence/src/mie/llm/synthesizer.py
import os
import json
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

from src.evidence.schemas import ProficiencyLevel
from src.mie.llm.prompt_builder import MIEPromptBuilder
from src.mie.llm.validator import MIELLMValidator

load_dotenv()


class MIESynthesizer:
    """
    Executes constrained LLM synthesis for MIE using OpenRouter / OpenAI.
    Validates output and provides robust deterministic fallbacks (Sections 53, 54, 59).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        # If api_key is explicitly passed (including empty string ""), respect it;
        # otherwise fall back to environment variables.
        if api_key is not None:
            self.api_key = api_key if api_key else None
        else:
            self.api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")

        self.model = model or os.getenv("LLM_MODEL", "openai/gpt-4o-mini")
        self.base_url = base_url or os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    def enrich_project(
        self,
        target_id: str,
        capability_ids: List[str],
        difficulty: ProficiencyLevel,
        functional_requirements: List[Dict[str, Any]],
        fallback_title: str,
        fallback_description: str,
        fallback_milestones: List[Any],
    ) -> Dict[str, Any]:
        expected_milestone_ids = [m.milestone_id for m in fallback_milestones]

        if self.api_key:
            try:
                prompts = MIEPromptBuilder.build_project_enrichment_prompt(
                    target_id=target_id,
                    capability_ids=capability_ids,
                    difficulty=difficulty,
                    functional_requirements=functional_requirements
                )
                raw_json = self._call_llm(prompts["system_prompt"], prompts["user_prompt"])
                return MIELLMValidator.validate_project_enrichment(raw_json, expected_milestone_ids)
            except Exception as e:
                print(f"[MIE Synthesizer] Project enrichment LLM call failed, using deterministic fallback: {e}")

        # Deterministic fallback
        return {
            "title": fallback_title,
            "scenario_description": fallback_description,
            "enriched_milestones": [
                {"milestone_id": m.milestone_id, "title": m.title, "tasks": m.tasks}
                for m in fallback_milestones
            ]
        }

    def synthesize_scenario_question(
        self,
        capability_id: str,
        difficulty: ProficiencyLevel,
        fallback_question: Dict[str, Any]
    ) -> Dict[str, Any]:
        if self.api_key:
            try:
                prompts = MIEPromptBuilder.build_question_synthesis_prompt(
                    capability_id=capability_id,
                    difficulty=difficulty
                )
                raw_json = self._call_llm(prompts["system_prompt"], prompts["user_prompt"])
                return MIELLMValidator.validate_synthesized_question(raw_json)
            except Exception as e:
                print(f"[MIE Synthesizer] Question synthesis LLM call failed, using deterministic fallback: {e}")

        return fallback_question

    def _call_llm(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        from openai import OpenAI
        client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers={
                "HTTP-Referer": "https://careeros.local",
                "X-Title": "CareerOS-MIE"
            }
        )
        response = client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)
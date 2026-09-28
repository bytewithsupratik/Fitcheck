# apps/intelligence/src/cie/synthesizer.py
import os
import json
from typing import Optional
from dotenv import load_dotenv

from src.cie.schemas import (
    TargetProfile,
    AlignmentResult,
    RelevanceResult,
    Roadmap,
    Trajectory,
    CIEReasoning,
)
from src.cie.prompt_builder import CIEPromptBuilder

load_dotenv()


class CIESynthesizer:
    """
    Constrained LLM Orchestrator for CIE.
    Consumes prompts from CIEPromptBuilder, invokes OpenRouter/OpenAI,
    and returns validated CIEReasoning models.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.model = model or os.getenv("LLM_MODEL", "openai/gpt-4o-mini")
        self.base_url = base_url or os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    def synthesize(
        self,
        target_profile: TargetProfile,
        alignment: AlignmentResult,
        relevance: RelevanceResult,
        roadmap: Roadmap,
        trajectory: Trajectory,
    ) -> CIEReasoning:
        # 1. Build prompt via dedicated builder
        prompts = CIEPromptBuilder.build_synthesis_prompt(
            target_profile=target_profile,
            alignment=alignment,
            relevance=relevance,
            roadmap=roadmap,
            trajectory=trajectory
        )

        # 2. Invoke live LLM if API key is present
        if self.api_key:
            try:
                return self._call_llm(prompts["system_prompt"], prompts["user_prompt"])
            except Exception as e:
                print(f"[CIE Synthesizer] LLM invocation failed, using deterministic fallback: {e}")

        # 3. Deterministic rule-based fallback
        return self._deterministic_fallback(target_profile, alignment, relevance, trajectory)

    def _call_llm(self, system_prompt: str, user_prompt: str) -> CIEReasoning:
        from openai import OpenAI

        client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers={
                "HTTP-Referer": "https://careeros.local",
                "X-Title": "CareerOS-CIE"
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

        content = response.choices[0].message.content
        raw_json = json.loads(content)
        return CIEReasoning.model_validate(raw_json)

    def _deterministic_fallback(
        self,
        target_profile: TargetProfile,
        alignment: AlignmentResult,
        relevance: RelevanceResult,
        trajectory: Trajectory,
    ) -> CIEReasoning:
        target_name = target_profile.target.name
        supporting_list = [c.capability_id for c in alignment.supporting]
        missing_list = [c.capability_id for c in alignment.missing]

        supporting_str = ", ".join(supporting_list) or "none currently demonstrated"
        missing_str = ", ".join(missing_list[:4]) or "all core requirements met"

        summary = (
            f"Your current profile demonstrates a {int(relevance.score * 100)}% "
            f"relevance match toward becoming a {target_name}."
        )
        gap_narrative = (
            f"Your demonstrated background supports {supporting_str}. Key capability gaps "
            f"to bridge for this role are {missing_str}."
        )
        trajectory_rationale = (
            f"You are positioned at stage '{trajectory.current_stage_id}' to build foundational "
            "competencies before progressing to advanced specialization."
        )

        return CIEReasoning(
            summary=summary,
            gap_narrative=gap_narrative,
            trajectory_rationale=trajectory_rationale
        )
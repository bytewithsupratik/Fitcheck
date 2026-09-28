# apps/intelligence/src/rie/llm/synthesizer.py
import os
import json
from typing import Optional, List
from dotenv import load_dotenv

from src.rie.schemas import (
    ReadinessScores,
    PriorityGap,
    ReadinessTrend,
    RIEExplanation,
    PriorityGapExplanation,
)
from src.rie.llm.prompt_builder import RIEPromptBuilder

load_dotenv()


class RIESynthesizer:
    """
    Executes constrained LLM reasoning for RIE explanations (Sections 30, 31, 33).
    Ensures mathematical authority remains strictly with the deterministic engine.
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

    def explain(
        self,
        target_id: str,
        readiness: ReadinessScores,
        priority_gaps: List[PriorityGap],
        trend: ReadinessTrend,
    ) -> RIEExplanation:
        prompts = RIEPromptBuilder.build_explanation_prompt(
            target_id=target_id,
            readiness=readiness,
            priority_gaps=priority_gaps,
            trend=trend
        )

        if self.api_key:
            try:
                return self._call_llm(prompts["system_prompt"], prompts["user_prompt"])
            except Exception as e:
                print(f"[RIE Synthesizer] LLM invocation failed, using deterministic fallback: {e}")

        return self._deterministic_fallback(target_id, readiness, priority_gaps, trend)

    def _call_llm(self, system_prompt: str, user_prompt: str) -> RIEExplanation:
        from openai import OpenAI

        client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers={
                "HTTP-Referer": "https://careeros.local",
                "X-Title": "CareerOS-RIE"
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
        return RIEExplanation.model_validate(raw_json)

    def _deterministic_fallback(
        self,
        target_id: str,
        readiness: ReadinessScores,
        priority_gaps: List[PriorityGap],
        trend: ReadinessTrend,
    ) -> RIEExplanation:
        pct = int(readiness.overall * 100)
        band = readiness.interpretation.value

        summary = (
            f"Your current readiness for {target_id} is evaluated at {pct}% ({band}), "
            f"with a reliability confidence of {int(readiness.confidence * 100)}%."
        )

        readiness_explanation = (
            f"Technical capabilities scored {int(readiness.technical_capability * 100)}%. "
            f"Evidence strength contributed {int((readiness.evidence_strength or 0.0) * 100)}%. "
            "Scores are normalized based on all available dimensions."
        )

        gap_exps = []
        for g in priority_gaps[:3]:
            gap_exps.append(
                PriorityGapExplanation(
                    capability_id=g.capability_id,
                    explanation=(
                        f"{g.capability_id} is a {g.importance.value} requirement. "
                        f"Target requires {g.required_proficiency.value}, but current state is "
                        f"{g.attained_proficiency.value if g.attained_proficiency else 'NOT DEMONSTRATED'}."
                    )
                )
            )

        if trend.direction.value == "IMPROVING":
            trend_explanation = f"Your readiness improved by {abs(round((trend.delta or 0.0) * 100, 1))}% compared to previous assessment."
        elif trend.direction.value == "DECLINING":
            trend_explanation = f"Readiness shows a delta of {round((trend.delta or 0.0) * 100, 1)}% due to newly introduced target requirements."
        else:
            trend_explanation = "Readiness is stable with no significant change from previous state."

        confidence_explanation = (
            f"Readiness ({pct}%) indicates how closely current abilities meet role criteria, "
            f"while confidence ({int(readiness.confidence * 100)}%) reflects the empirical verification depth."
        )

        return RIEExplanation(
            summary=summary,
            readiness_explanation=readiness_explanation,
            priority_gap_explanations=gap_exps,
            trend_explanation=trend_explanation,
            confidence_explanation=confidence_explanation
        )
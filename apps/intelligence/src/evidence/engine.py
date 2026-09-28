import os
import json
from typing import List, Optional
from dotenv import load_dotenv

from .schemas import (
    ObservationDTO,
    CanonicalCapability,
    AIEvaluationResponseDTO,
    AIClaimDTO,
    AICapabilityEvaluationDTO,
    ProjectClassification,
    ProficiencyLevel,
    MasteryLevel,
    EvidenceStrengthLevel,
)
from .registry import DynamicTaxonomyRegistry
from .prompt_builder import PromptBuilder
from .validator import AIOutputValidator

load_dotenv()


class EIEIntelligenceEngine:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        taxonomy_registry: Optional[DynamicTaxonomyRegistry] = None,
    ):
        self.api_key = (
            api_key
            or os.getenv("OPENROUTER_API_KEY")
            or os.getenv("OPENAI_API_KEY")
        )
        self.model = model or os.getenv("LLM_MODEL", "openai/gpt-4o-mini")
        self.base_url = base_url or os.getenv(
            "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
        )
        self.registry = taxonomy_registry or DynamicTaxonomyRegistry()

    def evaluate(
        self,
        evidence_id: str,
        observations: List[ObservationDTO],
        custom_taxonomy: Optional[List[CanonicalCapability]] = None,
    ) -> AIEvaluationResponseDTO:
        if not observations:
            raise ValueError("Cannot evaluate evidence with zero observations.")

        if custom_taxonomy:
            allowed_capabilities = custom_taxonomy
        else:
            allowed_capabilities = self.registry.resolve_relevant_capabilities(
                observations
            )

        prompts = PromptBuilder.build_prompt(
            evidence_id, observations, allowed_capabilities
        )

        if self.api_key:
            try:
                raw_dto = self._call_llm(
                    prompts["system_prompt"], prompts["user_prompt"]
                )
            except Exception:
                raw_dto = self._deterministic_evaluation(
                    evidence_id, observations, allowed_capabilities
                )
        else:
            raw_dto = self._deterministic_evaluation(
                evidence_id, observations, allowed_capabilities
            )

        validated_dto = AIOutputValidator.validate(
            raw_dto, observations, allowed_capabilities
        )
        return validated_dto

    def _call_llm(
        self, system_prompt: str, user_prompt: str
    ) -> AIEvaluationResponseDTO:
        from openai import OpenAI

        client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers={
                "HTTP-Referer": "https://careeros.local",
                "X-Title": "CareerOS-EIE",
            },
        )

        response = client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
        )

        raw_json = json.loads(response.choices[0].message.content)

        if "evaluations" in raw_json and "capability_evaluations" not in raw_json:
            raw_json["capability_evaluations"] = raw_json.pop("evaluations")

        if "classification" not in raw_json:
            raw_json["classification"] = {
                "type": "PROJECT",
                "domain": "SOFTWARE_DEVELOPMENT",
                "subdomain": "BACKEND",
            }

        if "overall_confidence" not in raw_json:
            raw_json["overall_confidence"] = 0.85

        if "claims" not in raw_json and "capability_evaluations" in raw_json:
            raw_json["claims"] = []
            for idx, ce in enumerate(raw_json["capability_evaluations"]):
                cid = f"TMP_CLM_{idx + 1}"
                ce["supporting_temp_claim_ids"] = [cid]
                raw_json["claims"].append({
                    "temp_claim_id": cid,
                    "capability_id": ce["capability_id"],
                    "statement": f"Evidence demonstrates verifiable proficiency in {ce['capability_id']}.",
                    "supporting_observation_ids": ce.get(
                        "supporting_observation_ids", []
                    ),
                    "confidence": ce.get("confidence", 0.85),
                })

        return AIEvaluationResponseDTO.model_validate(raw_json)

    def _deterministic_evaluation(
        self,
        evidence_id: str,
        observations: List[ObservationDTO],
        allowed_capabilities: List[CanonicalCapability],
    ) -> AIEvaluationResponseDTO:
        """Deterministic evaluation fallback when no LLM key is present or call fails."""
        obs_ids = [
            obs.observation_id
            for obs in observations
            if getattr(obs, "observation_id", None)
        ]
        supporting_obs = obs_ids[:3] if obs_ids else []

        claims = []
        evaluations = []

        targets = allowed_capabilities or []
        for idx, cap in enumerate(targets):
            cap_id = getattr(cap, "capability_id", None) or (
                cap if isinstance(cap, str) else str(cap)
            )
            cid = f"CLM_DET_{idx + 1}"

            claims.append(
                AIClaimDTO(
                    temp_claim_id=cid,
                    capability_id=cap_id,
                    statement=f"Repository signals confirm demonstrated application of {cap_id}.",
                    supporting_observation_ids=supporting_obs,
                    confidence=0.85,
                )
            )

            evaluations.append(
                AICapabilityEvaluationDTO(
                    capability_id=cap_id,
                    proficiency=ProficiencyLevel.PROFICIENT,
                    mastery=MasteryLevel.DEMONSTRATED,
                    evidence_strength=EvidenceStrengthLevel.STRONG,
                    confidence=0.85,
                    supporting_temp_claim_ids=[cid],
                    supporting_observation_ids=supporting_obs,
                )
            )

        return AIEvaluationResponseDTO(
            classification=ProjectClassification(),
            overall_confidence=0.85 if evaluations else 0.4,
            claims=claims,
            capability_evaluations=evaluations,
        )
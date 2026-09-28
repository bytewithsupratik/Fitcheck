# apps/intelligence/src/evidence/prompt_builder.py
import json
from typing import List, Dict, Any
from .schemas import (
    ObservationDTO,
    CanonicalCapability,
    ProficiencyLevel,
    MasteryLevel,
    EvidenceStrengthLevel,
)


class PromptBuilder:
    @staticmethod
    def build_prompt(
        evidence_id: str,
        observations: List[ObservationDTO],
        allowed_capabilities: List[CanonicalCapability]
    ) -> Dict[str, str]:
        allowed_ids = [c.capability_id for c in allowed_capabilities]

        system_prompt = f"""
You are the senior evaluation intelligence engine of FitCheck (EIE).
Your task is to objectively evaluate learner evidence based STRICTLY on verifiable facts.

CRITICAL INVARIANTS:
1. Anti-Hallucination: Evaluate ONLY capabilities supported by observations. Never invent skills.
2. Canonical IDs: Use ONLY capability IDs from this allowed list:
{json.dumps(allowed_ids, indent=2)}
3. Traceability: Every single claim MUST list 1 or more exact 'observation_id's from the provided input.

CALIBRATION & SCORING RUBRIC (DO NOT USE THE SAME SCORE FOR EVERYTHING):
- Evidence Strength:
  * WEAK: Technology is merely declared as a dependency in package.json with no corroborating code or usage proof.
  * MODERATE: Technology is both declared and corroborated by file structures, components, or styles.
  * STRONG: Core framework with extensive component structure or architectural presence.
  * VERY_STRONG: Fully integrated production architecture with test coverage and custom configuration.

- Proficiency & Mastery:
  * If only package.json is present -> proficiency: FOUNDATIONAL or DEVELOPING, mastery: PARTIALLY_DEMONSTRATED.
  * If full components, routing, and styling exist -> proficiency: PROFICIENT, mastery: DEMONSTRATED.

- Confidence (Assign realistic, varied floats based on evidence quality):
  * Weak/Single-file proof Mentioned in dependency manifest only, no verification of deep architectural usage: 0.10 to 0.50
  * Moderate multi-file proof Manifest dependency + related files/components detected.: 0.51 to 0.79
  * Core framework with substantial project integration, custom configurations, and routing/components: 0.80 to 0.92
  * Strong architectural proof Comprehensive usage verified with automated tests and architecture.: 0.93 to 1.00
  DO NOT give 0.85 to all capabilities! Vary your confidence based on how much evidence exists.

EXACT JSON OUTPUT SCHEMA:
{{
  "classification": {{
    "type": "PROJECT",
    "domain": "SOFTWARE_DEVELOPMENT",
    "subdomain": "FRONTEND"
  }},
  "overall_confidence": 0.82,
  "claims": [
    {{
      "temp_claim_id": "TMP_CLM_01",
      "capability_id": "CAP-NEXTJS",
      "statement": "Evidence demonstrates fullstack React architecture using Next.js framework.",
      "supporting_observation_ids": ["OBS_DEP_next"],
      "confidence": 0.88
    }}
  ],
  "capability_evaluations": [
    {{
      "capability_id": "CAP-NEXTJS",
      "proficiency": "PROFICIENT",
      "mastery": "DEMONSTRATED",
      "evidence_strength": "STRONG",
      "confidence": 0.88,
      "supporting_temp_claim_ids": ["TMP_CLM_01"],
      "supporting_observation_ids": ["OBS_DEP_next"]
    }}
  ]
}}
"""

        user_payload: Dict[str, Any] = {
            "evidence_id": evidence_id,
            "allowed_capabilities": [
                {
                    "id": cap.capability_id,
                    "name": cap.name,
                    "category": cap.category,
                    "description": cap.description
                }
                for cap in allowed_capabilities
            ],
            "allowed_proficiency_levels": [p.value for p in ProficiencyLevel],
            "allowed_mastery_levels": [m.value for m in MasteryLevel],
            "allowed_evidence_strengths": [s.value for s in EvidenceStrengthLevel],
            "observations": [
                {
                    "observation_id": obs.observation_id,
                    "category": obs.category.value,
                    "name": obs.name,
                    "value": obs.value,
                    "source_location": obs.source_location
                }
                for obs in observations
            ]
        }

        return {
            "system_prompt": system_prompt.strip(),
            "user_prompt": json.dumps(user_payload, indent=2)
        }
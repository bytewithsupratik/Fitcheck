# apps/intelligence/src/evidence/validator.py
from typing import List, Set, Dict, Tuple
from .schemas import (
    ObservationDTO,
    AIEvaluationResponseDTO,
    CanonicalCapability,
    EvidenceStrengthLevel,
)


class InvalidAIOutputException(Exception):
    """Raised when the AI invents facts, observations, or non-canonical capabilities."""
    pass


class AIOutputValidator:
    # Strict Mathematical Confidence Bounds per Evidence Strength (Section 14 & 15)
    STRENGTH_CONFIDENCE_BOUNDS: Dict[EvidenceStrengthLevel, Tuple[float, float]] = {
        EvidenceStrengthLevel.WEAK: (0.10, 0.50),
        EvidenceStrengthLevel.MODERATE: (0.51, 0.79),
        EvidenceStrengthLevel.STRONG: (0.80, 0.92),
        EvidenceStrengthLevel.VERY_STRONG: (0.93, 1.00),
    }

    @classmethod
    def validate(
        cls,
        raw_response: AIEvaluationResponseDTO,
        verified_observations: List[ObservationDTO],
        allowed_capabilities: List[CanonicalCapability]
    ) -> AIEvaluationResponseDTO:
        valid_observation_ids: Set[str] = {obs.observation_id for obs in verified_observations}
        allowed_capability_ids: Set[str] = {c.capability_id for c in allowed_capabilities}

        temp_claim_ids: Set[str] = set()

        # 1. Validate Claims
        for claim in raw_response.claims:
            if claim.capability_id not in allowed_capability_ids:
                raise InvalidAIOutputException(
                    f"AI generated capability '{claim.capability_id}' which is not in the allowed taxonomy."
                )

            for obs_id in claim.supporting_observation_ids:
                if obs_id not in valid_observation_ids:
                    raise InvalidAIOutputException(
                        f"AI hallucinated observation ID: '{obs_id}' in claim '{claim.temp_claim_id}'."
                    )

            temp_claim_ids.add(claim.temp_claim_id)

        # 2. Validate & Calibrate Capability Evaluations
        for cap_eval in raw_response.capability_evaluations:
            if cap_eval.capability_id not in allowed_capability_ids:
                raise InvalidAIOutputException(
                    f"AI evaluated capability '{cap_eval.capability_id}' which is not in the allowed taxonomy."
                )

            for claim_temp_id in cap_eval.supporting_temp_claim_ids:
                if claim_temp_id not in temp_claim_ids:
                    raise InvalidAIOutputException(
                        f"Capability evaluation references undeclared claim: '{claim_temp_id}'"
                    )

            for obs_id in cap_eval.supporting_observation_ids:
                if obs_id not in valid_observation_ids:
                    raise InvalidAIOutputException(
                        f"Capability evaluation references nonexistent observation ID: '{obs_id}'"
                    )

            # --- MATHEMATICAL BOUNDS ENFORCEMENT ---
            min_conf, max_conf = cls.STRENGTH_CONFIDENCE_BOUNDS[cap_eval.evidence_strength]
            
            # If the LLM assigned a confidence outside the allowed range for this strength:
            if not (min_conf <= cap_eval.confidence <= max_conf):
                # Deterministically recalibrate and clamp to the correct range
                clamped_conf = round(max(min_conf, min(cap_eval.confidence, max_conf)), 2)
                
                # If it was drastically out of range (like WEAK with 0.70), scale it proportionately
                if cap_eval.evidence_strength == EvidenceStrengthLevel.WEAK and cap_eval.confidence > max_conf:
                    # Map [0.51 - 1.0] down into [0.30 - 0.48]
                    clamped_conf = round(0.30 + (cap_eval.confidence - 0.5) * 0.36, 2)
                    clamped_conf = min(clamped_conf, 0.49)
                elif cap_eval.evidence_strength == EvidenceStrengthLevel.STRONG and cap_eval.confidence < min_conf:
                    clamped_conf = min_conf

                cap_eval.confidence = clamped_conf

        # 3. Recalculate Overall Confidence deterministically as the weighted mean of capability confidences
        if raw_response.capability_evaluations:
            raw_response.overall_confidence = round(
                sum(c.confidence for c in raw_response.capability_evaluations) / len(raw_response.capability_evaluations),
                2
            )

        return raw_response
# apps/intelligence/src/cie/provenance.py
from typing import Dict, Any, List
from src.cie.schemas import TargetProfile, AlignmentResult


class ProvenanceBuilder:
    """
    Builds versioned traceability metadata linking conclusions back to CIG state and taxonomy.
    """

    @classmethod
    def build_provenance(
        cls,
        input_state_version: str,
        target_profile: TargetProfile,
        alignment: AlignmentResult,
    ) -> Dict[str, Any]:
        return {
            "input_state_version": input_state_version,
            "taxonomy_version": target_profile.target.taxonomy_version,
            "profile_version": target_profile.version,
            "requirement_sources": [
                {
                    "target_id": target_profile.target.target_id,
                    "requirements_count": len(target_profile.capability_requirements)
                }
            ],
            "learner_state_sources": [
                {
                    "capability_id": c.capability_id,
                    "matched_as": c.status,
                    "confidence": c.confidence
                }
                for c in alignment.required
            ],
        }
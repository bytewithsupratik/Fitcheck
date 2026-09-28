# In apps/intelligence/src/cie/engine.py
import uuid
from datetime import datetime, timezone
from typing import Optional

from src.cie.schemas import (
    CIEInput,
    CIEOutput,
    CIERequirements,
)
from src.cie.taxonomy import DynamicTaxonomyRegistry, TargetNotFoundError
from src.cie.matcher import DeterministicMatcher
from src.cie.roadmap import RoadmapBuilder
from src.cie.trajectory import TrajectoryBuilder
from src.cie.progression import ProgressionBuilder
from src.cie.alternatives import AlternativesBuilder
from src.cie.provenance import ProvenanceBuilder
from src.cie.validator import CIEValidator
from src.cie.synthesizer import CIESynthesizer


class CareerIntelligenceEngine:
    def __init__(
        self,
        taxonomy_registry: Optional[DynamicTaxonomyRegistry] = None,
        synthesizer: Optional[CIESynthesizer] = None
    ):
        self.registry = taxonomy_registry or DynamicTaxonomyRegistry()
        self.synthesizer = synthesizer or CIESynthesizer()

    def evaluate(self, payload: CIEInput) -> CIEOutput:
        eval_id = f"CIE_{uuid.uuid4().hex[:8]}"
        target_id = payload.goal.target_id

        # 1. Target Resolution
        target_profile = self.registry.get_profile(target_id)

        # 2. Deterministic Matching & Gap Analysis (50/30/20 formula)
        alignment_result, relevance_result = DeterministicMatcher.match(
            target_profile=target_profile,
            goal=payload.goal,
            learner_capabilities=payload.capabilities,
            career_dna=payload.career_dna
        )

        # 3. High-level Roadmap
        roadmap = RoadmapBuilder.build_roadmap(target_profile)

        # 4. Trajectory
        trajectory = TrajectoryBuilder.build_trajectory(
            goal_id=payload.goal.goal_id,
            target_id=target_id,
            starting_state_version=payload.state_version,
            roadmap=roadmap,
            alignment=alignment_result
        )

        # 5. Progression Ladder
        progression = ProgressionBuilder.build_progression(target_profile)

        # 6. Alternatives
        alternatives = AlternativesBuilder.find_alternatives(
            active_goal=payload.goal,
            current_profile=target_profile,
            taxonomy_registry=self.registry,
            learner_capabilities=payload.capabilities
        )

        # 7. LLM Interpretation & Synthesis Layer
        reasoning = self.synthesizer.synthesize(
            target_profile=target_profile,
            alignment=alignment_result,
            relevance=relevance_result,
            roadmap=roadmap,
            trajectory=trajectory
        )

        # 8. Traceability Provenance
        provenance = ProvenanceBuilder.build_provenance(
            input_state_version=payload.state_version,
            target_profile=target_profile,
            alignment=alignment_result
        )

        # 9. Package Requirements
        requirements = CIERequirements(
            learning=target_profile.learning_requirements,
            experience=target_profile.experience_requirements,
            evidence=target_profile.evidence_expectations
        )

        # 10. Assemble Output DTO
        output = CIEOutput(
            cie_evaluation_id=eval_id,
            learner_id=payload.learner_id,
            goal_id=payload.goal.goal_id,
            input_state_version=payload.state_version,
            target=target_profile.target,
            relevance=relevance_result,
            capability_alignment=alignment_result,
            requirements=requirements,
            roadmap=roadmap,
            trajectory=trajectory,
            progression=progression,
            alternative_directions=alternatives,
            reasoning=reasoning,
            provenance=provenance,
            generated_at=datetime.now(timezone.utc).isoformat()
        )

        # 11. Final Validation Guard
        return CIEValidator.validate_output(output)
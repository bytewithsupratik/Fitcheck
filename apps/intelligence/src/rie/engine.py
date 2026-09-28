# apps/intelligence/src/rie/engine.py
import uuid
from datetime import datetime, timezone
from typing import Optional

from src.rie.schemas import (
    RIEInput,
    RIEOutput,
)
from src.rie.capability import CapabilityReadinessEvaluator
from src.rie.evidence import EvidenceReadinessEvaluator
from src.rie.experience import ExperienceReadinessEvaluator
from src.rie.gaps import GapAnalyzer
from src.rie.aggregation import ReadinessAggregator
from src.rie.trend import TrendEvaluator
from src.rie.provenance import ProvenanceBuilder
from src.rie.validator import RIEValidator
from src.rie.llm.synthesizer import RIESynthesizer


class ReadinessIntelligenceEngineError(Exception):
    pass


class ReadinessIntelligenceEngine:
    """
    Main RIE Orchestrator (Sections 2, 3, 4, 49).
    Calculates deterministic readiness state from CIG learner state and CIE target requirements.
    """

    # In apps/intelligence/src/rie/engine.py


    @classmethod
    def evaluate(
        cls,
        payload: RIEInput,
        include_explanation: bool = True
    ) -> RIEOutput:
        learner_state = payload.learner_state
        cie_reqs = payload.cie_requirements

        if not cie_reqs.capability_requirements:
            raise ReadinessIntelligenceEngineError("Missing CIE capability requirements.")

        eval_id = f"RIE_{uuid.uuid4().hex[:8]}"

        # 1. Technical Capability Readiness (Sections 9, 10, 12)
        evaluated_caps, tech_readiness = CapabilityReadinessEvaluator.evaluate_capabilities(
            requirements=cie_reqs.capability_requirements,
            learner_states=learner_state.capabilities
        )

        # 2. Evidence Readiness (Section 13)
        _, evidence_readiness = EvidenceReadinessEvaluator.evaluate_evidence(
            expectations=cie_reqs.evidence_expectations,
            learner_states=learner_state.capabilities
        )

        # 3. Experience Readiness (Section 14)
        experience_readiness = ExperienceReadinessEvaluator.evaluate_experience(
            requirements=cie_reqs.experience_requirements,
            experience_state=learner_state.experience_state
        )

        # 4. Consistency Readiness (Section 15)
        consistency_readiness = learner_state.consistency

        # 5. Goal Alignment (Section 16)
        goal_alignment = 1.0

        # 6. Overall Confidence (Section 17)
        overall_confidence = ReadinessAggregator.calculate_confidence(evaluated_caps)

        # 7. Overall Readiness & Renormalization (Sections 18, 19, 20)
        readiness_scores = ReadinessAggregator.aggregate_overall(
            technical_readiness=tech_readiness,
            evidence_readiness=evidence_readiness,
            experience_readiness=experience_readiness,
            consistency=consistency_readiness,
            goal_alignment=goal_alignment,
            overall_confidence=overall_confidence
        )

        # 8. Gap Analysis & Priority Calculation (Sections 21, 22, 23)
        priority_gaps = GapAnalyzer.analyze_gaps(evaluated_caps)

        # 9. Readiness Trend (Section 24)
        trend = TrendEvaluator.evaluate_trend(
            current_readiness=readiness_scores.overall,
            previous_evaluation=payload.previous_evaluation
        )

        # 10. Provenance Assembly (Sections 26, 27)
        provenance = ProvenanceBuilder.build_provenance(
            cig_state_version=learner_state.state_version,
            cie_evaluation_id=cie_reqs.cie_evaluation_id,
            cie_version=cie_reqs.cie_version
        )

        # 11. Optional Post-Validation LLM Explanation Layer (Sections 29-33)
        explanation = None
        if include_explanation:
            synthesizer = RIESynthesizer()
            explanation = synthesizer.explain(
                target_id=cie_reqs.target_id,
                readiness=readiness_scores,
                priority_gaps=priority_gaps,
                trend=trend
            )

        # 12. Assemble Output DTO
        output = RIEOutput(
            rie_evaluation_id=eval_id,
            learner_id=learner_state.learner_id,
            goal_id=learner_state.goal_id,
            target_id=cie_reqs.target_id,
            input_state_version=learner_state.state_version,
            cie_evaluation_id=cie_reqs.cie_evaluation_id,
            cie_version=cie_reqs.cie_version,
            readiness=readiness_scores,
            capabilities=evaluated_caps,
            priority_gaps=priority_gaps,
            trend=trend,
            provenance=provenance,
            explanation=explanation,
            generated_at=datetime.now(timezone.utc).isoformat()
        )

        # 13. Final Validator Guard (Section 28)
        return RIEValidator.validate_output(output)
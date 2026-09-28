# apps/intelligence/src/evidence/cig_event.py
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from src.evidence.schemas import (
    AIEvaluationResponseDTO,
    ObservationDTO
)


class CapabilityEvidencePayload(BaseModel):
    capability_id: str
    proficiency: str
    mastery: str
    evidence_strength: str
    confidence: float
    supporting_claims: List[str]
    supporting_observations: List[str]


class ProvenanceMetadata(BaseModel):
    evidence_type: str
    source_reference: str
    audit_chain: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Detailed audit trace linking evaluation -> claim -> observation -> source location"
    )


class EvidenceEvaluatedData(BaseModel):
    evaluation_id: str
    evidence_id: str
    user_id: str
    classification: Dict[str, Any]
    capabilities: List[CapabilityEvidencePayload]
    provenance: ProvenanceMetadata
    evaluated_at: str


class CIGEvidenceEvaluatedEvent(BaseModel):
    """
    Standard CareerOS Contract for EIE -> CIG communication (Section 32)
    """
    event_id: str
    event_type: str = "EVIDENCE_EVALUATED"
    occurred_at: str
    producer: str = "EIE"
    schema_version: str = "1.0"
    data: EvidenceEvaluatedData


class CIGEventBuilder:
    @staticmethod
    def build_event(
        evaluation: AIEvaluationResponseDTO,
        evidence_id: str,
        user_id: str,
        evidence_type: str,
        source_reference: str,
        observations: List[ObservationDTO],
        evaluation_id: Optional[str] = None
    ) -> CIGEvidenceEvaluatedEvent:
        eval_id = evaluation_id or f"EVAL_{uuid.uuid4().hex[:8]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Build quick observation lookup
        obs_map = {obs.observation_id: obs for obs in observations}

        # Build full Provenance Audit Chain
        audit_chain = []
        for claim in evaluation.claims:
            for obs_id in claim.supporting_observation_ids:
                obs = obs_map.get(obs_id)
                audit_chain.append({
                    "claim_id": claim.temp_claim_id,
                    "capability_id": claim.capability_id,
                    "statement": claim.statement,
                    "observation_id": obs_id,
                    "source_location": obs.source_location if obs else "unknown",
                    "observed_fact": obs.value if obs else None
                })

        # Map capabilities to CIG payload format
        capabilities_payload = []
        for ce in evaluation.capability_evaluations:
            capabilities_payload.append(
                CapabilityEvidencePayload(
                    capability_id=ce.capability_id,
                    proficiency=ce.proficiency.value,
                    mastery=ce.mastery.value,
                    evidence_strength=ce.evidence_strength.value,
                    confidence=ce.confidence,
                    supporting_claims=ce.supporting_temp_claim_ids,
                    supporting_observations=ce.supporting_observation_ids
                )
            )

        data = EvidenceEvaluatedData(
            evaluation_id=eval_id,
            evidence_id=evidence_id,
            user_id=user_id,
            classification=evaluation.classification.model_dump(),
            capabilities=capabilities_payload,
            provenance=ProvenanceMetadata(
                evidence_type=evidence_type,
                source_reference=source_reference,
                audit_chain=audit_chain
            ),
            evaluated_at=now_iso
        )

        return CIGEvidenceEvaluatedEvent(
            event_id=f"EVT_{uuid.uuid4().hex[:8]}",
            event_type="EVIDENCE_EVALUATED",
            occurred_at=now_iso,
            producer="EIE",
            schema_version="1.0",
            data=data
        )
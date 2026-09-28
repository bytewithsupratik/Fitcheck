# apps/intelligence/tests/test_cig_event.py
import pytest
from src.evidence.schemas import (
    ObservationDTO,
    ObservationCategory,
    CanonicalCapability
)
from src.evidence.engine import EIEIntelligenceEngine
from src.evidence.registry import DynamicTaxonomyRegistry
from src.evidence.cig_event import CIGEventBuilder


def test_cig_event_contract_format_and_provenance():
    # 1. Setup observations
    observations = [
        ObservationDTO(
            observation_id="OBS_PG_01",
            evidence_id="EV_SQL_01",
            category=ObservationCategory.DATABASE,
            name="pg",
            value="8.11.3",
            source_location="package.json:dependencies.pg"
        )
    ]

    # 2. Setup dynamic capability
    taxonomy = [
        CanonicalCapability(
            capability_id="CAP-POSTGRESQL",
            name="PostgreSQL Databases",
            category="DATABASE",
            description="Interacting with PostgreSQL databases."
        )
    ]

    registry = DynamicTaxonomyRegistry(capabilities=taxonomy)
    engine = EIEIntelligenceEngine(taxonomy_registry=registry)

    # 3. Run evaluation
    eval_result = engine.evaluate("EV_SQL_01", observations)

    # 4. Format CIG Event
    event = CIGEventBuilder.build_event(
        evaluation=eval_result,
        evidence_id="EV_SQL_01",
        user_id="USR_SANKA_01",
        evidence_type="github_repository",
        source_reference="https://github.com/user/postgres-app",
        observations=observations
    )

    # 5. Validate CIG Event Spec (Section 32)
    assert event.event_type == "EVIDENCE_EVALUATED"
    assert event.producer == "EIE"
    assert event.schema_version == "1.0"
    assert event.data.user_id == "USR_SANKA_01"
    assert event.data.evidence_id == "EV_SQL_01"
    assert len(event.data.capabilities) == 1
    assert event.data.capabilities[0].capability_id == "CAP-POSTGRESQL"

    # 6. Validate Provenance Audit Trail (Section 16 & 33)
    provenance = event.data.provenance
    assert provenance.evidence_type == "github_repository"
    assert provenance.source_reference == "https://github.com/user/postgres-app"
    assert len(provenance.audit_chain) > 0
    assert provenance.audit_chain[0]["observation_id"] == "OBS_PG_01"
    assert provenance.audit_chain[0]["source_location"] == "package.json:dependencies.pg"
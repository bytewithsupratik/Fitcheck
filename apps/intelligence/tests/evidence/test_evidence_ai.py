import sys
from pathlib import Path

# Injects apps/intelligence into Python search path before importing src
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.evidence.schemas import (
    ObservationDTO,
    ObservationCategory,
    CanonicalCapability,
    AIEvaluationResponseDTO,
    AIClaimDTO,
    AICapabilityEvaluationDTO,
    ProjectClassification,
    ProficiencyLevel,
    MasteryLevel,
    EvidenceStrengthLevel
)
import pytest
from unittest.mock import patch
from src.evidence.engine import EIEIntelligenceEngine
from src.evidence.registry import DynamicTaxonomyRegistry
from src.evidence.validator import AIOutputValidator, InvalidAIOutputException


@patch("src.evidence.engine.EIEIntelligenceEngine._call_llm")
def test_evaluates_completely_new_domain_dynamically(mock_call_llm):
    new_taxonomies = [
        CanonicalCapability(
            capability_id="CAP-DOCKER",
            name="Docker Containerization",
            category="DEVOPS",
            description="Container packaging and multi-stage Dockerfile configuration."
        ),
        CanonicalCapability(
            capability_id="CAP-KUBERNETES",
            name="Kubernetes Orchestration",
            category="DEVOPS",
            description="Managing containerized workloads and services."
        )
    ]

    registry = DynamicTaxonomyRegistry(capabilities=new_taxonomies)
    engine = EIEIntelligenceEngine(taxonomy_registry=registry)

    docker_observations = [
        ObservationDTO(
            observation_id="OBS_DOCKERFILE_01",
            evidence_id="EV_DEVOPS_99",
            category=ObservationCategory.STRUCTURE,
            name="docker",
            value={"base_image": "node:20-alpine", "exposed_ports": [3000]},
            source_location="Dockerfile"
        )
    ]

    mock_call_llm.return_value = AIEvaluationResponseDTO(
        classification=ProjectClassification(),
        overall_confidence=0.88,
        claims=[
            AIClaimDTO(
                temp_claim_id="TMP_DOCKER_01",
                capability_id="CAP-DOCKER",
                statement="Evidence demonstrates container configuration with Dockerfile.",
                supporting_observation_ids=["OBS_DOCKERFILE_01"],
                confidence=0.88
            )
        ],
        capability_evaluations=[
            AICapabilityEvaluationDTO(
                capability_id="CAP-DOCKER",
                proficiency=ProficiencyLevel.FOUNDATIONAL,
                mastery=MasteryLevel.DEMONSTRATED,
                evidence_strength=EvidenceStrengthLevel.STRONG,
                confidence=0.88,
                supporting_temp_claim_ids=["TMP_DOCKER_01"],
                supporting_observation_ids=["OBS_DOCKERFILE_01"]
            )
        ]
    )

    result = engine.evaluate(evidence_id="EV_DEVOPS_99", observations=docker_observations)

    assert len(result.claims) == 1
    assert result.claims[0].capability_id == "CAP-DOCKER"
    assert result.claims[0].supporting_observation_ids == ["OBS_DOCKERFILE_01"]
    assert result.capability_evaluations[0].proficiency.value in ["FOUNDATIONAL", "PROFICIENT"]


def test_validator_rejects_hallucinated_observation_id():
    valid_observations = [
        ObservationDTO(
            observation_id="OBS_VALID_01",
            evidence_id="EV_001",
            category=ObservationCategory.DEPENDENCY,
            name="express",
            value="4.19.2",
            source_location="package.json:dependencies.express"
        )
    ]

    allowed_caps = [
        CanonicalCapability(
            capability_id="CAP-EXPRESS",
            name="Express.js Framework",
            category="BACKEND",
            description="Building server applications with Express."
        )
    ]

    hallucinated_response = AIEvaluationResponseDTO(
        classification=ProjectClassification(),
        overall_confidence=0.85,
        claims=[
            AIClaimDTO(
                temp_claim_id="TMP_01",
                capability_id="CAP-EXPRESS",
                statement="Builds Express servers.",
                supporting_observation_ids=["OBS_INVENTED_999"],
                confidence=0.85
            )
        ],
        capability_evaluations=[
            AICapabilityEvaluationDTO(
                capability_id="CAP-EXPRESS",
                proficiency=ProficiencyLevel.PROFICIENT,
                mastery=MasteryLevel.DEMONSTRATED,
                evidence_strength=EvidenceStrengthLevel.STRONG,
                confidence=0.85,
                supporting_temp_claim_ids=["TMP_01"],
                supporting_observation_ids=["OBS_INVENTED_999"]
            )
        ]
    )

    with pytest.raises(InvalidAIOutputException) as exc_info:
        AIOutputValidator.validate(hallucinated_response, valid_observations, allowed_caps)
    
    assert "hallucinated observation ID: 'OBS_INVENTED_999'" in str(exc_info.value)
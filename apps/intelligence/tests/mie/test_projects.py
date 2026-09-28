# apps/intelligence/tests/mie/test_projects.py
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.cie.schemas import CapabilityRequirement, RequirementImportance, RequirementType
from src.mie.projects.generator import ProjectGenerator
from src.mie.projects.validator import ProjectValidator, ProjectValidationError
from src.evidence.schemas import ProficiencyLevel


def test_project_generator_and_validation():
    """
    Verifies Section 12-18:
    Project is generated with milestones, criteria, and expected evidence, and validated.
    """
    cap_reqs = [
        CapabilityRequirement(
            capability_id="CAP-PYTHON",
            importance=RequirementImportance.CORE,
            expected_proficiency=ProficiencyLevel.PROFICIENT,
            requirement_type=RequirementType.TECHNICAL
        )
    ]

    project = ProjectGenerator.generate_project(
        learner_id="USR-001",
        target_id="CAREER-AI-ENGINEER",
        capability_requirements=cap_reqs,
        learning_requirements=[],
        experience_requirement=None,
        learner_current_ranks={"CAP-PYTHON": 1},
        highest_priority_caps=["CAP-PYTHON"]
    )

    assert project.learner_id == "USR-001"
    assert "CAP-PYTHON" in project.capability_ids
    assert len(project.milestones) == 4
    assert len(project.evaluation_criteria) == 1
    assert project.expected_evidence[0].evidence_type == "GITHUB_REPOSITORY"

    # Validation must pass
    validated = ProjectValidator.validate(project, ["CAP-PYTHON"])
    assert validated.validation_status == "VALID"


def test_project_validator_rejects_uncanonical_capability():
    """Verifies ungrounded capability raises ProjectValidationError."""
    cap_reqs = [
        CapabilityRequirement(
            capability_id="CAP-PYTHON",
            importance=RequirementImportance.CORE,
            expected_proficiency=ProficiencyLevel.PROFICIENT,
            requirement_type=RequirementType.TECHNICAL
        )
    ]
    project = ProjectGenerator.generate_project(
        learner_id="USR-001",
        target_id="CAREER-AI-ENGINEER",
        capability_requirements=cap_reqs,
        learning_requirements=[],
        experience_requirement=None,
        learner_current_ranks={"CAP-PYTHON": 1},
        highest_priority_caps=["CAP-PYTHON"]
    )
    # Inject unapproved capability
    project.capability_ids.append("CAP-HALLUCINATED")

    with pytest.raises(ProjectValidationError):
        ProjectValidator.validate(project, ["CAP-PYTHON"])
# apps/intelligence/tests/mie/test_llm_layer.py
import sys
from pathlib import Path

# Add apps/intelligence to python search path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.evidence.schemas import ProficiencyLevel
from src.mie.llm.prompt_builder import MIEPromptBuilder
from src.mie.llm.validator import MIELLMValidator, MIELLMValidationError
from src.mie.llm.synthesizer import MIESynthesizer


def test_mie_prompt_builder():
    prompts = MIEPromptBuilder.build_project_enrichment_prompt(
        target_id="CAREER-AI-ENGINEER",
        capability_ids=["CAP-PYTHON", "CAP-OPENAI"],
        difficulty=ProficiencyLevel.PROFICIENT,
        functional_requirements=[{"id": "REQ-01", "description": "Build agent"}]
    )
    assert "system_prompt" in prompts
    assert "user_prompt" in prompts
    assert "CAP-PYTHON" in prompts["user_prompt"]


def test_mie_llm_validator_success():
    valid_enrichment = {
        "title": "Enterprise Agent Workflow Platform",
        "scenario_description": "Build a resilient multi-step agent for enterprise automated support.",
        "enriched_milestones": [
            {"milestone_id": "M1", "title": "Setup", "tasks": ["Init"]},
            {"milestone_id": "M2", "title": "Core", "tasks": ["Build"]}
        ]
    }
    validated = MIELLMValidator.validate_project_enrichment(valid_enrichment, ["M1", "M2"])
    assert validated["title"] == "Enterprise Agent Workflow Platform"


def test_mie_llm_validator_rejects_missing_milestones():
    invalid_enrichment = {
        "title": "Platform",
        "scenario_description": "Scenario",
        "enriched_milestones": [
            {"milestone_id": "M1", "title": "Setup", "tasks": ["Init"]}
            # Missing M2!
        ]
    }
    with pytest.raises(MIELLMValidationError):
        MIELLMValidator.validate_project_enrichment(invalid_enrichment, ["M1", "M2"])


def test_mie_synthesizer_deterministic_fallback():
    # Explicitly disable API key to force deterministic fallback
    synthesizer = MIESynthesizer(api_key="")
    result = synthesizer.enrich_project(
        target_id="CAREER-AI-ENGINEER",
        capability_ids=["CAP-PYTHON"],
        difficulty=ProficiencyLevel.DEVELOPING,
        functional_requirements=[],
        fallback_title="Default Project",
        fallback_description="Default Desc",
        fallback_milestones=[]
    )
    assert result["title"] == "Default Project"
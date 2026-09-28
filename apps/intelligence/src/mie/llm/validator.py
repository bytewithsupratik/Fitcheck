# apps/intelligence/src/mie/llm/validator.py
from typing import Dict, Any, List


class MIELLMValidationError(Exception):
    pass


class MIELLMValidator:
    """
    Enforces Section 54 Immutability Rule:
    The LLM cannot alter capability IDs, remove requirements, or return malformed JSON.
    """

    @classmethod
    def validate_project_enrichment(
        cls,
        raw_output: Dict[str, Any],
        expected_milestone_ids: List[str]
    ) -> Dict[str, Any]:
        if "title" not in raw_output or not isinstance(raw_output["title"], str):
            raise MIELLMValidationError("Enriched project missing valid 'title'.")
        if "scenario_description" not in raw_output or not isinstance(raw_output["scenario_description"], str):
            raise MIELLMValidationError("Enriched project missing valid 'scenario_description'.")
        if "enriched_milestones" not in raw_output or not isinstance(raw_output["enriched_milestones"], list):
            raise MIELLMValidationError("Enriched project missing 'enriched_milestones' list.")

        # Ensure milestone IDs correspond to expected milestones
        output_ids = {m.get("milestone_id") for m in raw_output["enriched_milestones"] if isinstance(m, dict)}
        for mid in expected_milestone_ids:
            if mid not in output_ids:
                raise MIELLMValidationError(f"Enriched project dropped required milestone ID: '{mid}'.")

        return raw_output

    @classmethod
    def validate_synthesized_question(
        cls,
        raw_output: Dict[str, Any]
    ) -> Dict[str, Any]:
        for field in ["prompt", "options", "expected_answer", "explanation"]:
            if field not in raw_output:
                raise MIELLMValidationError(f"Synthesized question missing required field: '{field}'.")

        options = raw_output["options"]
        if not isinstance(options, list) or len(options) != 4:
            raise MIELLMValidationError("Synthesized question must have exactly 4 options.")

        option_ids = [opt.get("option_id") for opt in options if isinstance(opt, dict)]
        if len(set(option_ids)) != 4:
            raise MIELLMValidationError("Synthesized question options have duplicate or invalid IDs.")

        if raw_output["expected_answer"] not in option_ids:
            raise MIELLMValidationError("Synthesized question expected_answer not in options.")

        return raw_output
# apps/intelligence/src/cie/validator.py
from src.cie.schemas import CIEOutput


class CIEValidationError(Exception):
    pass


class CIEValidator:
    """
    Validates CIE outputs against business rules, mathematical bounds, and contract invariants.
    """

    @classmethod
    def validate_output(cls, output: CIEOutput) -> CIEOutput:
        # 1. Relevance & Confidence Bounds
        if not (0.0 <= output.relevance.score <= 1.0):
            raise CIEValidationError(f"Invalid relevance score: {output.relevance.score}")
        if not (0.0 <= output.relevance.confidence <= 1.0):
            raise CIEValidationError(f"Invalid confidence score: {output.relevance.confidence}")

        # 2. Roadmap Integrity
        if not output.roadmap.stages:
            raise CIEValidationError("Roadmap cannot have zero stages.")

        stage_orders = [s.order for s in output.roadmap.stages]
        if stage_orders != sorted(stage_orders):
            raise CIEValidationError("Roadmap stages are not strictly ordered.")

        # 3. Trajectory Integrity
        if not output.trajectory.starting_state_version:
            raise CIEValidationError("Trajectory is missing starting_state_version.")

        # 4. Capability Alignment Invariants
        if not output.capability_alignment.required:
            raise CIEValidationError("Capability alignment must have required capabilities.")

        return output
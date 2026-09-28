# apps/intelligence/src/mie/projects/validator.py
from src.mie.schemas import CodingProject


class ProjectValidationError(Exception):
    pass


class ProjectValidator:
    @classmethod
    def validate(cls, project: CodingProject, allowed_capability_ids: list[str]) -> CodingProject:
        allowed_set = set(allowed_capability_ids)

        # 1. Capability Validation
        for cid in project.capability_ids:
            if cid not in allowed_set:
                raise ProjectValidationError(f"Project contains uncanonical capability: '{cid}'")

        # 2. Evaluation Criteria Validation
        if not project.evaluation_criteria:
            raise ProjectValidationError("Project must contain at least one evaluation criterion.")

        for ec in project.evaluation_criteria:
            if ec.capability_id not in allowed_set:
                raise ProjectValidationError(f"Evaluation criterion references unknown capability: '{ec.capability_id}'")

        # 3. Expected Evidence Validation
        if not project.expected_evidence:
            raise ProjectValidationError("Project must declare at least one expected evidence specification.")

        # 4. Functional Requirements
        if not project.functional_requirements:
            raise ProjectValidationError("Project must define functional requirements.")

        return project
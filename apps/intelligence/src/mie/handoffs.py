# apps/intelligence/src/mie/handoffs.py
from typing import Dict, Any, List
from src.mie.schemas import CodingProject, AssessmentResult, Assessment


class MIEHandoffs:
    """
    Contracts for transferring evaluation context to EIE and ingesting ADE adaptations.
    """

    @classmethod
    def project_to_eie_contract(cls, project: CodingProject, github_url: str) -> Dict[str, Any]:
        """
        Section 19: Formats project evaluation criteria for EIE evidence evaluation.
        """
        return {
            "evidence_type": "GITHUB_REPOSITORY",
            "project_id": project.project_id,
            "learner_id": project.learner_id,
            "source_reference": {"url": github_url},
            "capability_targets": [
                {"capability_id": c, "expected_proficiency": project.difficulty.value}
                for c in project.capability_ids
            ],
            "evaluation_criteria": [ec.model_dump() for ec in project.evaluation_criteria],
            "expected_evidence": [ee.model_dump() for ee in project.expected_evidence]
        }

    @classmethod
    def assessment_to_eie_contract(
        cls,
        assessment: Assessment,
        result: AssessmentResult
    ) -> Dict[str, Any]:
        """
        Section 31: Formats raw assessment performance as evidence for EIE.
        """
        return {
            "evidence_type": "ASSESSMENT_RESULT",
            "assessment_id": assessment.assessment_id,
            "assessment_result_id": result.assessment_result_id,
            "learner_id": assessment.learner_id,
            "capability_targets": [
                {"capability_id": c, "expected_proficiency": assessment.difficulty.value}
                for c in assessment.capability_ids
            ],
            "assessment_context": {
                "learning_requirement_ids": assessment.learning_requirement_ids
            },
            "results": {
                "score": result.score.percentage,
                "question_results": [qr.model_dump() for qr in result.question_results]
            },
            "evaluation_criteria": [
                {"capability_id": c, "description": f"Verifies core comprehension of {c}"}
                for c in assessment.capability_ids
            ]
        }
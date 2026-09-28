# apps/intelligence/src/mie/assessments/validator.py
from src.mie.schemas import Assessment, Question


class AssessmentValidationError(Exception):
    pass


class AssessmentValidator:
    @classmethod
    def validate(cls, assessment: Assessment, allowed_capabilities: list[str]) -> Assessment:
        allowed_set = set(allowed_capabilities)

        if not assessment.questions:
            raise AssessmentValidationError("Assessment contains zero questions.")

        for q in assessment.questions:
            cls.validate_question(q, allowed_set)

        return assessment

    @classmethod
    def validate_question(cls, question: Question, allowed_set: set[str]):
        # 1. Capability Grounding Check (Section 32)
        for cid in question.capability_ids:
            if cid not in allowed_set:
                raise AssessmentValidationError(
                    f"Question {question.question_id} is ungrounded: capability '{cid}' not in target."
                )

        # 2. MCQ Specific Validation (Section 24)
        if question.type in ["MCQ", "SCENARIO"]:
            if len(question.options) < 2:
                raise AssessmentValidationError(f"Question {question.question_id} must have at least 2 options.")

            option_ids = [opt.option_id for opt in question.options]
            if len(option_ids) != len(set(option_ids)):
                raise AssessmentValidationError(f"Question {question.question_id} has duplicate option IDs.")

            option_texts = [opt.text.strip().lower() for opt in question.options]
            if len(option_texts) != len(set(option_texts)):
                raise AssessmentValidationError(f"Question {question.question_id} has duplicate option texts.")

            # Expected answer exists in options
            if question.expected_answer not in option_ids:
                raise AssessmentValidationError(
                    f"Question {question.question_id} expected answer '{question.expected_answer}' missing from options."
                )
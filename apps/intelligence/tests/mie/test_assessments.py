# apps/intelligence/tests/mie/test_assessments.py
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.mie.assessments.generator import AssessmentGenerator
from src.mie.assessments.scoring import AssessmentScorer
from src.mie.assessments.validator import AssessmentValidator, AssessmentValidationError
from src.evidence.schemas import ProficiencyLevel


def test_assessment_generation_scoring_and_validation():
    """
    Verifies Section 20-32:
    Generates grounded assessment, validates MCQ options, and tests raw scoring.
    """
    assessment = AssessmentGenerator.generate_assessment(
        learner_id="USR-001",
        experience_id="LE-001",
        target_id="CAREER-AI-ENGINEER",
        capability_ids=["CAP-PYTHON"],
        difficulty=ProficiencyLevel.DEVELOPING
    )

    assert len(assessment.questions) == 3
    validated = AssessmentValidator.validate(assessment, ["CAP-PYTHON"])
    assert validated.status.value == "AVAILABLE"

    # Score attempt with 1 correct MCQ
    mcq_q = next(q for q in assessment.questions if q.type.value == "MCQ")
    answers = {mcq_q.question_id: mcq_q.expected_answer}

    result = AssessmentScorer.score_attempt(assessment, answers)
    assert result.learner_id == "USR-001"
    assert result.score.earned >= 1
    assert 0.0 <= result.score.percentage <= 1.0
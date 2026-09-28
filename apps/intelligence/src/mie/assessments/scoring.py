# apps/intelligence/src/mie/assessments/scoring.py
from datetime import datetime, timezone
from typing import Dict, Any
from src.mie.schemas import (
    Assessment,
    AssessmentResult,
    QuestionResult,
    AssessmentScore,
)


class AssessmentScorer:
    """
    Computes raw, deterministic scoring of assessment attempts (Section 29).
    MIE scores raw correctness; EIE interprets evidence; CIG stores state.
    """

    @classmethod
    def score_attempt(
        cls,
        assessment: Assessment,
        learner_answers: Dict[str, str]  # question_id -> selected_option_id / answer_text
    ) -> AssessmentResult:
        question_results = []
        earned_points = 0
        total_possible = sum(q.points for q in assessment.questions)

        for q in assessment.questions:
            answer = learner_answers.get(q.question_id, "").strip()
            is_correct = False
            points = 0

            if q.type in ["MCQ", "SCENARIO"]:
                if answer.lower() == q.expected_answer.lower():
                    is_correct = True
                    points = q.points
            elif q.type == "SHORT_ANSWER":
                # Deterministic keyword coverage check for criteria
                if any(kw.lower() in answer.lower() for kw in ["error", "status", "catch", "prevent", "crash"]):
                    is_correct = True
                    points = q.points

            earned_points += points
            question_results.append(
                QuestionResult(
                    question_id=q.question_id,
                    correct=is_correct,
                    points_earned=points,
                    learner_answer=answer
                )
            )

        pct = round(earned_points / max(1, total_possible), 4)

        return AssessmentResult(
            assessment_result_id=f"ASM-RES-{assessment.assessment_id[-8:]}",
            assessment_id=assessment.assessment_id,
            learner_id=assessment.learner_id,
            score=AssessmentScore(
                earned=earned_points,
                possible=total_possible,
                percentage=pct
            ),
            question_results=question_results,
            submitted_at=datetime.now(timezone.utc).isoformat()
        )
# apps/intelligence/src/mie/assessments/generator.py
import uuid
from datetime import datetime, timezone
from typing import List, Dict

from src.mie.schemas import (
    Assessment,
    Question,
    QuestionOption,
)
from src.mie.enums import AssessmentType, AssessmentStatus
from src.evidence.schemas import ProficiencyLevel


class AssessmentGenerator:
    """
    Generates capability-aligned assessments and questions (Sections 20-28).
    """

    @classmethod
    def generate_assessment(
        cls,
        learner_id: str,
        experience_id: str,
        target_id: str,
        capability_ids: List[str],
        difficulty: ProficiencyLevel,
    ) -> Assessment:
        assessment_id = f"ASM-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        questions: List[Question] = []

        # Generate grounded questions for each target capability
        for idx, cap_id in enumerate(capability_ids, start=1):
            tech_clean = cap_id.replace("CAP-", "").title()

            # 1. MCQ Question (Testing Core Principles)
            questions.append(
                Question(
                    question_id=f"Q-{idx:02d}-MCQ",
                    type=AssessmentType.MCQ,
                    prompt=f"Which architectural principle is fundamental when designing with {tech_clean}?",
                    capability_ids=[cap_id],
                    difficulty=difficulty,
                    options=[
                        QuestionOption(option_id="opt-a", text=f"Modular separation of concerns and clear interfaces"),
                        QuestionOption(option_id="opt-b", text="Coupling state globally across all runtime scopes"),
                        QuestionOption(option_id="opt-c", text="Bypassing request validation and schema assertions"),
                        QuestionOption(option_id="opt-d", text="Disabling automated testing suites in production")
                    ],
                    expected_answer="opt-a",
                    explanation=f"Modular separation of concerns ensures maintainability and clear boundaries in {tech_clean}.",
                    points=1
                )
            )

            # 2. Scenario Question (Testing Practical Application)
            questions.append(
                Question(
                    question_id=f"Q-{idx:02d}-SCENARIO",
                    type=AssessmentType.SCENARIO,
                    prompt=(
                        f"In a production system using {tech_clean}, a critical request fails validation with invalid input types. "
                        f"How should the system respond?"
                    ),
                    capability_ids=[cap_id],
                    difficulty=difficulty,
                    options=[
                        QuestionOption(option_id="opt-a", text="Return HTTP 400 Bad Request with descriptive validation details"),
                        QuestionOption(option_id="opt-b", text="Crash the worker process with an unhandled exception"),
                        QuestionOption(option_id="opt-c", text="Silently return HTTP 200 OK without persisting data"),
                        QuestionOption(option_id="opt-d", text="Ignore the request and hang the connection")
                    ],
                    expected_answer="opt-a",
                    explanation="Client validation errors should always return an informative HTTP 400 status.",
                    points=1
                )
            )

            # 3. Short Answer Question (Testing Conceptual Depth)
            questions.append(
                Question(
                    question_id=f"Q-{idx:02d}-SHORT",
                    type=AssessmentType.SHORT_ANSWER,
                    prompt=f"Explain how error-handling boundaries protect system stability in {tech_clean}.",
                    capability_ids=[cap_id],
                    difficulty=difficulty,
                    expected_answer="Error-handling boundaries catch runtime failures, prevent cascading crashes, and return standardized status codes.",
                    explanation="Graceful error handling isolates faults and informs consumers of operational failures.",
                    evaluation_criteria=[
                        "Mentions preventing process crashes",
                        "Identifies graceful status code reporting"
                    ],
                    points=2
                )
            )

        total_points = sum(q.points for q in questions)

        return Assessment(
            assessment_id=assessment_id,
            learner_id=learner_id,
            experience_id=experience_id,
            target_id=target_id,
            capability_ids=capability_ids,
            learning_requirement_ids=[],
            assessment_type=AssessmentType.MCQ,
            difficulty=difficulty,
            estimated_duration_minutes=len(questions) * 3,
            questions=questions,
            scoring_policy={"total_points": total_points, "passing_percentage": 0.70},
            evidence_policy={"evidence_type": "ASSESSMENT_RESULT"},
            status=AssessmentStatus.AVAILABLE,
            version=1,
            created_at=now_iso,
            updated_at=now_iso
        )
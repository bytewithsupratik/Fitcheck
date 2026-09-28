# apps/intelligence/src/evidence/assessment_analyzer.py
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from src.evidence.schemas import ObservationDTO, ObservationCategory


class AssessmentQuestionResult(BaseModel):
    question_id: str = Field(..., description="e.g. Q101")
    topic: str = Field(..., description="e.g. postgresql, rest_api, react")
    question_text: Optional[str] = None
    is_correct: bool
    score: float = Field(..., ge=0.0, le=1.0)
    max_score: float = Field(default=1.0, ge=0.0)


class AssessmentAnalyzerError(Exception):
    pass


class AssessmentResultAnalyzer:
    """
    Analyzes question-level assessment results.
    Extracts verified factual observations linked to individual question IDs and topics.
    """
    def analyze_assessment(
        self,
        assessment_id: str,
        evidence_id: str,
        questions: List[AssessmentQuestionResult]
    ) -> List[ObservationDTO]:
        if not questions:
            raise AssessmentAnalyzerError("Assessment contains no question results to evaluate.")

        observations: List[ObservationDTO] = []

        total_questions = len(questions)
        total_score = sum(q.score for q in questions)
        max_possible_score = sum(q.max_score for q in questions)
        percentage = (total_score / max_possible_score) if max_possible_score > 0 else 0.0

        # 1. Overall assessment metadata observation
        observations.append(
            ObservationDTO(
                observation_id=f"OBS_ASM_SUMMARY_{evidence_id}",
                evidence_id=evidence_id,
                category=ObservationCategory.REPOSITORY_METADATA,
                name="assessment_summary",
                value={
                    "assessment_id": assessment_id,
                    "total_questions": total_questions,
                    "score_percentage": round(percentage, 2)
                },
                source_location=f"assessment: '{assessment_id}'",
                verified=True
            )
        )

        # 2. Individual question-level observations (Question Provenance - Section 16 & 24)
        topic_aggregates: Dict[str, Dict[str, Any]] = {}

        for q in questions:
            q_obs_id = f"OBS_Q_{q.question_id}_{evidence_id}"
            observations.append(
                ObservationDTO(
                    observation_id=q_obs_id,
                    evidence_id=evidence_id,
                    category=ObservationCategory.STRUCTURE,
                    name=q.topic.lower(),
                    value={
                        "question_id": q.question_id,
                        "is_correct": q.is_correct,
                        "score": q.score,
                        "max_score": q.max_score
                    },
                    source_location=f"question_id: '{q.question_id}'",
                    verified=True
                )
            )

            # Group by topic for evidence strength calculations
            t_key = q.topic.lower()
            if t_key not in topic_aggregates:
                topic_aggregates[t_key] = {"total": 0, "correct": 0, "question_ids": []}
            topic_aggregates[t_key]["total"] += 1
            if q.is_correct:
                topic_aggregates[t_key]["correct"] += 1
            topic_aggregates[t_key]["question_ids"].append(q.question_id)

        # 3. Topic aggregate observations
        for topic, agg in topic_aggregates.items():
            topic_obs_id = f"OBS_TOPIC_{topic.upper()}_{evidence_id}"
            topic_accuracy = agg["correct"] / agg["total"] if agg["total"] > 0 else 0.0
            observations.append(
                ObservationDTO(
                    observation_id=topic_obs_id,
                    evidence_id=evidence_id,
                    category=ObservationCategory.STRUCTURE,
                    name=topic,
                    value={
                        "topic": topic,
                        "questions_count": agg["total"],
                        "accuracy": round(topic_accuracy, 2),
                        "questions": agg["question_ids"]
                    },
                    source_location=f"topic_aggregate: '{topic}'",
                    verified=True
                )
            )

        return observations
# apps/intelligence/src/api/routes/mie_router.py
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from src.mie.schemas import (
    MIEInput,
    LearningExperience,
    Resource,
    CodingProject,
    Assessment,
    AssessmentResult,
)
from src.mie.engine import MissionIntelligenceEngine, MissionIntelligenceEngineError
from src.mie.repository import mie_repository
from src.mie.assessments.scoring import AssessmentScorer
from src.mie.events import MIEEventBuilder

router = APIRouter(prefix="/api/v1", tags=["Mission / Learning Intelligence Engine"])


class ProjectSubmissionRequest(BaseModel):
    github_url: str = Field(..., description="Public GitHub repository URL with learner code")


class AssessmentAttemptSubmissionRequest(BaseModel):
    learner_answers: Dict[str, str] = Field(..., description="question_id -> option_id or answer text")


# 1. POST /learning-experiences (Generate Experience)
@router.post(
    "/learning-experiences",
    response_model=LearningExperience,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a tailored Learning Experience from CIE requirements and RIE gaps"
)
async def generate_learning_experience(payload: MIEInput):
    try:
        return MissionIntelligenceEngine.generate_learning_experience(payload)
    except MissionIntelligenceEngineError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# 2. GET /learning-experiences/{experience_id}
@router.get(
    "/learning-experiences/{experience_id}",
    response_model=LearningExperience,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Learning Experience by ID"
)
async def get_learning_experience(experience_id: str):
    exp = mie_repository.get_experience(experience_id)
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning experience not found")
    return exp


# 3. GET /learners/{learner_id}/learning-experiences/current
@router.get(
    "/learners/{learner_id}/learning-experiences/current",
    response_model=LearningExperience,
    status_code=status.HTTP_200_OK,
    summary="Retrieve active/current Learning Experience for learner"
)
async def get_current_learning_experience(learner_id: str):
    exp = mie_repository.get_current_experience(learner_id)
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active learning experience found")
    return exp


# 4. GET /learning-experiences/{experience_id}/resources
@router.get(
    "/learning-experiences/{experience_id}/resources",
    response_model=List[Resource],
    status_code=status.HTTP_200_OK,
    summary="Retrieve curated resources for an experience"
)
async def get_experience_resources(experience_id: str):
    exp = mie_repository.get_experience(experience_id)
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning experience not found")
    return exp.resources


# 5. GET /learning-experiences/{experience_id}/project
@router.get(
    "/learning-experiences/{experience_id}/project",
    response_model=CodingProject,
    status_code=status.HTTP_200_OK,
    summary="Retrieve coding project for an experience"
)
async def get_experience_project(experience_id: str):
    exp = mie_repository.get_experience(experience_id)
    if not exp or not exp.coding_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coding project not found")
    return exp.coding_project


# 6. POST /projects/{project_id}/submission
@router.post(
    "/projects/{project_id}/submission",
    status_code=status.HTTP_200_OK,
    summary="Submit GitHub repository URL for coding project evidence evaluation"
)
async def submit_project(project_id: str, payload: ProjectSubmissionRequest):
    project = mie_repository.get_project(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Update state & emit PROJECT_SUBMITTED event (Section 36 & 47)
    project.status = "SUBMITTED"
    event = MIEEventBuilder.project_submitted(project, payload.github_url)
    return {
        "success": True,
        "message": "Project submitted successfully. Evidence handed off for EIE evaluation.",
        "project_id": project_id,
        "event": event
    }


# 7. GET /learning-experiences/{experience_id}/assessment
@router.get(
    "/learning-experiences/{experience_id}/assessment",
    response_model=Assessment,
    status_code=status.HTTP_200_OK,
    summary="Retrieve assessment for an experience"
)
async def get_experience_assessment(experience_id: str):
    exp = mie_repository.get_experience(experience_id)
    if not exp or not exp.assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return exp.assessment


# 8. POST /assessments/{assessment_id}/attempts
@router.post(
    "/assessments/{assessment_id}/attempts",
    status_code=status.HTTP_200_OK,
    summary="Start an assessment attempt"
)
async def start_assessment_attempt(assessment_id: str):
    assessment = mie_repository.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    assessment.status = "IN_PROGRESS"
    return {
        "assessment_id": assessment_id,
        "status": "IN_PROGRESS",
        "total_questions": len(assessment.questions)
    }


# 9. POST /assessment-attempts/{assessment_id}/submit
@router.post(
    "/assessments/{assessment_id}/submit",
    response_model=AssessmentResult,
    status_code=status.HTTP_200_OK,
    summary="Submit assessment answers, score deterministically, and package result"
)
async def submit_assessment(assessment_id: str, payload: AssessmentAttemptSubmissionRequest):
    assessment = mie_repository.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    result = AssessmentScorer.score_attempt(assessment, payload.learner_answers)
    mie_repository.save_assessment_result(result)
    MIEEventBuilder.assessment_completed(result, assessment.capability_ids)

    return result


# 10. POST /learning-experiences/{experience_id}/steps/{step_id}/complete
@router.post(
    "/learning-experiences/{experience_id}/steps/{step_id}/complete",
    status_code=status.HTTP_200_OK,
    summary="Mark a learning step as completed"
)
async def complete_step(experience_id: str, step_id: int):
    exp = mie_repository.get_experience(experience_id)
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")

    matched_step = next((s for s in exp.sequence if s.step == step_id), None)
    if not matched_step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found in experience sequence")

    matched_step.status = "COMPLETED"
    return {
        "experience_id": experience_id,
        "step": step_id,
        "status": "COMPLETED"
    }
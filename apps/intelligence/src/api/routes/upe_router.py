# apps/intelligence/src/api/routes/upe_router.py
from typing import List
from fastapi import APIRouter, HTTPException, status

from src.upe.schemas import (
    UPEInput,
    ProgressEvaluation,
    CapabilityProgress,
    TrendSummary,
)
from src.upe.engine import UniversalProgressEngine, UniversalProgressEngineError
from src.upe.validator import UPEValidationError
from src.upe.repository import upe_repository

router = APIRouter(prefix="/api/v1/progress", tags=["Universal Progress Engine"])


# 1. POST /evaluate
@router.post(
    "/evaluate",
    response_model=ProgressEvaluation,
    status_code=status.HTTP_200_OK,
    summary="Compute deterministic progress evaluation from CIG state and activity signals"
)
async def evaluate_progress(payload: UPEInput):
    """
    UPE measures:
    - Depth (35%): Capability progression
    - Velocity (20%): Learning pace over time
    - Consistency (25%): Sustained active periods
    - Alignment (20%): Relevance to active target
    """
    try:
        return UniversalProgressEngine.evaluate(payload)
    except UniversalProgressEngineError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except UPEValidationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# 2. GET /{learner_id}/current
@router.get(
    "/{learner_id}/current",
    response_model=ProgressEvaluation,
    status_code=status.HTTP_200_OK,
    summary="Retrieve latest valid progress evaluation for a learner"
)
async def get_current_progress(learner_id: str):
    eval_record = upe_repository.get_current(learner_id)
    if not eval_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No progress evaluation found for learner '{learner_id}'."
        )
    return eval_record


# 3. GET /{learner_id}/history
@router.get(
    "/{learner_id}/history",
    response_model=List[ProgressEvaluation],
    status_code=status.HTTP_200_OK,
    summary="Retrieve historical progress evaluations for a learner"
)
async def get_progress_history(learner_id: str):
    history = upe_repository.get_history(learner_id)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No progress history found for learner '{learner_id}'."
        )
    return history


# 4. GET /{learner_id}/capabilities
@router.get(
    "/{learner_id}/capabilities",
    response_model=List[CapabilityProgress],
    status_code=status.HTTP_200_OK,
    summary="Retrieve capability-level progress for a learner"
)
async def get_capability_progress(learner_id: str):
    eval_record = upe_repository.get_current(learner_id)
    if not eval_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No progress evaluation found for learner '{learner_id}'."
        )
    return eval_record.capability_progress


# 5. GET /{learner_id}/trend
@router.get(
    "/{learner_id}/trend",
    response_model=TrendSummary,
    status_code=status.HTTP_200_OK,
    summary="Retrieve overall progress and velocity trends"
)
async def get_progress_trend(learner_id: str):
    eval_record = upe_repository.get_current(learner_id)
    if not eval_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No progress evaluation found for learner '{learner_id}'."
        )
    return eval_record.trend
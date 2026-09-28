# apps/intelligence/src/api/routes/rie_router.py
from typing import List
from fastapi import APIRouter, HTTPException, status

from src.rie.schemas import RIEInput, RIEOutput
from src.rie.engine import ReadinessIntelligenceEngine, ReadinessIntelligenceEngineError
from src.rie.validator import RIEValidationError
from src.rie.mie_handoff import MIEHandoffBuilder, MIEHandoffPayload
from src.rie.repository import rie_repository

router = APIRouter(prefix="/api/v1/readiness", tags=["Readiness Intelligence Engine"])


# 1. POST /readiness/evaluate (Calculate readiness)
@router.post(
    "/evaluate",
    response_model=RIEOutput,
    status_code=status.HTTP_200_OK,
    summary="Calculate readiness from CIG state and CIE requirements"
)
async def evaluate_readiness(payload: RIEInput):
    """
    App → RIE
    Computes deterministic readiness, gaps, priority gaps, trend, and grounded explanation.
    Persists evaluation into repository cache for subsequent current/history reads.
    """
    try:
        output = ReadinessIntelligenceEngine.evaluate(payload, include_explanation=True)
        # Store in evaluation history
        rie_repository.save_evaluation(output)
        return output
    except ReadinessIntelligenceEngineError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "RIE_INPUT_INVALID", "message": str(e)}
        )
    except RIEValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "RIE_VALIDATION_ERROR", "message": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "RIE_EVALUATION_FAILED", "message": str(e)}
        )


# 2. GET /readiness/{learner}/current (Retrieve current readiness)
@router.get(
    "/{learner_id}/current",
    response_model=RIEOutput,
    status_code=status.HTTP_200_OK,
    summary="Retrieve current readiness state for a learner"
)
async def get_current_readiness(learner_id: str):
    """
    UI/App → RIE
    Returns the most recent validated readiness evaluation for the specified learner.
    """
    current_eval = rie_repository.get_current(learner_id)
    if not current_eval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "READINESS_NOT_FOUND",
                "message": f"No readiness evaluation found for learner '{learner_id}'."
            }
        )
    return current_eval


# 3. GET /readiness/{learner}/history (Retrieve historical readiness)
@router.get(
    "/{learner_id}/history",
    response_model=List[RIEOutput],
    status_code=status.HTTP_200_OK,
    summary="Retrieve historical readiness evaluations for a learner"
)
async def get_readiness_history(learner_id: str):
    """
    UI/App → RIE
    Returns all historical readiness evaluations for the learner to power progress charts and trend graphs.
    """
    history = rie_repository.get_history(learner_id)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "READINESS_HISTORY_NOT_FOUND",
                "message": f"No readiness history found for learner '{learner_id}'."
            }
        )
    return history


# 4. POST /readiness/handoff/mie (Transfer priority gaps)
@router.post(
    "/handoff/mie",
    response_model=MIEHandoffPayload,
    status_code=status.HTTP_200_OK,
    summary="Transfer prioritized gaps to Mission Intelligence Engine (MIE)"
)
async def transfer_priority_gaps_to_mie(payload: RIEInput):
    """
    RIE → MIE
    Takes current learner state + requirements, evaluates readiness, and formats
    priority gaps into actionable mission candidates for MIE.
    """
    try:
        output = ReadinessIntelligenceEngine.evaluate(payload, include_explanation=False)
        return MIEHandoffBuilder.build_mie_handoff(output)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "MIE_HANDOFF_FAILED", "message": str(e)}
        )
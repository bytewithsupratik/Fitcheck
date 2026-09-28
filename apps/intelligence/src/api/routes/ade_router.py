# apps/intelligence/src/api/routes/ade_router.py
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from src.ade.schemas import ADEDecisionRecord
from src.ade.events.schemas import EventEnvelope
from src.ade.engine import ade_engine
from src.ade.persistence.repository import ade_repository
from src.ade.state_machine.machine import IllegalStateTransitionError

router = APIRouter(prefix="/api/v1/ade", tags=["Adaptive Decision Engine"])


class EvaluateEventRequest(BaseModel):
    event: EventEnvelope
    cig_state: Optional[Dict[str, Any]] = None


class RejectionPayload(BaseModel):
    reason: str = "User declined recommended trajectory change"


# 1. POST /events
@router.post("/events", response_model=ADEDecisionRecord, status_code=status.HTTP_200_OK, summary="Ingest event and trigger ADE governance")
async def ingest_event(payload: EvaluateEventRequest):
    try:
        return ade_engine.process_event(payload.event, cig_state=payload.cig_state)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# 2. POST /evaluate
@router.post("/evaluate", response_model=ADEDecisionRecord, status_code=status.HTTP_200_OK, summary="Direct ADE evaluation from event and context")
async def evaluate_ade(payload: EvaluateEventRequest):
    return await ingest_event(payload)


# 3. GET /decisions/{decision_id}
@router.get("/decisions/{decision_id}", response_model=ADEDecisionRecord, status_code=status.HTTP_200_OK, summary="Retrieve complete decision state and provenance")
async def get_decision(decision_id: str):
    record = ade_repository.get_decision(decision_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Decision '{decision_id}' not found.")
    return record


# 4. GET /learners/{learner_id}/decisions
@router.get("/learners/{learner_id}/decisions", response_model=List[ADEDecisionRecord], status_code=status.HTTP_200_OK, summary="Retrieve learner decision history")
async def get_learner_decisions(learner_id: str):
    return ade_repository.get_learner_decisions(learner_id)


# 5. GET /learners/{learner_id}/decisions/current
@router.get("/learners/{learner_id}/decisions/current", response_model=Optional[ADEDecisionRecord], status_code=status.HTTP_200_OK, summary="Retrieve active decision")
async def get_current_decision(learner_id: str):
    return ade_repository.get_active_decision(learner_id)


# 6. POST /decisions/{decision_id}/approve
@router.post("/decisions/{decision_id}/approve", response_model=ADEDecisionRecord, status_code=status.HTTP_200_OK, summary="Approve pending adaptation decision")
async def approve_decision(decision_id: str):
    try:
        return ade_engine.approve_decision(decision_id)
    except IllegalStateTransitionError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# 7. POST /decisions/{decision_id}/reject
@router.post("/decisions/{decision_id}/reject", response_model=ADEDecisionRecord, status_code=status.HTTP_200_OK, summary="Reject pending adaptation decision")
async def reject_decision(decision_id: str, payload: RejectionPayload):
    try:
        return ade_engine.reject_decision(decision_id, reason=payload.reason)
    except IllegalStateTransitionError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
# apps/intelligence/src/api/routes/cie_router.py
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status

from src.cie.schemas import (
    CIEInput,
    CIEOutput,
    Target,
    TargetProfile,
    TargetType,
    Roadmap,
)
from src.cie.engine import CareerIntelligenceEngine
from src.cie.taxonomy import DynamicTaxonomyRegistry, TargetNotFoundError
from src.cie.roadmap import RoadmapBuilder
from src.cie.validator import CIEValidationError

router = APIRouter(prefix="/api/v1/cie", tags=["Career Intelligence Engine"])

# Shared engine & taxonomy registry instance
taxonomy_registry = DynamicTaxonomyRegistry()
cie_engine = CareerIntelligenceEngine(taxonomy_registry=taxonomy_registry)


@router.post(
    "/evaluate",
    response_model=CIEOutput,
    status_code=status.HTTP_200_OK,
    summary="Primary CIE Evaluation: Computes relevance, gaps, roadmap, trajectory, and AI narrative"
)
async def evaluate_cie(payload: CIEInput):
    """
    Core CIE Contract:
    Consumes versioned CIG learner state and selected target.
    Returns:
    - 50/30/20 relevance score
    - supporting vs missing capability gaps
    - objective multi-stage roadmap
    - learner transit trajectory
    - seniority progression ladder
    - aligned alternative directions
    - grounded AI qualitative reasoning (summary, gap narrative, trajectory rationale)
    """
    try:
        return cie_engine.evaluate(payload)
    except TargetNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "TARGET_NOT_FOUND", "message": str(e)}
        )
    except CIEValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "CIE_VALIDATION_ERROR", "message": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "CIE_EVALUATION_FAILED", "message": str(e)}
        )


@router.get(
    "/targets",
    response_model=List[Target],
    status_code=status.HTTP_200_OK,
    summary="List canonical career and domain targets (for UI target selection)"
)
async def list_targets(target_type: Optional[TargetType] = None):
    """
    Used by Frontend / Backend to populate the controlled target selection UI.
    No freeform prompt entry needed.
    """
    return taxonomy_registry.list_targets(target_type=target_type)


@router.get(
    "/targets/{target_id}",
    response_model=TargetProfile,
    status_code=status.HTTP_200_OK,
    summary="Retrieve validated target profile requirements and metadata"
)
async def get_target_profile(target_id: str):
    """
    Returns the authoritative industry profile for a target, including:
    - capability requirements
    - learning requirements
    - experience requirements
    - evidence expectations
    """
    try:
        return taxonomy_registry.get_profile(target_id)
    except TargetNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "TARGET_NOT_FOUND", "message": str(e)}
        )


@router.get(
    "/targets/{target_id}/roadmap",
    response_model=Roadmap,
    status_code=status.HTTP_200_OK,
    summary="Retrieve high-level roadmap stages for a target"
)
async def get_target_roadmap(target_id: str):
    """
    Returns the objective, high-level multi-stage curriculum for a target.
    """
    try:
        profile = taxonomy_registry.get_profile(target_id)
        return RoadmapBuilder.build_roadmap(profile)
    except TargetNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "TARGET_NOT_FOUND", "message": str(e)}
        )
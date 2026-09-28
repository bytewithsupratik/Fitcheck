# apps/intelligence/src/api/routes/evidence_router.py
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from src.evidence.schemas import (
    ObservationDTO,
    CanonicalCapability,
    AIEvaluationResponseDTO
)
from src.evidence.engine import EIEIntelligenceEngine
from src.evidence.validator import InvalidAIOutputException
from src.evidence.registry import DynamicTaxonomyRegistry
from src.evidence.github_analyzer import (DeterministicGitHubAnalyzer, GitHubAnalyzerError)
from src.evidence.cig_event import (CIGEventBuilder, CIGEvidenceEvaluatedEvent)
from src.evidence.report_analyzer import (DocumentReportAnalyzer, ReportAnalyzerError)
from src.evidence.assessment_analyzer import (AssessmentAnalyzerError,AssessmentQuestionResult,AssessmentResultAnalyzer)

router = APIRouter(prefix="/api/v1/evidence", tags=["Evidence Intelligence Engine"])


# =====================================================================
# 1. RAW OBSERVATION EVALUATION (For Pre-extracted Facts / Phases 2 & 3)
# =====================================================================

class EvaluateEvidenceRequest(BaseModel):
    evidence_id: str = Field(..., description="Unique evidence identifier e.g. EV_001")
    observations: List[ObservationDTO] = Field(..., min_length=1, description="Deterministic observations")
    allowed_capabilities: Optional[List[CanonicalCapability]] = Field(
        default=None,
        description="Optional list of canonical capabilities from PostgreSQL. If omitted, engine uses registered taxonomy."
    )

class EvaluateEvidenceResponse(BaseModel):
    success: bool
    evidence_id: str
    evaluation: AIEvaluationResponseDTO


@router.post(
    "/evaluate",
    response_model=EvaluateEvidenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate raw observations into capability evaluations"
)
async def evaluate_evidence(payload: EvaluateEvidenceRequest):
    try:
        registry = None
        if payload.allowed_capabilities:
            registry = DynamicTaxonomyRegistry(capabilities=payload.allowed_capabilities)

        engine = EIEIntelligenceEngine(taxonomy_registry=registry)
        
        evaluation_result = engine.evaluate(
            evidence_id=payload.evidence_id,
            observations=payload.observations,
            custom_taxonomy=payload.allowed_capabilities
        )

        return EvaluateEvidenceResponse(
            success=True,
            evidence_id=payload.evidence_id,
            evaluation=evaluation_result
        )

    except InvalidAIOutputException as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "INVALID_AI_OUTPUT", "message": str(e)}
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "EVIDENCE_INVALID", "message": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "AI_EVALUATION_FAILED", "message": str(e)}
        )


# =====================================================================
# 2. GITHUB GOLDEN PATH (URL -> Deterministic Extraction -> AI -> CIG)
# =====================================================================

class EvaluateGitHubRequest(BaseModel):
    evidence_id: str = Field(..., description="Unique evidence ID e.g. EV_GH_001")
    user_id: str = Field(..., description="Submitting learner ID e.g. USR_001")
    repo_url: str = Field(..., description="Full GitHub repository URL")
    allowed_capabilities: Optional[List[CanonicalCapability]] = None

class EvaluateGitHubResponse(BaseModel):
    success: bool
    evidence_id: str
    observations_count: int
    event: CIGEvidenceEvaluatedEvent


@router.post(
    "/evaluate/github",
    response_model=EvaluateGitHubResponse,
    status_code=status.HTTP_200_OK,
    summary="Golden Path: Analyzes public GitHub repo URL and evaluates capabilities"
)
async def evaluate_github_repository(payload: EvaluateGitHubRequest):
    try:
        # 1. Deterministic Extraction (Static inspection, zero untrusted code execution)
        analyzer = DeterministicGitHubAnalyzer()
        observations = analyzer.analyze_repository(payload.repo_url, payload.evidence_id)

        # 2. AI Reasoning & Anti-Hallucination Validation
        registry = None
        if payload.allowed_capabilities:
            registry = DynamicTaxonomyRegistry(capabilities=payload.allowed_capabilities)

        engine = EIEIntelligenceEngine(taxonomy_registry=registry)
        evaluation_result = engine.evaluate(
            evidence_id=payload.evidence_id,
            observations=observations,
            custom_taxonomy=payload.allowed_capabilities
        )

        # 3. Format CIG Event Payload (Section 32)
        cig_event = CIGEventBuilder.build_event(
            evaluation=evaluation_result,
            evidence_id=payload.evidence_id,
            user_id=payload.user_id,
            evidence_type="github_repository",
            source_reference=payload.repo_url,
            observations=observations
        )

        return EvaluateGitHubResponse(
            success=True,
            evidence_id=payload.evidence_id,
            observations_count=len(observations),
            event=cig_event
        )

    except GitHubAnalyzerError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "EVIDENCE_UNAVAILABLE", "message": str(e)}
        )
    except InvalidAIOutputException as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "INVALID_AI_OUTPUT", "message": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "AI_EVALUATION_FAILED", "message": str(e)}
        )

# =====================================================================
# 3. PROJECT REPORT PIPELINE (Phase 2: PDF / Text Document Intelligence)
# =====================================================================

class EvaluateReportRequest(BaseModel):
    evidence_id: str = Field(..., description="Unique evidence ID e.g. EV_REP_001")
    user_id: str = Field(..., description="Submitting learner ID e.g. USR_001")
    title: str = Field(..., description="Report title e.g. Final Architecture Report")
    report_text: str = Field(..., description="Full text or extracted PDF text")
    pages: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Optional list of pages with page_number and text for exact page provenance"
    )
    allowed_capabilities: Optional[List[CanonicalCapability]] = None


class EvaluateReportResponse(BaseModel):
    success: bool
    evidence_id: str
    sections_and_facts_count: int
    event: CIGEvidenceEvaluatedEvent


@router.post(
    "/evaluate/report",
    response_model=EvaluateReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Phase 2: Analyzes project report text/PDF and evaluates capabilities with section provenance"
)
async def evaluate_project_report(payload: EvaluateReportRequest):
    try:
        # 1. Deterministic Extraction (Section & Keyword Segmentation)
        analyzer = DocumentReportAnalyzer()
        observations = analyzer.analyze_text_report(
            report_text=payload.report_text,
            evidence_id=payload.evidence_id,
            pages=payload.pages
        )

        # 2. AI Reasoning & Anti-Hallucination Validation
        registry = None
        if payload.allowed_capabilities:
            registry = DynamicTaxonomyRegistry(capabilities=payload.allowed_capabilities)

        engine = EIEIntelligenceEngine(taxonomy_registry=registry)
        evaluation_result = engine.evaluate(
            evidence_id=payload.evidence_id,
            observations=observations,
            custom_taxonomy=payload.allowed_capabilities
        )

        # 3. Format CIG Event Payload with exact Section Provenance
        cig_event = CIGEventBuilder.build_event(
            evaluation=evaluation_result,
            evidence_id=payload.evidence_id,
            user_id=payload.user_id,
            evidence_type="project_report",
            source_reference=payload.title,
            observations=observations
        )

        return EvaluateReportResponse(
            success=True,
            evidence_id=payload.evidence_id,
            sections_and_facts_count=len(observations),
            event=cig_event
        )

    except ReportAnalyzerError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "EVIDENCE_INSUFFICIENT", "message": str(e)}
        )
    except InvalidAIOutputException as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "INVALID_AI_OUTPUT", "message": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "AI_EVALUATION_FAILED", "message": str(e)}
        )
# =====================================================================
# 4. ASSESSMENT RESULT PIPELINE (Phase 3: Exam / Quiz Intelligence)
# =====================================================================

class EvaluateAssessmentRequest(BaseModel):
    evidence_id: str = Field(..., description="Unique evidence ID e.g. EV_ASM_001")
    user_id: str = Field(..., description="Submitting learner ID e.g. USR_001")
    assessment_id: str = Field(..., description="Assessment test ID e.g. ASM_BACKEND_101")
    title: str = Field(..., description="Assessment Title e.g. Node.js & Database Assessment")
    questions: List[AssessmentQuestionResult] = Field(..., min_length=1)
    allowed_capabilities: Optional[List[CanonicalCapability]] = None


class EvaluateAssessmentResponse(BaseModel):
    success: bool
    evidence_id: str
    questions_evaluated: int
    event: CIGEvidenceEvaluatedEvent


@router.post(
    "/evaluate/assessment",
    response_model=EvaluateAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Phase 3: Analyzes question-level assessment results with question provenance"
)
async def evaluate_assessment_result(payload: EvaluateAssessmentRequest):
    try:
        # 1. Deterministic Extraction (Question-level facts & topic aggregation)
        analyzer = AssessmentResultAnalyzer()
        observations = analyzer.analyze_assessment(
            assessment_id=payload.assessment_id,
            evidence_id=payload.evidence_id,
            questions=payload.questions
        )

        # 2. AI Reasoning & Anti-Hallucination Validation
        registry = None
        if payload.allowed_capabilities:
            registry = DynamicTaxonomyRegistry(capabilities=payload.allowed_capabilities)

        engine = EIEIntelligenceEngine(taxonomy_registry=registry)
        evaluation_result = engine.evaluate(
            evidence_id=payload.evidence_id,
            observations=observations,
            custom_taxonomy=payload.allowed_capabilities
        )

        # 3. Format CIG Event Payload with exact Question ID Provenance
        cig_event = CIGEventBuilder.build_event(
            evaluation=evaluation_result,
            evidence_id=payload.evidence_id,
            user_id=payload.user_id,
            evidence_type="assessment_result",
            source_reference=payload.assessment_id,
            observations=observations
        )

        return EvaluateAssessmentResponse(
            success=True,
            evidence_id=payload.evidence_id,
            questions_evaluated=len(payload.questions),
            event=cig_event
        )

    except AssessmentAnalyzerError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "EVIDENCE_INSUFFICIENT", "message": str(e)}
        )
    except InvalidAIOutputException as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "INVALID_AI_OUTPUT", "message": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "AI_EVALUATION_FAILED", "message": str(e)}
        )
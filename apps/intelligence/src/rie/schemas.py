# apps/intelligence/src/rie/schemas.py
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from src.evidence.schemas import (
    ProficiencyLevel,
    MasteryLevel,
    EvidenceStrengthLevel,
)
from src.cie.schemas import (
    CapabilityRequirement,
    ExperienceRequirement,
    EvidenceExpectation,
    RequirementImportance,
)
from src.rie.enums import (
    CapabilityReadinessState,
    ExperienceReadinessStatus,
    ReadinessInterpretation,
    TrendDirection,
)
from src.rie.constants import RIE_MODEL_VERSION


# --- 1. INPUT SCHEMAS FROM CIG & CIE (Sections 5, 6, 7) ---

class CIGCapabilityStateInput(BaseModel):
    capability_id: str
    proficiency: ProficiencyLevel
    mastery: MasteryLevel
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence_strength: EvidenceStrengthLevel


class CIGLearnerStateInput(BaseModel):
    learner_id: str
    state_version: str
    capabilities: List[CIGCapabilityStateInput] = Field(default_factory=list)
    experience_state: Dict[str, ExperienceReadinessStatus] = Field(
        default_factory=dict,
        description="Maps experience requirement_id to satisfaction status"
    )
    consistency: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Learning consistency metric from UPE (0.0 - 1.0)"
    )
    goal_id: str
    active_target_id: str


class CIERequirementsInput(BaseModel):
    cie_evaluation_id: str
    cie_version: str = "CIE-1.0"
    target_id: str
    capability_requirements: List[CapabilityRequirement] = Field(..., min_length=1)
    experience_requirements: List[ExperienceRequirement] = Field(default_factory=list)
    evidence_expectations: List[EvidenceExpectation] = Field(default_factory=list)


class RIEInput(BaseModel):
    learner_state: CIGLearnerStateInput
    cie_requirements: CIERequirementsInput
    previous_evaluation: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Previous RIE evaluation for trend calculation"
    )


# --- 2. INTERNAL COMPUTATION SCHEMAS ---

class EvaluatedCapabilityReadiness(BaseModel):
    capability_id: str
    required_proficiency: ProficiencyLevel
    attained_proficiency: Optional[ProficiencyLevel] = None
    required_rank: int
    attained_rank: int
    attainment_ratio: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    readiness: float = Field(..., ge=0.0, le=1.0)
    importance: RequirementImportance
    importance_weight: float
    state: CapabilityReadinessState


class EvaluatedEvidenceReadiness(BaseModel):
    requirement_id: str
    capability_id: str
    required_strength: EvidenceStrengthLevel
    attained_strength: Optional[EvidenceStrengthLevel] = None
    required_rank: int
    attained_rank: int
    attainment_ratio: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    readiness: float = Field(..., ge=0.0, le=1.0)


class PriorityGap(BaseModel):
    capability_id: str
    required_proficiency: ProficiencyLevel
    attained_proficiency: Optional[ProficiencyLevel] = None
    gap: int = Field(..., ge=0)
    normalized_gap: float = Field(..., ge=0.0, le=1.0)
    importance: RequirementImportance
    importance_weight: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    priority: float = Field(..., ge=0.0, le=1.0)
    state: CapabilityReadinessState


# --- 3. DIMENSIONAL & OVERALL READINESS (Sections 17, 18, 20, 24) ---

class ReadinessScores(BaseModel):
    overall: float = Field(..., ge=0.0, le=1.0)
    technical_capability: float = Field(..., ge=0.0, le=1.0)
    evidence_strength: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    experience: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    consistency: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    goal_alignment: float = Field(default=1.0, ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    interpretation: ReadinessInterpretation
    active_weights: Dict[str, float] = Field(
        default_factory=dict,
        description="Weights applied after missing-dimension renormalization"
    )


class ReadinessTrend(BaseModel):
    current: float = Field(..., ge=0.0, le=1.0)
    previous: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    delta: Optional[float] = None
    direction: TrendDirection


class RIEProvenance(BaseModel):
    cig_state_version: str
    cie_evaluation_id: str
    cie_version: str
    model_version: str = RIE_MODEL_VERSION


# --- 4. QUALITATIVE LLM EXPLANATION CONTRACT (Section 33) ---

class PriorityGapExplanation(BaseModel):
    capability_id: str
    explanation: str


class RIEExplanation(BaseModel):
    summary: str
    readiness_explanation: str
    priority_gap_explanations: List[PriorityGapExplanation] = Field(default_factory=list)
    trend_explanation: str
    confidence_explanation: str


# --- 5. FINAL RIE OUTPUT CONTRACT (Section 25) ---

class RIEOutput(BaseModel):
    rie_evaluation_id: str
    learner_id: str
    goal_id: str
    target_id: str
    model_version: str = RIE_MODEL_VERSION
    input_state_version: str
    cie_evaluation_id: str
    cie_version: str
    readiness: ReadinessScores
    capabilities: List[EvaluatedCapabilityReadiness]
    priority_gaps: List[PriorityGap]
    trend: ReadinessTrend
    provenance: RIEProvenance
    explanation: Optional[RIEExplanation] = None
    generated_at: str
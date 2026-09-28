# apps/intelligence/src/upe/schemas.py
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from src.evidence.schemas import ProficiencyLevel, EvidenceStrengthLevel
from src.cie.schemas import RequirementImportance
from src.upe.enums import (
    ProgressBand,
    VelocityTrendDirection,
    ProgressTrendDirection,
    CapabilityProgressTrend,
    ProgressSignalType,
)
from src.upe.constants import UPE_MODEL_VERSION


# --- 1. INPUT CONTRACTS (Section 16) ---

class CapabilityStateInput(BaseModel):
    capability_id: str
    proficiency: ProficiencyLevel
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence_strength: Optional[EvidenceStrengthLevel] = None
    importance: RequirementImportance = RequirementImportance.CORE
    historical_proficiency: Optional[ProficiencyLevel] = None
    historical_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class LearningActivitySignal(BaseModel):
    signal_id: str
    signal_type: ProgressSignalType
    timestamp: str
    progress_delta: float = Field(default=0.0, ge=0.0)
    capability_id: Optional[str] = None
    is_aligned_with_target: bool = True
    alignment_weight: float = Field(default=1.0, ge=0.0, le=1.0)


class PeriodActivity(BaseModel):
    period_id: str
    meaningful_progress: float = Field(default=0.0, ge=0.0)


class PreviousProgressContext(BaseModel):
    evaluation_id: str
    overall_progress: float = Field(..., ge=0.0, le=1.0)
    velocity: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    timestamp: str


class UPEInput(BaseModel):
    learner_id: str
    active_goal_id: str
    target_id: str
    cig_state_version: str

    capability_states: List[CapabilityStateInput] = Field(default_factory=list)
    meaningful_progress_current: float = Field(default=0.0, ge=0.0)
    meaningful_progress_previous: Optional[float] = Field(default=None, ge=0.0)
    elapsed_time_units: Optional[float] = Field(default=None, ge=0.0)  # delta_t

    eligible_periods: List[PeriodActivity] = Field(default_factory=list)
    recent_activity_signals: List[LearningActivitySignal] = Field(default_factory=list)
    previous_progress: Optional[PreviousProgressContext] = None

    v_ref: Optional[float] = Field(default=None, gt=0.0)
    velocity_epsilon: Optional[float] = Field(default=None, ge=0.0)
    progress_epsilon: Optional[float] = Field(default=None, ge=0.0)


# --- 2. CAPABILITY-LEVEL PROGRESS (Section 14) ---

class CapabilityProgress(BaseModel):
    capability_id: str
    previous_rank: Optional[int] = None
    current_rank: int
    previous_confidence: Optional[float] = None
    current_confidence: float
    depth: float = Field(..., ge=0.0, le=1.0)
    trend: CapabilityProgressTrend


# --- 3. TREND & SIGNALS (Section 8, 12, 19) ---

class TrendSummary(BaseModel):
    overall: ProgressTrendDirection
    velocity: VelocityTrendDirection
    delta_progress: Optional[float] = None
    delta_velocity: Optional[float] = None


class ADESignalPayload(BaseModel):
    overall_progress: float
    depth: float
    velocity: Optional[float] = None
    consistency: Optional[float] = None
    alignment: Optional[float] = None
    overall_trend: ProgressTrendDirection
    velocity_trend: VelocityTrendDirection


# --- 4. EVALUATION OUTPUT CONTRACT (Section 13) ---

class SourceStateMetadata(BaseModel):
    cig_state_version: str
    previous_progress_evaluation_id: Optional[str] = None
    generated_at: str


class UPEProvenance(BaseModel):
    cig_state_version: str
    target_id: str
    model_version: str = UPE_MODEL_VERSION
    v_ref: float
    velocity_epsilon: float
    progress_epsilon: float
    dimension_weights: Dict[str, float]


class ProgressEvaluation(BaseModel):
    evaluation_id: str
    learner_id: str
    goal_id: str
    target_id: str

    source_state: SourceStateMetadata

    depth: float = Field(..., ge=0.0, le=1.0)
    velocity: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    consistency: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    alignment: Optional[float] = Field(default=None, ge=0.0, le=1.0)

    overall_progress: float = Field(..., ge=0.0, le=1.0)
    progress_band: ProgressBand

    trend: TrendSummary
    capability_progress: List[CapabilityProgress] = Field(default_factory=list)

    ade_signal: ADESignalPayload
    provenance: UPEProvenance
    model_version: str = UPE_MODEL_VERSION
    created_at: str
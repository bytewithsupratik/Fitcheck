# apps/intelligence/src/ade/schemas.py
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from src.ade.enums import (
    ADEDecisionType,
    ImpactLevel,
    DecisionStatus,
    ApprovalStatus,
    ExecutionStatus,
    Executor,
)
from src.ade.constants import ADE_VERSION, ADE_CONFIG_VERSION, ADE_RULE_VERSION


class StructuredImpact(BaseModel):
    magnitude: float = Field(..., ge=0.0, le=1.0)
    persistence: float = Field(..., ge=0.0, le=1.0)
    scope: str  # "CAPABILITY" | "EXPERIENCE" | "TRAJECTORY" | "GOAL"
    trajectory_relevance: float = Field(..., ge=0.0, le=1.0)
    learning_state_effect: str
    impact_level: ImpactLevel


class CandidateDecision(BaseModel):
    candidate_id: str
    decision_type: ADEDecisionType
    learner_id: str
    trigger_event_id: str
    reason_codes: List[str] = Field(default_factory=list)
    impact: StructuredImpact
    priority: int = Field(default=0, ge=0)
    target_executor: Executor
    approval_required: bool
    constraints: Dict[str, Any] = Field(default_factory=dict)
    source_state: Dict[str, Any] = Field(default_factory=dict)
    provenance: Dict[str, Any] = Field(default_factory=dict)
    rule_id: str
    rule_version: str = ADE_RULE_VERSION


class ADEDecisionProvenance(BaseModel):
    trigger_event_id: str
    source_evaluations: Dict[str, str] = Field(default_factory=dict)
    cig_state_version: str
    rule_id: str
    rule_version: str = ADE_RULE_VERSION
    configuration_version: str = ADE_CONFIG_VERSION
    ade_version: str = ADE_VERSION


class ADEDecisionRecord(BaseModel):
    decision_id: str
    learner_id: str
    decision_type: ADEDecisionType
    impact_level: ImpactLevel
    status: DecisionStatus
    approval_status: ApprovalStatus
    execution_status: ExecutionStatus
    trigger_event_id: str
    correlation_id: str
    causation_id: Optional[str] = None
    target_executor: Executor
    action_payload: Dict[str, Any] = Field(default_factory=dict)
    reason_codes: List[str] = Field(default_factory=list)
    rule_id: str
    provenance: ADEDecisionProvenance
    created_at: str
    updated_at: str
    expires_at: Optional[str] = None


class ADEDecisionContext(BaseModel):
    learner_id: str
    active_goal: Dict[str, Any] = Field(default_factory=dict)
    career_target: Dict[str, Any] = Field(default_factory=dict)
    trajectory: Dict[str, Any] = Field(default_factory=dict)
    relevant_capabilities: List[Dict[str, Any]] = Field(default_factory=list)
    progress_state: Optional[Dict[str, Any]] = None
    readiness_state: Optional[Dict[str, Any]] = None
    evidence_changes: List[Dict[str, Any]] = Field(default_factory=list)
    learning_experience: Optional[Dict[str, Any]] = None
    decision_history: List[Dict[str, Any]] = Field(default_factory=list)
    governance_state: Dict[str, Any] = Field(default_factory=dict)
    cig_state_version: str
    system_metadata: Dict[str, Any] = Field(default_factory=dict)


    # In apps/intelligence/src/ade/schemas.py
class ADEDecisionRecord(BaseModel):
  decision_id: str
  learner_id: str
  decision_type: ADEDecisionType
  impact_level: ImpactLevel
  status: DecisionStatus
  approval_status: ApprovalStatus
  execution_status: ExecutionStatus
  trigger_event_id: str
  correlation_id: str
  causation_id: Optional[str] = None
  target_executor: Executor
  action_payload: Dict[str, Any] = Field(default_factory=dict)
  reason_codes: List[str] = Field(default_factory=list)
  rule_id: str = "RULE-MANUAL"
  provenance: ADEDecisionProvenance
  created_at: str = Field(
      default_factory=lambda: datetime.now(timezone.utc).isoformat()
  )
  updated_at: str = Field(
      default_factory=lambda: datetime.now(timezone.utc).isoformat()
  )
  expires_at: Optional[str] = None


class ADEDecisionContext(BaseModel):
  learner_id: str
  active_goal: Dict[str, Any] = Field(default_factory=dict)
  career_target: Dict[str, Any] = Field(default_factory=dict)
  trajectory: Dict[str, Any] = Field(default_factory=dict)
  relevant_capabilities: List[Dict[str, Any]] = Field(default_factory=list)
  progress_state: Optional[Any] = (
      None  # Can be dict, float score, or normalized model
  )
  readiness_state: Optional[Any] = (
      None  # Can be dict, float score, or normalized model
  )
  evidence_changes: List[Dict[str, Any]] = Field(default_factory=list)
  learning_experience: Optional[Dict[str, Any]] = None
  decision_history: List[Dict[str, Any]] = Field(default_factory=list)
  governance_state: Dict[str, Any] = Field(default_factory=dict)
  cig_state_version: str
  system_metadata: Dict[str, Any] = Field(default_factory=dict)
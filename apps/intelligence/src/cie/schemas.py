# apps/intelligence/src/cie/schemas.py
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# 1. REUSE EXISTING CANONICAL ENUMS FROM EIE (Section 6 & 34)
from src.evidence.schemas import (
    ProficiencyLevel,
    MasteryLevel,
    EvidenceStrengthLevel,
)


# 2. CIE-SPECIFIC ENUMS (Section 34)
class TargetType(str, Enum):
    CAREER = "CAREER"
    DOMAIN = "DOMAIN"


class RequirementImportance(str, Enum):
    CORE = "CORE"
    IMPORTANT = "IMPORTANT"
    SUPPORTING = "SUPPORTING"
    OPTIONAL = "OPTIONAL"


class RequirementType(str, Enum):
    TECHNICAL = "TECHNICAL"
    DOMAIN = "DOMAIN"
    TOOL = "TOOL"
    KNOWLEDGE = "KNOWLEDGE"
    BEHAVIORAL = "BEHAVIORAL"


class RequirementPriority(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class RequirementSpecificity(str, Enum):
    GENERIC = "GENERIC"
    TARGET_SPECIFIC = "TARGET_SPECIFIC"


class RoadmapStageType(str, Enum):
    FOUNDATION = "FOUNDATION"
    CORE = "CORE"
    APPLIED = "APPLIED"
    ADVANCED = "ADVANCED"
    SPECIALIZATION = "SPECIALIZATION"


class TrajectoryStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class AlternativeContext(str, Enum):
    ACTIVE_GOAL = "ACTIVE_GOAL"
    POST_GOAL = "POST_GOAL"


# 3. TARGET DEFINITION (Section 7)
class Target(BaseModel):
    target_id: str = Field(..., description="e.g. CAREER-AI-ENGINEER")
    target_type: TargetType
    name: str
    taxonomy_version: str = "TAX_001"


# 4. TARGET REQUIREMENT MODELS (Sections 11, 12, 13, 14)
class CapabilityRequirement(BaseModel):
    capability_id: str = Field(..., description="Canonical ID e.g. CAP-PYTHON")
    importance: RequirementImportance
    expected_proficiency: ProficiencyLevel
    requirement_type: RequirementType


class LearningRequirement(BaseModel):
    requirement_id: str
    capability_id: str
    topic: str
    priority: RequirementPriority
    prerequisite_ids: List[str] = Field(default_factory=list)
    expected_outcome: str


class ExperienceRequirement(BaseModel):
    requirement_id: str
    category: str
    description: str
    specificity: RequirementSpecificity
    capability_ids: List[str] = Field(default_factory=list)


class EvidenceExpectation(BaseModel):
    expectation_id: str
    requirement_id: str
    evidence_type: str
    minimum_strength: EvidenceStrengthLevel


class TargetProfile(BaseModel):
    target: Target
    description: str
    capability_requirements: List[CapabilityRequirement] = Field(default_factory=list)
    learning_requirements: List[LearningRequirement] = Field(default_factory=list)
    experience_requirements: List[ExperienceRequirement] = Field(default_factory=list)
    evidence_expectations: List[EvidenceExpectation] = Field(default_factory=list)
    progression_paths: List[str] = Field(default_factory=list)
    version: str = "1.0"


# 5. ROADMAP & TRAJECTORY MODELS (Sections 16, 21)
class RoadmapStage(BaseModel):
    stage_id: str
    name: str
    stage_type: RoadmapStageType
    order: int
    capability_ids: List[str] = Field(default_factory=list)
    learning_requirement_ids: List[str] = Field(default_factory=list)


class Roadmap(BaseModel):
    roadmap_id: str
    target_id: str
    version: str = "1.0"
    stages: List[RoadmapStage] = Field(default_factory=list)


class Trajectory(BaseModel):
    trajectory_id: str
    goal_id: str
    target_id: str
    starting_state_version: str
    roadmap_id: str
    current_stage_id: Optional[str] = None
    status: TrajectoryStatus = TrajectoryStatus.ACTIVE
    version: str = "1.0"


# 6. ALTERNATIVE DIRECTIONS MODEL (Section 23)
class AlternativeDirection(BaseModel):
    target_id: str
    relevance: float = Field(..., ge=0.0, le=1.0)
    reason: str
    context: AlternativeContext


# 7. INPUT MODELS FROM CIG (Section 6 & 40)
class CIEGoalInput(BaseModel):
    goal_id: str
    target_id: str
    target_type: TargetType
    priority: str = "HIGH"


class CIECapabilityInput(BaseModel):
    capability_id: str
    proficiency: ProficiencyLevel
    mastery: MasteryLevel
    confidence: float = Field(..., ge=0.0, le=1.0)


class CIEInput(BaseModel):
    learner_id: str
    state_version: str
    goal: CIEGoalInput
    capabilities: List[CIECapabilityInput] = Field(default_factory=list)
    career_state: Dict[str, Any] = Field(default_factory=dict)
    career_dna: Dict[str, Any] = Field(default_factory=dict)
    relevant_history: List[Dict[str, Any]] = Field(default_factory=list)


# 8. ALIGNMENT & RELEVANCE OUTPUT MODELS (Sections 24, 27, 28, 41, 42)
class CapabilityAlignment(BaseModel):
    capability_id: str
    importance: RequirementImportance
    expected_proficiency: ProficiencyLevel
    current_proficiency: Optional[ProficiencyLevel] = None
    confidence: float = 0.0
    status: str  # "SUPPORTING" | "MISSING"


class AlignmentResult(BaseModel):
    supporting: List[CapabilityAlignment] = Field(default_factory=list)
    missing: List[CapabilityAlignment] = Field(default_factory=list)
    required: List[CapabilityAlignment] = Field(default_factory=list)


class RelevanceResult(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    breakdown: Dict[str, float] = Field(
        default_factory=dict,
        description="50% Capability, 30% Goal, 20% DNA components"
    )


class CIERequirements(BaseModel):
    learning: List[LearningRequirement] = Field(default_factory=list)
    experience: List[ExperienceRequirement] = Field(default_factory=list)
    evidence: List[EvidenceExpectation] = Field(default_factory=list)


class CIEOutput(BaseModel):
    cie_evaluation_id: str
    learner_id: str
    goal_id: str
    input_state_version: str
    target: Target
    relevance: RelevanceResult
    capability_alignment: AlignmentResult
    requirements: CIERequirements
    roadmap: Roadmap
    trajectory: Trajectory
    progression: Dict[str, Any] = Field(default_factory=dict)
    alternative_directions: List[AlternativeDirection] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)
    generated_at: str

class CIEReasoning(BaseModel):
    summary: str = Field(..., description="High-level human-readable alignment summary")
    gap_narrative: str = Field(..., description="Contextual explanation of missing capabilities")
    trajectory_rationale: str = Field(..., description="Why the learner is positioned at this specific stage")

class CIEOutput(BaseModel):
    cie_evaluation_id: str
    learner_id: str
    goal_id: str
    input_state_version: str
    target: Target
    relevance: RelevanceResult
    capability_alignment: AlignmentResult
    requirements: CIERequirements
    roadmap: Roadmap
    trajectory: Trajectory
    progression: Dict[str, Any] = Field(default_factory=dict)
    alternative_directions: List[AlternativeDirection] = Field(default_factory=list)
    reasoning: Optional[CIEReasoning] = Field(
        default=None,
        description="Constrained AI-synthesized qualitative explanation"
    )
    provenance: Dict[str, Any] = Field(default_factory=dict)
    generated_at: str
# apps/intelligence/src/mie/schemas.py
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from src.evidence.schemas import (
    ProficiencyLevel,
    EvidenceStrengthLevel,
)
from src.cie.schemas import (
    CapabilityRequirement,
    LearningRequirement,
    ExperienceRequirement,
    EvidenceExpectation,
)
from src.rie.mie_handoff import MIEMissionInputItem
from src.mie.enums import (
    ExperienceStatus,
    StepType,
    ResourceType,
    ResourceValidationStatus,
    ProjectStatus,
    AssessmentType,
    AssessmentStatus,
)
from src.mie.constants import MIE_VERSION


# --- 1. MIE INPUT CONTRACT (Section 6) ---

class LearnerContextInput(BaseModel):
    learner_id: str
    goal_id: str
    target_id: str
    current_state_version: str


class CIERequirementsPayload(BaseModel):
    cie_version: str = "1.0"
    capability_requirements: List[CapabilityRequirement] = Field(default_factory=list)
    learning_requirements: List[LearningRequirement] = Field(default_factory=list)
    experience_requirements: List[ExperienceRequirement] = Field(default_factory=list)
    evidence_expectations: List[EvidenceExpectation] = Field(default_factory=list)


class RIEHandoffPayloadInput(BaseModel):
    readiness_evaluation_id: str
    source_state_version: str
    priority_gaps: List[MIEMissionInputItem] = Field(default_factory=list)


class CIGContextInput(BaseModel):
    capability_states: List[Dict[str, Any]] = Field(default_factory=list)
    learning_history: List[Dict[str, Any]] = Field(default_factory=list)
    previous_experiences: List[Dict[str, Any]] = Field(default_factory=list)
    previous_assessments: List[Dict[str, Any]] = Field(default_factory=list)


class MIEInput(BaseModel):
    learner_context: LearnerContextInput
    cie_requirements: CIERequirementsPayload
    rie_handoff: RIEHandoffPayloadInput
    cig_context: CIGContextInput = Field(default_factory=CIGContextInput)


# --- 2. RESOURCE SCHEMA (Section 11) ---

class Resource(BaseModel):
    resource_id: str
    type: ResourceType
    title: str
    description: str
    url: str
    source: str
    capability_ids: List[str] = Field(default_factory=list)
    learning_requirement_ids: List[str] = Field(default_factory=list)
    topics: List[str] = Field(default_factory=list)
    difficulty: ProficiencyLevel
    estimated_duration_minutes: int
    prerequisites: List[str] = Field(default_factory=list)
    language: str = "en"
    quality_score: float = Field(default=0.90, ge=0.0, le=1.0)
    relevance_score: float = Field(default=0.90, ge=0.0, le=1.0)
    validation_status: ResourceValidationStatus = ResourceValidationStatus.VALID
    version: int = 1
    created_at: str
    updated_at: str


# --- 3. CODING PROJECT SCHEMA (Section 12, 13, 14, 15) ---

class FunctionalRequirement(BaseModel):
    id: str
    description: str
    capability_ids: List[str] = Field(default_factory=list)


class ProjectMilestone(BaseModel):
    milestone_id: str
    title: str
    tasks: List[str] = Field(default_factory=list)


class EvaluationCriterion(BaseModel):
    criterion_id: str
    capability_id: str
    description: str
    evidence_type: str = "GITHUB_REPOSITORY"


class ExpectedEvidenceSpec(BaseModel):
    evidence_type: str = "GITHUB_REPOSITORY"
    minimum_strength: EvidenceStrengthLevel = EvidenceStrengthLevel.STRONG
    required: bool = True


class GitHubSubmissionSpec(BaseModel):
    required: bool = True
    repository_required: bool = True
    branch: str = "main"
    required_files: List[str] = Field(default_factory=lambda: ["README.md", "package.json", "src/"])
    required_documentation: List[str] = Field(default_factory=lambda: ["Project setup", "API usage", "Testing instructions"])


class CodingProject(BaseModel):
    project_id: str
    learner_id: str
    title: str
    description: str
    target_id: str
    capability_ids: List[str] = Field(default_factory=list)
    learning_requirement_ids: List[str] = Field(default_factory=list)
    experience_requirement_id: Optional[str] = None
    difficulty: ProficiencyLevel
    estimated_duration_minutes: int
    prerequisites: List[str] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)
    functional_requirements: List[FunctionalRequirement] = Field(default_factory=list)
    technical_constraints: List[str] = Field(default_factory=list)
    milestones: List[ProjectMilestone] = Field(default_factory=list)
    expected_outcomes: List[str] = Field(default_factory=list)
    evaluation_criteria: List[EvaluationCriterion] = Field(default_factory=list)
    expected_evidence: List[ExpectedEvidenceSpec] = Field(default_factory=list)
    github_submission: GitHubSubmissionSpec = Field(default_factory=GitHubSubmissionSpec)
    validation_status: str = "VALID"
    status: ProjectStatus = ProjectStatus.AVAILABLE
    version: int = 1
    created_at: str
    updated_at: str


# --- 4. ASSESSMENT SCHEMA (Section 20-31) ---

class QuestionOption(BaseModel):
    option_id: str
    text: str


class Question(BaseModel):
    question_id: str
    type: AssessmentType
    prompt: str
    capability_ids: List[str] = Field(..., min_length=1)
    learning_requirement_ids: List[str] = Field(default_factory=list)
    difficulty: ProficiencyLevel
    options: List[QuestionOption] = Field(default_factory=list)
    expected_answer: str
    explanation: str
    evaluation_criteria: List[str] = Field(default_factory=list)
    points: int = 1
    validation_status: str = "VALID"
    version: int = 1


class Assessment(BaseModel):
    assessment_id: str
    learner_id: str
    experience_id: str
    target_id: str
    capability_ids: List[str] = Field(default_factory=list)
    learning_requirement_ids: List[str] = Field(default_factory=list)
    assessment_type: AssessmentType = AssessmentType.MCQ
    difficulty: ProficiencyLevel
    estimated_duration_minutes: int
    questions: List[Question] = Field(default_factory=list)
    scoring_policy: Dict[str, Any] = Field(default_factory=lambda: {"total_points": 10, "passing_score": 0.70})
    evidence_policy: Dict[str, Any] = Field(default_factory=lambda: {"evidence_type": "ASSESSMENT_RESULT"})
    validation_status: str = "VALID"
    status: AssessmentStatus = AssessmentStatus.AVAILABLE
    version: int = 1
    created_at: str
    updated_at: str


class QuestionResult(BaseModel):
    question_id: str
    correct: bool
    points_earned: int
    learner_answer: Optional[str] = None


class AssessmentScore(BaseModel):
    earned: int
    possible: int
    percentage: float


class AssessmentResult(BaseModel):
    assessment_result_id: str
    assessment_id: str
    learner_id: str
    score: AssessmentScore
    question_results: List[QuestionResult] = Field(default_factory=list)
    submitted_at: str


# --- 5. LEARNING EXPERIENCE SCHEMA (Section 7, 8) ---

class ExperienceStep(BaseModel):
    step: int
    type: StepType
    item_id: str
    title: str
    status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED


class SourceStateTrace(BaseModel):
    cie_version: str
    rie_evaluation_id: str
    cig_state_version: str


class LearningExperience(BaseModel):
    experience_id: str
    learner_id: str
    goal_id: str
    target_id: str
    source_state: SourceStateTrace
    capability_ids: List[str] = Field(default_factory=list)
    learning_requirement_ids: List[str] = Field(default_factory=list)
    resources: List[Resource] = Field(default_factory=list)
    coding_project: Optional[CodingProject] = None
    assessment: Optional[Assessment] = None
    sequence: List[ExperienceStep] = Field(default_factory=list)
    difficulty: ProficiencyLevel
    estimated_duration_minutes: int
    status: ExperienceStatus = ExperienceStatus.GENERATED
    version: int = 1
    created_at: str
    updated_at: str
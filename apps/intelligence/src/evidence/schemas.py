# apps/intelligence/src/evidence/schemas.py
from enum import Enum
from typing import List, Dict, Any
from pydantic import BaseModel, Field, field_validator


# --- 1. ENUMS (Strictly per FitCheck Specifications) ---

class ProficiencyLevel(str, Enum):
    FOUNDATIONAL = "FOUNDATIONAL"
    DEVELOPING = "DEVELOPING"
    PROFICIENT = "PROFICIENT"
    ADVANCED = "ADVANCED"


class MasteryLevel(str, Enum):
    NOT_DEMONSTRATED = "NOT_DEMONSTRATED"
    PARTIALLY_DEMONSTRATED = "PARTIALLY_DEMONSTRATED"
    DEMONSTRATED = "DEMONSTRATED"
    STRONGLY_DEMONSTRATED = "STRONGLY_DEMONSTRATED"


class EvidenceStrengthLevel(str, Enum):
    WEAK = "WEAK"
    MODERATE = "MODERATE"
    STRONG = "STRONG"
    VERY_STRONG = "VERY_STRONG"


class ObservationCategory(str, Enum):
    REPOSITORY_METADATA = "REPOSITORY_METADATA"
    DEPENDENCY = "DEPENDENCY"
    API_ROUTE = "API_ROUTE"
    DATABASE = "DATABASE"
    TEST = "TEST"
    DOCUMENTATION = "DOCUMENTATION"
    STRUCTURE = "STRUCTURE"


# --- 2. DYNAMIC CAPABILITY TAXONOMY ---
# The LLM is strictly prohibited from inventing arbitrary skills.
class CanonicalCapability(BaseModel):
    capability_id: str = Field(..., pattern=r"^CAP-[A-Z0-9_\-]+$")
    name: str
    category: str
    description: str


# --- 3. INPUT OBSERVATION MODEL (Passed from Deterministic Extractor) ---

class ObservationDTO(BaseModel):
    observation_id: str
    evidence_id: str
    category: ObservationCategory
    name: str
    value: Any
    source_location: str
    verified: bool = True


# --- 4. AI INTERPRETATION MODELS (Produced by the AI) ---

class AIClaimDTO(BaseModel):
    temp_claim_id: str
    capability_id: str
    statement: str = Field(..., min_length=5)
    supporting_observation_ids: List[str] = Field(..., min_length=1)
    confidence: float = Field(..., ge=0.0, le=1.0)


class AICapabilityEvaluationDTO(BaseModel):
    capability_id: str
    proficiency: ProficiencyLevel
    mastery: MasteryLevel
    evidence_strength: EvidenceStrengthLevel
    confidence: float = Field(..., ge=0.0, le=1.0)
    supporting_temp_claim_ids: List[str] = Field(..., min_length=1)
    supporting_observation_ids: List[str] = Field(..., min_length=1)


class ProjectClassification(BaseModel):
    type: str = "PROJECT"
    domain: str = "SOFTWARE_DEVELOPMENT"
    subdomain: str = "GENERAL"


class AIEvaluationResponseDTO(BaseModel):
    classification: ProjectClassification
    overall_confidence: float = Field(..., ge=0.0, le=1.0)
    claims: List[AIClaimDTO]
    capability_evaluations: List[AICapabilityEvaluationDTO]
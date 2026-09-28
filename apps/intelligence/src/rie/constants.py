# apps/intelligence/src/rie/constants.py
from typing import Dict, Tuple
from src.evidence.schemas import ProficiencyLevel, EvidenceStrengthLevel
from src.cie.schemas import RequirementImportance

RIE_MODEL_VERSION = "RIE-1.0"

# Canonical Proficiency Ranks (Section 8)
PROFICIENCY_RANKS: Dict[ProficiencyLevel, int] = {
    ProficiencyLevel.FOUNDATIONAL: 1,
    ProficiencyLevel.DEVELOPING: 2,
    ProficiencyLevel.PROFICIENT: 3,
    ProficiencyLevel.ADVANCED: 4,
}

# Canonical Evidence Strength Ranks (Section 13)
EVIDENCE_STRENGTH_RANKS: Dict[EvidenceStrengthLevel, int] = {
    EvidenceStrengthLevel.WEAK: 1,
    EvidenceStrengthLevel.MODERATE: 2,
    EvidenceStrengthLevel.STRONG: 3,
    EvidenceStrengthLevel.VERY_STRONG: 4,
}

# Canonical Importance Weights (Section 11)
IMPORTANCE_WEIGHTS: Dict[RequirementImportance, float] = {
    RequirementImportance.CORE: 1.0,
    RequirementImportance.IMPORTANT: 0.7,
    RequirementImportance.SUPPORTING: 0.4,
    RequirementImportance.OPTIONAL: 0.2,
}

# Canonical Dimension Weights for Overall Readiness (Section 18)
READINESS_DIMENSION_WEIGHTS: Dict[str, float] = {
    "technical_capability": 0.40,
    "evidence_strength": 0.20,
    "experience": 0.15,
    "consistency": 0.10,
    "goal_alignment": 0.15,
}

# Deterministic Interpretation Bands (Section 20)
# Score bands: [min, max] -> Label
READINESS_BANDS: Dict[str, Tuple[float, float]] = {
    "LOW": (0.00, 0.39),
    "DEVELOPING": (0.40, 0.69),
    "READYING": (0.70, 0.84),
    "HIGH": (0.85, 1.00),
}
# apps/intelligence/src/upe/constants.py
from typing import Dict, Tuple
from src.evidence.schemas import ProficiencyLevel
from src.cie.schemas import RequirementImportance

UPE_MODEL_VERSION = "UPE-1.0"

# Canonical Proficiency Ranks (Section 6)
PROFICIENCY_RANKS: Dict[ProficiencyLevel, int] = {
    ProficiencyLevel.FOUNDATIONAL: 1,
    ProficiencyLevel.DEVELOPING: 2,
    ProficiencyLevel.PROFICIENT: 3,
    ProficiencyLevel.ADVANCED: 4,
}

# Canonical Importance Weights (Section 6)
IMPORTANCE_WEIGHTS: Dict[RequirementImportance, float] = {
    RequirementImportance.CORE: 1.0,
    RequirementImportance.IMPORTANT: 0.7,
    RequirementImportance.SUPPORTING: 0.4,
    RequirementImportance.OPTIONAL: 0.2,
}

# Dimension Weights for Overall Progress (Section 11)
PROGRESS_DIMENSION_WEIGHTS: Dict[str, float] = {
    "depth": 0.35,
    "velocity": 0.20,
    "consistency": 0.25,
    "alignment": 0.20,
}

# Descriptive Progress Interpretation Bands (Section 5)
PROGRESS_BANDS: Dict[str, Tuple[float, float]] = {
    "VERY_LOW": (0.00, 0.2499),
    "LOW": (0.25, 0.4999),
    "MODERATE": (0.50, 0.6999),
    "STRONG": (0.70, 0.8499),
    "VERY_STRONG": (0.85, 1.00),
}

# Configurable, Explicit, Versioned Pace & Tolerance Parameters (Sections 7, 8, 12)
DEFAULT_V_REF: float = 1.0             # Reference pace: 1.0 progress units per normalized time unit
DEFAULT_VELOCITY_EPSILON: float = 0.05 # Delta tolerance for velocity trend
DEFAULT_PROGRESS_EPSILON: float = 0.02 # Delta tolerance for overall progress trend
MINIMUM_ELIGIBLE_PERIODS: int = 2      # Minimum periods required for consistency
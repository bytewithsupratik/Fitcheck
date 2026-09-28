# apps/intelligence/src/mie/constants.py
from typing import Dict
from src.evidence.schemas import ProficiencyLevel

MIE_VERSION = "MIE-1.0"

# Canonical Resource Ranking Formula Weights (Section 11)
RESOURCE_RANKING_WEIGHTS: Dict[str, float] = {
    "requirement_alignment": 0.40,
    "capability_alignment": 0.25,
    "difficulty_fit": 0.15,
    "quality_score": 0.10,
    "learner_context_fit": 0.10,
}

# Mapping proficiency levels to numeric difficulty ranks (1-4)
DIFFICULTY_RANKS: Dict[ProficiencyLevel, int] = {
    ProficiencyLevel.FOUNDATIONAL: 1,
    ProficiencyLevel.DEVELOPING: 2,
    ProficiencyLevel.PROFICIENT: 3,
    ProficiencyLevel.ADVANCED: 4,
}

RANK_TO_PROFICIENCY: Dict[int, ProficiencyLevel] = {
    1: ProficiencyLevel.FOUNDATIONAL,
    2: ProficiencyLevel.DEVELOPING,
    3: ProficiencyLevel.PROFICIENT,
    4: ProficiencyLevel.ADVANCED,
}
# apps/intelligence/src/rie/enums.py
from enum import Enum


class CapabilityReadinessState(str, Enum):
    READY = "READY"
    PARTIALLY_READY = "PARTIALLY_READY"
    NOT_READY = "NOT_READY"


class ExperienceReadinessStatus(str, Enum):
    SATISFIED = "SATISFIED"
    PARTIAL = "PARTIAL"
    UNSATISFIED = "UNSATISFIED"


class ReadinessInterpretation(str, Enum):
    LOW = "LOW"
    DEVELOPING = "DEVELOPING"
    READYING = "READYING"
    HIGH = "HIGH"


class TrendDirection(str, Enum):
    IMPROVING = "IMPROVING"
    STABLE = "STABLE"
    DECLINING = "DECLINING"
    NO_PREVIOUS_DATA = "NO_PREVIOUS_DATA"
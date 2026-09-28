# apps/intelligence/src/ade/constants.py
from typing import Dict, Set
from src.ade.enums import ADEDecisionType, Executor

ADE_VERSION = "ADE-1.0"
ADE_CONFIG_VERSION = "ADE-CONFIG-1.0"
ADE_RULE_VERSION = "ADE-RULE-1.0"

# Decisions where user approval is strictly mandatory (Section 8)
APPROVAL_MANDATORY_DECISIONS: Set[ADEDecisionType] = {
    ADEDecisionType.PAUSE_LEARNING_PATH,
    ADEDecisionType.CHANGE_TOPIC,
    ADEDecisionType.CHANGE_ACTIVE_GOAL,
    ADEDecisionType.CHANGE_CAREER_TARGET,
    ADEDecisionType.ABANDON_LEARNING_PATH,
}

# Autonomous decisions allowed to dispatch without manual approval by default (Section 8)
AUTONOMOUS_DEFAULT_DECISIONS: Set[ADEDecisionType] = {
    ADEDecisionType.NO_ACTION,
    ADEDecisionType.GENERATE_LEARNING_EXPERIENCE,
    ADEDecisionType.REGENERATE_LEARNING_EXPERIENCE,
    ADEDecisionType.ADJUST_DIFFICULTY,
    ADEDecisionType.REDUCE_LOAD,
    ADEDecisionType.INCREASE_LOAD,
    ADEDecisionType.ADD_REMEDIATION,
    ADEDecisionType.INCREASE_PRACTICE,
    ADEDecisionType.CHANGE_SEQUENCE,
    ADEDecisionType.REASSESS_READINESS,
    ADEDecisionType.REASSESS_TRAJECTORY,
}

# Canonical Target Executors per Decision Type
DECISION_EXECUTORS: Dict[ADEDecisionType, Executor] = {
    ADEDecisionType.NO_ACTION: Executor.NONE,
    ADEDecisionType.GENERATE_LEARNING_EXPERIENCE: Executor.MIE,
    ADEDecisionType.REGENERATE_LEARNING_EXPERIENCE: Executor.MIE,
    ADEDecisionType.ADJUST_DIFFICULTY: Executor.MIE,
    ADEDecisionType.REDUCE_LOAD: Executor.MIE,
    ADEDecisionType.INCREASE_LOAD: Executor.MIE,
    ADEDecisionType.ADD_REMEDIATION: Executor.MIE,
    ADEDecisionType.INCREASE_PRACTICE: Executor.MIE,
    ADEDecisionType.CHANGE_SEQUENCE: Executor.MIE,
    ADEDecisionType.PAUSE_LEARNING_PATH: Executor.MIE,
    ADEDecisionType.RESUME_LEARNING_PATH: Executor.MIE,
    ADEDecisionType.CHANGE_TOPIC: Executor.CIE,
    ADEDecisionType.REASSESS_READINESS: Executor.RIE,
    ADEDecisionType.REASSESS_TRAJECTORY: Executor.CIE,
    ADEDecisionType.CHANGE_ACTIVE_GOAL: Executor.CIE,
    ADEDecisionType.CHANGE_CAREER_TARGET: Executor.CIE,
    ADEDecisionType.ABANDON_LEARNING_PATH: Executor.CIE,
}

# Precedence Hierarchy (Section 18)
# Trajectory > Remediation > Learning Path > Difficulty > Practice/Load > No Action
# In apps/intelligence/src/ade/constants.py

DECISION_PRECEDENCE: Dict[ADEDecisionType, int] = {
    ADEDecisionType.ABANDON_LEARNING_PATH: 100,
    ADEDecisionType.CHANGE_CAREER_TARGET: 95,
    ADEDecisionType.CHANGE_ACTIVE_GOAL: 90,
    ADEDecisionType.CHANGE_TOPIC: 85,  # Precedence 85: Topic change requires approval
    ADEDecisionType.REASSESS_TRAJECTORY: 80,  # Precedence 80
    ADEDecisionType.PAUSE_LEARNING_PATH: 75,
    ADEDecisionType.ADD_REMEDIATION: 70,
    ADEDecisionType.REGENERATE_LEARNING_EXPERIENCE: 65,
    ADEDecisionType.CHANGE_SEQUENCE: 60,
    ADEDecisionType.GENERATE_LEARNING_EXPERIENCE: 55,
    ADEDecisionType.REASSESS_READINESS: 50,
    ADEDecisionType.ADJUST_DIFFICULTY: 45,
    ADEDecisionType.REDUCE_LOAD: 40,
    ADEDecisionType.INCREASE_LOAD: 35,
    ADEDecisionType.INCREASE_PRACTICE: 30,
    ADEDecisionType.RESUME_LEARNING_PATH: 25,
    ADEDecisionType.NO_ACTION: 0,
}

# Configurable Cooldown Defaults (in seconds, Section 20 & 28)
DEFAULT_COOLDOWNS: Dict[ADEDecisionType, int] = {
    ADEDecisionType.ADJUST_DIFFICULTY: 86400,     # 24 hours
    ADEDecisionType.ADD_REMEDIATION: 172800,      # 48 hours
    ADEDecisionType.REDUCE_LOAD: 86400,          # 24 hours
    ADEDecisionType.INCREASE_LOAD: 86400,        # 24 hours
    ADEDecisionType.CHANGE_TOPIC: 604800,         # 7 days
    ADEDecisionType.REASSESS_READINESS: 43200,    # 12 hours
    ADEDecisionType.REASSESS_TRAJECTORY: 86400,   # 24 hours
}

DEFAULT_APPROVAL_TTL_SECONDS = 259200            # 3 days
OSCILLATION_THRESHOLD_COUNT = 3                   # Max reversal patterns before auto-adaptation suppression
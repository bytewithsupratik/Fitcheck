# apps/intelligence/tests/ade/test_stability_governance.py
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.ade.enums import ADEDecisionType
from src.ade.governance.policy import GovernancePolicy
from src.ade.stability.cooldown import cooldown_manager
from src.ade.stability.oscillation import oscillation_detector


def test_approval_policy_mandatory_decisions():
    """Verifies Section 8: Server-side mandatory approval."""
    assert GovernancePolicy.requires_approval(ADEDecisionType.CHANGE_TOPIC) is True
    assert GovernancePolicy.requires_approval(ADEDecisionType.CHANGE_CAREER_TARGET) is True
    assert GovernancePolicy.requires_approval(ADEDecisionType.PAUSE_LEARNING_PATH) is True
    # Autonomous by default
    assert GovernancePolicy.requires_approval(ADEDecisionType.ADJUST_DIFFICULTY) is False
    assert GovernancePolicy.requires_approval(ADEDecisionType.ADD_REMEDIATION) is False


def test_cooldown_suppression():
    cooldown_manager.clear()
    learner_id = "USR-COOL-1"
    assert not cooldown_manager.is_in_cooldown(learner_id, ADEDecisionType.ADJUST_DIFFICULTY)
    cooldown_manager.activate_cooldown(learner_id, ADEDecisionType.ADJUST_DIFFICULTY, duration_seconds=3600)
    assert cooldown_manager.is_in_cooldown(learner_id, ADEDecisionType.ADJUST_DIFFICULTY)


def test_oscillation_detection():
    oscillation_detector.clear()
    learner_id = "USR-OSC-1"
    # Sequence: INCREASE -> REDUCE -> INCREASE -> REDUCE -> INCREASE
    oscillation_detector.record_decision(learner_id, ADEDecisionType.INCREASE_LOAD)
    oscillation_detector.record_decision(learner_id, ADEDecisionType.REDUCE_LOAD)
    oscillation_detector.record_decision(learner_id, ADEDecisionType.INCREASE_LOAD)
    oscillation_detector.record_decision(learner_id, ADEDecisionType.REDUCE_LOAD)

    assert oscillation_detector.is_oscillating(learner_id, ADEDecisionType.INCREASE_LOAD) is True
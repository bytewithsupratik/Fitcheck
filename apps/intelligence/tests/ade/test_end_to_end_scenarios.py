# apps/intelligence/tests/ade/test_end_to_end_scenarios.py
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.ade.events.schemas import EventEnvelope
from src.ade.engine import ade_engine
from src.ade.enums import ADEDecisionType, DecisionStatus, ApprovalStatus
from src.ade.stability.cooldown import cooldown_manager
from src.ade.stability.oscillation import oscillation_detector
from src.ade.persistence.repository import ade_repository


@pytest.fixture(autouse=True)
def clean_state():
    cooldown_manager.clear()
    oscillation_detector.clear()
    ade_repository.clear()
    ade_engine.deduplicator.clear()
    yield


def test_scenario_1_normal_progress_adaptation():
    """Scenario 1: UPE improving -> ADJUST_DIFFICULTY autonomous dispatch."""
    event = EventEnvelope(
        event_id="EVT-S1",
        event_type="PROGRESS_EVALUATED",
        producer="UPE",
        learner_id="USR-S1",
        occurred_at="2026-09-20T10:00:00Z",
        correlation_id="CORR-S1",
        data={"overall_progress": 0.85, "trend": "IMPROVING"}
    )
    decision = ade_engine.process_event(event)
    assert decision.decision_type == ADEDecisionType.ADJUST_DIFFICULTY
    assert decision.status == DecisionStatus.COMPLETED
    assert decision.approval_status == ApprovalStatus.NOT_REQUIRED


def test_scenario_2_readiness_gap():
    """Scenario 2: RIE detects high-priority gap -> ADD_REMEDIATION autonomous dispatch."""
    event = EventEnvelope(
        event_id="EVT-S2",
        event_type="READINESS_EVALUATED",
        producer="RIE",
        learner_id="USR-S2",
        occurred_at="2026-09-20T10:00:00Z",
        correlation_id="CORR-S2",
        data={"overall_readiness": 0.45, "priority_gap_count": 2}
    )
    decision = ade_engine.process_event(event)
    assert decision.decision_type == ADEDecisionType.ADD_REMEDIATION
    assert decision.status == DecisionStatus.COMPLETED


def test_scenario_5_and_6_topic_change_approval_and_rejection():
    """Scenarios 5 & 6: CIE requirements change -> CHANGE_TOPIC requires approval, handles rejection."""
    event = EventEnvelope(
        event_id="EVT-S5",
        event_type="REQUIREMENTS_CHANGED",
        producer="CIE",
        learner_id="USR-S5",
        occurred_at="2026-09-20T10:00:00Z",
        correlation_id="CORR-S5",
        data={"requirements_changed": True}
    )
    decision = ade_engine.process_event(event)
    # Must be approval pending (Section 8)
    assert decision.decision_type == ADEDecisionType.CHANGE_TOPIC
    assert decision.status == DecisionStatus.APPROVAL_PENDING
    assert decision.approval_status == ApprovalStatus.PENDING

    # User Rejects -> Rejection suppression cooldown active (Scenario 6)
    rejected = ade_engine.reject_decision(decision.decision_id, reason="Learner wants to finish current topic first")
    assert rejected.status == DecisionStatus.REJECTED
    assert cooldown_manager.is_in_cooldown(decision.learner_id, ADEDecisionType.CHANGE_TOPIC)
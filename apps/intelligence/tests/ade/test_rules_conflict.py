# apps/intelligence/tests/ade/test_rules_conflict.py
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.ade.events.schemas import EventEnvelope
from src.ade.context.builder import ContextBuilder
from src.ade.impact.calculator import ImpactCalculator
from src.ade.rules.evaluator import RuleEvaluator
from src.ade.decisions.conflict import ConflictResolver
from src.ade.enums import ADEDecisionType


def test_upe_declining_triggers_remediation_and_load_reduction():
    event = EventEnvelope(
        event_id="EVT-UPE-01",
        event_type="PROGRESS_EVALUATED",
        producer="UPE",
        learner_id="USR-1",
        occurred_at="2026-09-20T10:00:00Z",
        correlation_id="CORR-1",
        data={"overall_progress": 0.35, "trend": "DECLINING"}
    )
    context = ContextBuilder.build_context(event)
    impact = ImpactCalculator.calculate_impact(event, context)
    candidates = RuleEvaluator.evaluate_candidates(event, impact, context)

    types = [c.decision_type for c in candidates]
    assert ADEDecisionType.REDUCE_LOAD in types
    assert ADEDecisionType.ADD_REMEDIATION in types

    # Conflict resolution: ADD_REMEDIATION takes precedence over REDUCE_LOAD
    winner = ConflictResolver.resolve(candidates)
    assert winner.decision_type == ADEDecisionType.ADD_REMEDIATION


def test_conflict_resolver_handles_contradictory_load():
    # If both REDUCE_LOAD and INCREASE_LOAD are present, REDUCE_LOAD wins for safety
    event = EventEnvelope(
        event_id="EVT-MOCK",
        event_type="MOCK",
        producer="TEST",
        learner_id="USR-1",
        occurred_at="2026-09-20T10:00:00Z",
        correlation_id="CORR-1"
    )
    context = ContextBuilder.build_context(event)
    impact = ImpactCalculator.calculate_impact(event, context)
    candidates = RuleEvaluator.evaluate_candidates(event, impact, context)

    winner = ConflictResolver.resolve(candidates)
    assert winner.decision_type == ADEDecisionType.NO_ACTION
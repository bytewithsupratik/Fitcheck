# apps/intelligence/tests/ade/test_contracts_signals.py
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from src.ade.events.schemas import EventEnvelope
from src.ade.signals.validator import SignalValidator, SignalValidationError
from src.ade.signals.deduplicator import SignalDeduplicator


def test_event_envelope_validation():
    valid = EventEnvelope(
        event_id="EVT-001",
        event_type="PROGRESS_EVALUATED",
        producer="UPE",
        learner_id="USR-1",
        occurred_at="2026-09-20T10:00:00Z",
        correlation_id="CORR-1",
        data={"overall_progress": 0.8}
    )
    validated = SignalValidator.validate_envelope(valid)
    assert validated.event_id == "EVT-001"


def test_event_envelope_rejects_missing_fields():
    invalid = EventEnvelope(
        event_id="",
        event_type="PROGRESS_EVALUATED",
        producer="UPE",
        learner_id="USR-1",
        occurred_at="2026-09-20T10:00:00Z",
        correlation_id="CORR-1"
    )
    with pytest.raises(SignalValidationError):
        SignalValidator.validate_envelope(invalid)


def test_signal_deduplicator():
    dedup = SignalDeduplicator()
    assert not dedup.is_duplicate("EVT-100")
    dedup.mark_processed("EVT-100")
    assert dedup.is_duplicate("EVT-100")
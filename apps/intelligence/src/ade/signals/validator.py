# apps/intelligence/src/ade/signals/validator.py
from src.ade.events.schemas import EventEnvelope


class SignalValidationError(Exception):
    pass


class SignalValidator:
    REQUIRED_FIELDS = ["event_id", "event_type", "producer", "learner_id", "occurred_at", "correlation_id"]

    @classmethod
    def validate_envelope(cls, envelope: EventEnvelope) -> EventEnvelope:
        for f in cls.REQUIRED_FIELDS:
            val = getattr(envelope, f, None)
            if not val or not str(val).strip():
                raise SignalValidationError(f"Invalid EventEnvelope: missing or empty required field '{f}'")
        return envelope
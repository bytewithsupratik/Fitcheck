# apps/intelligence/src/ade/events/schemas.py
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class EventEnvelope(BaseModel):
    """
    Universal Event Envelope across all CareerOS engines (Section 9).
    """
    event_id: str
    event_type: str
    schema_version: str = "1.0"
    producer: str
    learner_id: str
    occurred_at: str
    correlation_id: str
    causation_id: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
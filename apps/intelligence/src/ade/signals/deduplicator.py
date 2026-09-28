# apps/intelligence/src/ade/signals/deduplicator.py
from typing import Set


class SignalDeduplicator:
    """
    Idempotent signal processing: ensures each event_id is processed once (Section 13, 48).
    """
    def __init__(self):
        self._processed_event_ids: Set[str] = set()

    def is_duplicate(self, event_id: str) -> bool:
        return event_id in self._processed_event_ids

    def mark_processed(self, event_id: str):
        self._processed_event_ids.add(event_id)

    def clear(self):
        self._processed_event_ids.clear()
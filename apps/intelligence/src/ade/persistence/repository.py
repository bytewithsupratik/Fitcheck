# apps/intelligence/src/ade/persistence/repository.py
from typing import Dict, List, Optional
from src.ade.schemas import ADEDecisionRecord


class ADERepository:
    """
    In-memory / PostgreSQL adapter for ADE decisions, approvals, and executions (Section 27).
    Never overwrites historical decision records.
    """

    def __init__(self):
        self._decisions: Dict[str, ADEDecisionRecord] = {}
        self._learner_index: Dict[str, List[str]] = {}

    def save_decision(self, record: ADEDecisionRecord):
        self._decisions[record.decision_id] = record
        if record.learner_id not in self._learner_index:
            self._learner_index[record.learner_id] = []
        if record.decision_id not in self._learner_index[record.learner_id]:
            self._learner_index[record.learner_id].append(record.decision_id)

    def get_decision(self, decision_id: str) -> Optional[ADEDecisionRecord]:
        return self._decisions.get(decision_id)

    def get_learner_decisions(self, learner_id: str) -> List[ADEDecisionRecord]:
        d_ids = self._learner_index.get(learner_id, [])
        return [self._decisions[d_id] for d_id in d_ids if d_id in self._decisions]

    def get_active_decision(self, learner_id: str) -> Optional[ADEDecisionRecord]:
        history = self.get_learner_decisions(learner_id)
        active = [d for d in history if d.status not in ["COMPLETED", "FAILED", "REJECTED", "INVALIDATED", "CANCELLED"]]
        return active[-1] if active else None

    def clear(self):
        self._decisions.clear()
        self._learner_index.clear()


ade_repository = ADERepository()
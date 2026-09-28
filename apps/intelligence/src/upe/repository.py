# apps/intelligence/src/upe/repository.py
from typing import Dict, List, Optional
from src.upe.schemas import ProgressEvaluation


class UPERepository:
    """
    In-memory / CIG-backed repository caching evaluations with idempotency protection.
    """

    def __init__(self):
        # learner_id -> chronological list of ProgressEvaluation
        self._history_store: Dict[str, List[ProgressEvaluation]] = {}
        # idempotency_key -> evaluation_id
        self._idempotency_index: Dict[str, str] = {}
        # evaluation_id -> ProgressEvaluation
        self._eval_index: Dict[str, ProgressEvaluation] = {}

    def get_idempotent_evaluation(self, idempotency_key: str) -> Optional[ProgressEvaluation]:
        eval_id = self._idempotency_index.get(idempotency_key)
        if eval_id:
            return self._eval_index.get(eval_id)
        return None

    def save_evaluation(self, evaluation: ProgressEvaluation, idempotency_key: str = None):
        learner_id = evaluation.learner_id
        if learner_id not in self._history_store:
            self._history_store[learner_id] = []

        self._history_store[learner_id].append(evaluation)
        self._eval_index[evaluation.evaluation_id] = evaluation

        if idempotency_key:
            self._idempotency_index[idempotency_key] = evaluation.evaluation_id

    def get_current(self, learner_id: str) -> Optional[ProgressEvaluation]:
        history = self._history_store.get(learner_id)
        return history[-1] if history else None

    def get_history(self, learner_id: str) -> List[ProgressEvaluation]:
        return self._history_store.get(learner_id, [])

    def clear(self):
        self._history_store.clear()
        self._idempotency_index.clear()
        self._eval_index.clear()


# Global singleton repository instance
upe_repository = UPERepository()
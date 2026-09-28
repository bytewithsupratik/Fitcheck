# apps/intelligence/src/rie/repository.py
from typing import Dict, List, Optional
from src.rie.schemas import RIEOutput


class RIERepository:
    """
    In-memory / CIG-backed state adapter for RIE evaluations.
    Preserves historical reproducibility without creating a second disparate database.
    """

    def __init__(self):
        # learner_id -> List of historical RIE evaluations (latest is at the end)
        self._history_store: Dict[str, List[RIEOutput]] = {}

    def save_evaluation(self, output: RIEOutput):
        learner_id = output.learner_id
        if learner_id not in self._history_store:
            self._history_store[learner_id] = []
        self._history_store[learner_id].append(output)

    def get_current(self, learner_id: str) -> Optional[RIEOutput]:
        history = self._history_store.get(learner_id)
        if not history:
            return None
        return history[-1]  # Latest evaluation

    def get_history(self, learner_id: str) -> List[RIEOutput]:
        return self._history_store.get(learner_id, [])

    def clear(self):
        self._history_store.clear()


# Global singleton instance
rie_repository = RIERepository()
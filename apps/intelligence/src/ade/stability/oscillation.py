# apps/intelligence/src/ade/stability/oscillation.py
from typing import Dict, List
from src.ade.enums import ADEDecisionType
from src.ade.constants import OSCILLATION_THRESHOLD_COUNT


class OscillationDetector:
    """
    Detects repeated reversal patterns (e.g. INCREASE_LOAD <-> REDUCE_LOAD) (Section 21).
    Halts automatic adaptation when oscillations exceed configured thresholds.
    """
    REVERSAL_PAIRS = {
        ADEDecisionType.INCREASE_LOAD: ADEDecisionType.REDUCE_LOAD,
        ADEDecisionType.REDUCE_LOAD: ADEDecisionType.INCREASE_LOAD,
    }

    def __init__(self):
        # learner_id -> chronological list of recent decision types
        self._history: Dict[str, List[ADEDecisionType]] = {}

    def record_decision(self, learner_id: str, decision_type: ADEDecisionType):
        if learner_id not in self._history:
            self._history[learner_id] = []
        self._history[learner_id].append(decision_type)

    def is_oscillating(self, learner_id: str, proposed_type: ADEDecisionType) -> bool:
        history = self._history.get(learner_id, [])
        if len(history) < 2 or proposed_type not in self.REVERSAL_PAIRS:
            return False

        counter_type = self.REVERSAL_PAIRS[proposed_type]
        # Count reversals in the last 6 decisions
        recent = history[-6:]
        reversals = 0
        for i in range(len(recent) - 1):
            if (recent[i] == proposed_type and recent[i+1] == counter_type) or \
               (recent[i] == counter_type and recent[i+1] == proposed_type):
                reversals += 1

        return reversals >= OSCILLATION_THRESHOLD_COUNT

    def clear(self):
        self._history.clear()


oscillation_detector = OscillationDetector()
# apps/intelligence/src/ade/stability/cooldown.py
from datetime import datetime, timezone
from typing import Dict
from src.ade.enums import ADEDecisionType
from src.ade.constants import DEFAULT_COOLDOWNS


class CooldownManager:
    """
    Prevents repeated identical adaptations within configured cooldown windows (Section 20).
    Key: learner_id:decision_type:scope_key
    """
    def __init__(self):
        # key -> expiration timestamp iso
        self._cooldown_index: Dict[str, str] = {}

    def is_in_cooldown(self, learner_id: str, decision_type: ADEDecisionType, scope_key: str = "DEFAULT") -> bool:
        key = f"{learner_id}:{decision_type.value}:{scope_key}"
        exp_iso = self._cooldown_index.get(key)
        if not exp_iso:
            return False

        now = datetime.now(timezone.utc)
        exp_dt = datetime.fromisoformat(exp_iso)
        return now < exp_dt

    def activate_cooldown(self, learner_id: str, decision_type: ADEDecisionType, scope_key: str = "DEFAULT", duration_seconds: int = None):
        seconds = duration_seconds or DEFAULT_COOLDOWNS.get(decision_type, 86400)
        now_ts = datetime.now(timezone.utc).timestamp()
        exp_dt = datetime.fromtimestamp(now_ts + seconds, tz=timezone.utc)
        key = f"{learner_id}:{decision_type.value}:{scope_key}"
        self._cooldown_index[key] = exp_dt.isoformat()

    def clear(self):
        self._cooldown_index.clear()


cooldown_manager = CooldownManager()
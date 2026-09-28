# apps/intelligence/src/ade/llm/synthesizer.py
import os
from typing import Optional, Dict
from dotenv import load_dotenv
from src.ade.schemas import ADEDecisionRecord

load_dotenv()


class ADELLMSynthesizer:
    """
    Subordinate LLM Explanation Layer (Sections 38, 39).
    Never calculates decisions or changes numbers. Strictly produces qualitative explanations.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key if api_key is not None else (os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY"))

    def explain_decision(self, decision: ADEDecisionRecord) -> Dict[str, str]:
        # Guaranteed deterministic fallback (Section 39)
        return {
            "summary": f"System adaptation determined: {decision.decision_type.value}.",
            "reason": f"Triggered due to {', '.join(decision.reason_codes) if decision.reason_codes else 'standard progression'}.",
            "impact": f"Classified as {decision.impact_level.value} impact on your learning path.",
            "next_step": "Waiting for user confirmation" if decision.approval_status.value == "PENDING" else "Dispatched for execution"
        }
# apps/intelligence/tests/rie/test_frozen_contract.py
import sys
from pathlib import Path

# Add apps/intelligence to python search path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.rie.repository import rie_repository

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_repository():
    rie_repository.clear()
    yield
    rie_repository.clear()


def test_frozen_rie_external_contract_lifecycle():
    """
    Tests the complete frozen contract:
    1. POST /evaluate -> Computes & stores evaluation
    2. GET /{learner}/current -> Retrieves latest evaluation
    3. POST /evaluate (2nd run) -> Appends to history
    4. GET /{learner}/history -> Returns chronological list of evaluations
    5. POST /handoff/mie -> Formats mission gaps for MIE
    """
    learner_id = "USR_CONTRACT_01"

    eval_payload = {
        "learner_state": {
            "learner_id": learner_id,
            "state_version": "CIG_STATE_010",
            "goal_id": "GOAL_AI_01",
            "active_target_id": "CAREER-AI-ENGINEER",
            "capabilities": [
                {
                    "capability_id": "CAP-PYTHON",
                    "proficiency": "DEVELOPING",
                    "mastery": "PARTIALLY_DEMONSTRATED",
                    "confidence": 0.80,
                    "evidence_strength": "MODERATE"
                }
            ],
            "consistency": 0.70
        },
        "cie_requirements": {
            "cie_evaluation_id": "CIE_01",
            "cie_version": "CIE-1.0",
            "target_id": "CAREER-AI-ENGINEER",
            "capability_requirements": [
                {
                    "capability_id": "CAP-PYTHON",
                    "importance": "CORE",
                    "expected_proficiency": "PROFICIENT",
                    "requirement_type": "TECHNICAL"
                }
            ]
        }
    }

    # 1. POST /readiness/evaluate
    eval_res = client.post("/api/v1/readiness/evaluate", json=eval_payload)
    assert eval_res.status_code == 200
    first_output = eval_res.json()
    assert first_output["learner_id"] == learner_id

    # 2. GET /readiness/{learner}/current
    current_res = client.get(f"/api/v1/readiness/{learner_id}/current")
    assert current_res.status_code == 200
    assert current_res.json()["rie_evaluation_id"] == first_output["rie_evaluation_id"]

    # 3. POST /readiness/evaluate (Second evaluation with higher proficiency)
    eval_payload["learner_state"]["capabilities"][0]["proficiency"] = "PROFICIENT"
    eval_payload["learner_state"]["state_version"] = "CIG_STATE_011"
    eval_payload["previous_evaluation"] = {"readiness": {"overall": first_output["readiness"]["overall"]}}

    eval_res_2 = client.post("/api/v1/readiness/evaluate", json=eval_payload)
    assert eval_res_2.status_code == 200
    second_output = eval_res_2.json()

    # 4. GET /readiness/{learner}/current (Must return 2nd output)
    current_res_2 = client.get(f"/api/v1/readiness/{learner_id}/current")
    assert current_res_2.status_code == 200
    assert current_res_2.json()["rie_evaluation_id"] == second_output["rie_evaluation_id"]

    # 5. GET /readiness/{learner}/history (Must return both in order)
    history_res = client.get(f"/api/v1/readiness/{learner_id}/history")
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) == 2
    assert history[0]["rie_evaluation_id"] == first_output["rie_evaluation_id"]
    assert history[1]["rie_evaluation_id"] == second_output["rie_evaluation_id"]

    # 6. POST /readiness/handoff/mie
    mie_res = client.post("/api/v1/readiness/handoff/mie", json=eval_payload)
    assert mie_res.status_code == 200
    mie_data = mie_res.json()
    assert mie_data["learner_id"] == learner_id
# apps/intelligence/tests/mie/test_api.py
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_mie_api_lifecycle():
    """
    Verifies Section 44: Complete REST API Lifecycle:
    1. POST /learning-experiences -> Generates Experience
    2. GET /learning-experiences/{id} -> Retrieves Experience
    3. GET /learning-experiences/{id}/project -> Retrieves Project
    4. POST /projects/{id}/submission -> Submits GitHub URL
    5. POST /assessments/{id}/submit -> Submits Answers & Scores
    """
    payload = {
        "learner_context": {
            "learner_id": "USR-MIE-API-01",
            "goal_id": "GOAL-AI-01",
            "target_id": "CAREER-AI-ENGINEER",
            "current_state_version": "CIG-STATE-100"
        },
        "cie_requirements": {
            "cie_version": "1.0",
            "capability_requirements": [
                {
                    "capability_id": "CAP-PYTHON",
                    "importance": "CORE",
                    "expected_proficiency": "PROFICIENT",
                    "requirement_type": "TECHNICAL"
                }
            ],
            "learning_requirements": [],
            "experience_requirements": [],
            "evidence_expectations": []
        },
        "rie_handoff": {
            "readiness_evaluation_id": "RIE-EVAL-55",
            "source_state_version": "CIG-STATE-100",
            "priority_gaps": [
                {
                    "capability_id": "CAP-PYTHON",
                    "target_proficiency": "PROFICIENT",
                    "current_proficiency": "DEVELOPING",
                    "gap_units": 1,
                    "normalized_gap": 0.33,
                    "urgency_priority": 0.35,
                    "importance_tier": "CORE",
                    "recommended_focus": "POLISH_AND_VERIFY"
                }
            ]
        }
    }

    # 1. Generate Experience
    gen_res = client.post("/api/v1/learning-experiences", json=payload)
    assert gen_res.status_code == 201
    exp_data = gen_res.json()
    exp_id = exp_data["experience_id"]
    proj_id = exp_data["coding_project"]["project_id"]
    asm_id = exp_data["assessment"]["assessment_id"]

    # 2. Get Experience
    get_res = client.get(f"/api/v1/learning-experiences/{exp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["experience_id"] == exp_id

    # 3. Get Project
    proj_res = client.get(f"/api/v1/learning-experiences/{exp_id}/project")
    assert proj_res.status_code == 200
    assert proj_res.json()["project_id"] == proj_id

    # 4. Submit Project
    sub_res = client.post(
        f"/api/v1/projects/{proj_id}/submission",
        json={"github_url": "https://github.com/learner/ai-service"}
    )
    assert sub_res.status_code == 200
    assert sub_res.json()["event"]["event_type"] == "PROJECT_SUBMITTED"

    # 5. Submit Assessment Answers
    asm_res = client.post(
        f"/api/v1/assessments/{asm_id}/submit",
        json={"learner_answers": {"Q-01-MCQ": "opt-a"}}
    )
    assert asm_res.status_code == 200
    assert asm_res.json()["score"]["earned"] >= 0
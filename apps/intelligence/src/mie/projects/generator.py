import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from src.mie.schemas import (
    CodingProject,
    FunctionalRequirement,
    ProjectMilestone,
    EvaluationCriterion,
    ExpectedEvidenceSpec,
    GitHubSubmissionSpec,
)
from src.mie.constants import DIFFICULTY_RANKS, RANK_TO_PROFICIENCY
from src.cie.schemas import CapabilityRequirement, LearningRequirement, ExperienceRequirement
from src.evidence.schemas import ProficiencyLevel, EvidenceStrengthLevel
from src.mie.llm.synthesizer import MIESynthesizer


class ProjectGenerator:
    PROJECT_TEMPLATES = {
        "JAVA": {
            "title": "Spring Boot Enterprise REST API & Microservices",
            "scenario": (
                "Design and deploy an enterprise-grade backend service using Java and Spring Boot. "
                "Implement REST endpoints, Hibernate JPA persistence, validation, and automated unit testing."
            ),
            "milestones": [
                ("M1", "Spring Boot Architecture & Scaffolding", ["Configure Maven/Gradle dependencies", "Configure Spring application properties and base package"]),
                ("M2", "Entity Modeling & JPA Persistence", ["Define relational entities with annotations", "Implement Spring Data JPA repositories"]),
                ("M3", "REST Controllers & Service Layer", ["Implement REST controllers, exception handlers, and request DTO validations"]),
                ("M4", "Integration Testing & Documentation", ["Write JUnit/Mockito tests verifying endpoints and document API in README.md"]),
            ],
            "constraints": [
                "Use Java 17+ and Spring Boot 3+",
                "Enforce multi-tier architecture: Controller -> Service -> Repository",
                "Implement validation on incoming request bodies",
                "Include JUnit test suite verifying controllers and business logic",
            ],
        },
        "RUST": {
            "title": "High-Throughput Async REST Service in Rust",
            "scenario": (
                "Build a high-performance, memory-safe backend service in Rust using Tokio and Axum. "
                "Enforce strict ownership semantics, async request routing, and error handling."
            ),
            "milestones": [
                ("M1", "Cargo Workspace & Scaffolding", ["Setup Cargo.toml dependencies with Tokio, Axum, and Serde", "Create module hierarchy"]),
                ("M2", "Async Route Handlers & State", ["Implement async routing with Axum", "Configure shared thread-safe application state"]),
                ("M3", "Error Handling & Serialization", ["Implement custom Error enum with IntoResponse", "Configure Serde JSON serialization"]),
                ("M4", "Cargo Test Verification & Documentation", ["Write integration tests verifying status codes and document in README.md"]),
            ],
            "constraints": [
                "Use modern stable Rust syntax",
                "Zero unsafe code blocks",
                "Use Tokio async runtime and Axum routing",
                "Provide automated unit and integration tests via `cargo test`",
            ],
        },
        "DEVOPS": {
            "title": "Automated Docker & Kubernetes Deployment Pipeline",
            "scenario": (
                "Containerize a production web service with multi-stage Dockerfiles, "
                "write Kubernetes manifests (Deployment, Service, Ingress), and configure a CI/CD workflow."
            ),
            "milestones": [
                ("M1", "Multi-Stage Dockerfile", ["Create minimal production Dockerfile separating build dependencies from runtime"]),
                ("M2", "Kubernetes Deployment & Service", ["Author deployment.yaml and service.yaml with health probes"]),
                ("M3", "Ingress & ConfigMaps", ["Configure external ingress routing and environment ConfigMaps"]),
                ("M4", "CI/CD Pipeline & Documentation", ["Author GitHub Actions workflow validating container builds and test in README.md"]),
            ],
            "constraints": [
                "Enforce non-root execution inside container images",
                "Define liveness and readiness probes in Kubernetes manifests",
                "Include complete deployment and teardown instructions in README.md",
            ],
        },
        "CSS": {
            "title": "Responsive Design System & Modern CSS Layout Framework",
            "scenario": (
                "Build an accessible web layout system demonstrating advanced CSS Grid, "
                "Flexbox composition, fluid typography, and responsive media-query breakpoints."
            ),
            "milestones": [
                ("M1", "Design Tokens & Reset", ["Establish CSS custom properties, variables, and typography scale"]),
                ("M2", "Flexbox Navigation & Components", ["Build mobile-first navigation, card components, and button states"]),
                ("M3", "CSS Grid Layout System", ["Implement multi-track responsive page grids with auto-fit and template areas"]),
                ("M4", "Responsive Breakpoints & Documentation", ["Verify viewports from mobile to desktop; document styles in README"]),
            ],
            "constraints": [
                "Write clean, modern CSS without third-party frameworks",
                "Ensure responsive layout across mobile (<640px), tablet, and desktop viewports",
                "Use CSS Grid for 2D layouts and Flexbox for 1D layouts",
                "Include a visual demonstration page (index.html) and documentation",
            ],
        },
        "PYTHON": {
            "title": "FastAPI Production REST API & Persistence Engine",
            "scenario": (
                "Build a high-performance asynchronous API using Python and FastAPI. "
                "Implement Pydantic validation, database integration, and automated pytest suites."
            ),
            "milestones": [
                ("M1", "FastAPI App & Architecture", ["Setup virtual environment, poetry/pip requirements, and base router"]),
                ("M2", "Pydantic Schemas & Routes", ["Author request/response models and route handlers with dependency injection"]),
                ("M3", "Database Persistence & Migrations", ["Connect SQLAlchemy/AsyncPG models with transactional boundaries"]),
                ("M4", "Automated Pytest Suite & Docs", ["Write async tests verifying endpoints and status codes; document in README"]),
            ],
            "constraints": [
                "Use Python 3.11+ and FastAPI",
                "Enforce Pydantic validation on all endpoints",
                "Include test coverage via pytest and httpx",
                "Include README documentation with setup and run instructions",
            ],
        },
    }

    @classmethod
    def generate_project(
        cls,
        learner_id: str,
        target_id: str,
        capability_requirements: List[CapabilityRequirement],
        learning_requirements: List[LearningRequirement],
        experience_requirement: Optional[ExperienceRequirement],
        learner_current_ranks: Dict[str, int],
        highest_priority_caps: List[str],
    ) -> CodingProject:
        project_id = f"PROJ-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        target_caps = (
            highest_priority_caps
            if highest_priority_caps
            else [cr.capability_id for cr in capability_requirements]
        )

        current_ranks = [learner_current_ranks.get(c, 1) for c in target_caps]
        avg_current = sum(current_ranks) / max(1, len(current_ranks))
        project_rank = min(4, max(1, int(avg_current + 1)))
        difficulty = RANK_TO_PROFICIENCY[project_rank]

        clean_target = (
            target_id.replace("CAREER-", "")
            .replace("DOMAIN-", "")
            .replace("TOPIC-", "")
            .upper()
        )

        template = None
        for key, val in cls.PROJECT_TEMPLATES.items():
            if key in clean_target or any(key in c for c in target_caps):
                template = val
                break

        functional_reqs = []
        for idx, cap_id in enumerate(target_caps, start=1):
            name = cap_id.replace("CAP-", "").replace("-", " ").title()
            functional_reqs.append(
                FunctionalRequirement(
                    id=f"REQ-{idx:03d}",
                    description=f"Implement core logic, architecture, and verification for {name}",
                    capability_ids=[cap_id],
                )
            )

        lr_map = {lr.capability_id: lr for lr in learning_requirements}
        objectives = [
            lr_map[c].expected_outcome for c in target_caps if c in lr_map
        ] or [f"Implement and demonstrate proficiency in {c}" for c in target_caps]

        if template:
            base_title = template["title"]
            base_description = template["scenario"]
            constraints = template["constraints"]
            milestones = [
                ProjectMilestone(
                    milestone_id=m_id,
                    title=m_title,
                    tasks=m_tasks,
                )
                for m_id, m_title, m_tasks in template["milestones"]
            ]
        else:
            first_name = target_caps[0].replace("CAP-", "").replace("-", " ").title()
            target_title = clean_target.replace("_", " ").title()
            base_title = f"{target_title} Engineering Implementation Project"
            base_description = (
                f"Hands-on engineering project designed to master {first_name} and bridge priority gaps in "
                f"{', '.join(target_caps)}. Execute locally and push evidence to GitHub."
            )
            constraints = [
                "Adhere to production coding standards and clean code architecture",
                "Organize code into clear modular directories (e.g. src/, tests/)",
                "Provide automated unit or integration tests verifying core logic",
                "Include complete setup and verification instructions in README.md",
            ]
            milestones = [
                ProjectMilestone(
                    milestone_id="M1",
                    title="Project Scaffolding & Setup",
                    tasks=["Initialize project workspace", "Configure dependencies and base files"],
                ),
                ProjectMilestone(
                    milestone_id="M2",
                    title="Core Logic Implementation",
                    tasks=[f"Implement functional logic for {c.replace('CAP-', '')}" for c in target_caps],
                ),
                ProjectMilestone(
                    milestone_id="M3",
                    title="Verification & Test Assertions",
                    tasks=["Write unit and integration tests", "Verify edge case handling"],
                ),
                ProjectMilestone(
                    milestone_id="M4",
                    title="Documentation & Submission Ready",
                    tasks=["Document project setup in README.md", "Prepare clean Git commit history"],
                ),
            ]

        expected_outcomes = [
            "Complete working codebase meeting functional requirements",
            "Passing automated test suite or verification artifacts",
            "Detailed README with setup, architecture, and usage guides",
            "Public Git commit history showing iterative engineering progress",
        ]

        evaluation_criteria = []
        for idx, cap_id in enumerate(target_caps, start=1):
            name = cap_id.replace("CAP-", "").title()
            evaluation_criteria.append(
                EvaluationCriterion(
                    criterion_id=f"EC-{idx:03d}",
                    capability_id=cap_id,
                    description=f"Evidence verifies robust implementation and correct architecture of {name}",
                )
            )

        synthesizer = MIESynthesizer()
        enrichment = synthesizer.enrich_project(
            target_id=target_id,
            capability_ids=target_caps,
            difficulty=difficulty,
            functional_requirements=[r.model_dump() for r in functional_reqs],
            fallback_title=base_title,
            fallback_description=base_description,
            fallback_milestones=milestones,
        )

        final_title = enrichment.get("title", base_title)
        final_description = enrichment.get("scenario_description", base_description)

        enriched_milestones_map = {
            m["milestone_id"]: m
            for m in enrichment.get("enriched_milestones", [])
            if isinstance(m, dict) and "milestone_id" in m
        }
        for m in milestones:
            if m.milestone_id in enriched_milestones_map:
                e_data = enriched_milestones_map[m.milestone_id]
                m.title = e_data.get("title", m.title)
                m.tasks = e_data.get("tasks", m.tasks)

        return CodingProject(
            project_id=project_id,
            learner_id=learner_id,
            title=final_title,
            description=final_description,
            target_id=target_id,
            capability_ids=target_caps,
            learning_requirement_ids=[
                lr.requirement_id
                for lr in learning_requirements
                if lr.capability_id in target_caps
            ],
            experience_requirement_id=(
                experience_requirement.requirement_id
                if experience_requirement
                else None
            ),
            difficulty=difficulty,
            estimated_duration_minutes=120 if project_rank <= 2 else 240,
            prerequisites=[c for c in target_caps if learner_current_ranks.get(c, 0) > 0],
            learning_objectives=objectives,
            functional_requirements=functional_reqs,
            technical_constraints=constraints,
            milestones=milestones,
            expected_outcomes=expected_outcomes,
            evaluation_criteria=evaluation_criteria,
            expected_evidence=[
                ExpectedEvidenceSpec(
                    evidence_type="GITHUB_REPOSITORY",
                    minimum_strength=EvidenceStrengthLevel.STRONG,
                    required=True,
                )
            ],
            github_submission=GitHubSubmissionSpec(),
            version=1,
            created_at=now_iso,
            updated_at=now_iso,
        )
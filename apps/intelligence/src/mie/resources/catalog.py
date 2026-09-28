# apps/intelligence/src/mie/resources/catalog.py
from datetime import datetime, timezone
from src.mie.schemas import Resource
from src.mie.enums import ResourceType, ResourceValidationStatus
from src.evidence.schemas import ProficiencyLevel

now_iso = datetime.now(timezone.utc).isoformat()

CURATED_RESOURCES = [
    Resource(
        resource_id="RES-PY-001",
        type=ResourceType.DOCUMENTATION,
        title="Python Official Tutorial & Data Structures",
        description="Official Python documentation covering core control flow, data structures, and standard library.",
        url="https://docs.python.org/3/tutorial/",
        source="Python Software Foundation",
        capability_ids=["CAP-PYTHON"],
        learning_requirement_ids=["LR-AI-01", "LR-PY-001"],
        topics=["python", "data structures", "syntax"],
        difficulty=ProficiencyLevel.FOUNDATIONAL,
        estimated_duration_minutes=45,
        prerequisites=[],
        quality_score=0.98,
        relevance_score=0.95,
        validation_status=ResourceValidationStatus.VALID,
        created_at=now_iso,
        updated_at=now_iso
    ),
    Resource(
        resource_id="RES-REST-001",
        type=ResourceType.DOCUMENTATION,
        title="Express.js Routing and Middleware Guide",
        description="Core guide to creating modular route handlers and middleware pipelines in Express.",
        url="https://expressjs.com/en/guide/routing.html",
        source="Express",
        capability_ids=["CAP-REST-API", "CAP-EXPRESS"],
        learning_requirement_ids=["LR-REST-001", "LR-FS-02"],
        topics=["rest", "routing", "http", "express"],
        difficulty=ProficiencyLevel.DEVELOPING,
        estimated_duration_minutes=35,
        prerequisites=["CAP-JAVASCRIPT"],
        quality_score=0.96,
        relevance_score=0.92,
        validation_status=ResourceValidationStatus.VALID,
        created_at=now_iso,
        updated_at=now_iso
    ),
    Resource(
        resource_id="RES-OPENAI-001",
        type=ResourceType.ARTICLE,
        title="Building LLM Agent Workflows with Tool Calling",
        description="Architectural breakdown of multi-turn function calling and agentic orchestration.",
        url="https://platform.openai.com/docs/guides/function-calling",
        source="OpenAI Platform",
        capability_ids=["CAP-OPENAI"],
        learning_requirement_ids=["LR-AI-02"],
        topics=["agents", "function calling", "tools", "llm"],
        difficulty=ProficiencyLevel.PROFICIENT,
        estimated_duration_minutes=40,
        prerequisites=["CAP-PYTHON"],
        quality_score=0.95,
        relevance_score=0.94,
        validation_status=ResourceValidationStatus.VALID,
        created_at=now_iso,
        updated_at=now_iso
    ),
    Resource(
        resource_id="RES-DOCKER-001",
        type=ResourceType.TUTORIAL,
        title="Containerizing Production Node and Python Services",
        description="Practical tutorial on creating multi-stage Dockerfiles and container optimization.",
        url="https://docs.docker.com/get-started/",
        source="Docker Docs",
        capability_ids=["CAP-DOCKER"],
        learning_requirement_ids=["LR-AI-03"],
        topics=["docker", "containers", "deployment"],
        difficulty=ProficiencyLevel.DEVELOPING,
        estimated_duration_minutes=30,
        prerequisites=[],
        quality_score=0.94,
        relevance_score=0.90,
        validation_status=ResourceValidationStatus.VALID,
        created_at=now_iso,
        updated_at=now_iso
    ),
    Resource(
        resource_id="RES-TS-001",
        type=ResourceType.DOCUMENTATION,
        title="TypeScript Handbook: Core & Advanced Types",
        description="Official TypeScript documentation explaining interfaces, generics, and union types.",
        url="https://www.typescriptlang.org/docs/handbook/intro.html",
        source="Microsoft TypeScript",
        capability_ids=["CAP-TYPESCRIPT"],
        learning_requirement_ids=["LR-FS-01"],
        topics=["typescript", "types", "interfaces"],
        difficulty=ProficiencyLevel.DEVELOPING,
        estimated_duration_minutes=40,
        prerequisites=[],
        quality_score=0.97,
        relevance_score=0.95,
        validation_status=ResourceValidationStatus.VALID,
        created_at=now_iso,
        updated_at=now_iso
    )
]
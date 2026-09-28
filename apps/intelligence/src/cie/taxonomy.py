import re
from typing import Dict, List, Optional
from src.cie.schemas import (
    Target,
    TargetType,
    TargetProfile,
    CapabilityRequirement,
    LearningRequirement,
    ExperienceRequirement,
    EvidenceExpectation,
    RequirementImportance,
    RequirementType,
    RequirementPriority,
    RequirementSpecificity,
    ProficiencyLevel,
    EvidenceStrengthLevel,
)

class TaxonomyError(Exception):
    pass

class TargetNotFoundError(TaxonomyError):
    pass

DEFAULT_TARGET_PROFILES: List[TargetProfile] = [
    TargetProfile(
        target=Target(
            target_id="CAREER-AI-ENGINEER",
            target_type=TargetType.CAREER,
            name="AI Engineer",
            taxonomy_version="TAX_001",
        ),
        description="Designs, builds, and deploys intelligent software systems, machine learning models, and LLM-powered applications.",
        capability_requirements=[
            CapabilityRequirement(
                capability_id="CAP-PYTHON",
                importance=RequirementImportance.CORE,
                expected_proficiency=ProficiencyLevel.PROFICIENT,
                requirement_type=RequirementType.TECHNICAL,
            ),
            CapabilityRequirement(
                capability_id="CAP-OPENAI",
                importance=RequirementImportance.CORE,
                expected_proficiency=ProficiencyLevel.PROFICIENT,
                requirement_type=RequirementType.TOOL,
            ),
            CapabilityRequirement(
                capability_id="CAP-POSTGRESQL",
                importance=RequirementImportance.IMPORTANT,
                expected_proficiency=ProficiencyLevel.DEVELOPING,
                requirement_type=RequirementType.TECHNICAL,
            ),
            CapabilityRequirement(
                capability_id="CAP-DOCKER",
                importance=RequirementImportance.IMPORTANT,
                expected_proficiency=ProficiencyLevel.DEVELOPING,
                requirement_type=RequirementType.TOOL,
            ),
            CapabilityRequirement(
                capability_id="CAP-TESTING",
                importance=RequirementImportance.SUPPORTING,
                expected_proficiency=ProficiencyLevel.DEVELOPING,
                requirement_type=RequirementType.TECHNICAL,
            ),
        ],
        learning_requirements=[
            LearningRequirement(
                requirement_id="LR-AI-01",
                capability_id="CAP-PYTHON",
                topic="Advanced Python & Data Structures",
                priority=RequirementPriority.HIGH,
                prerequisite_ids=[],
                expected_outcome="Write production-grade, asynchronous, and object-oriented Python code.",
            ),
            LearningRequirement(
                requirement_id="LR-AI-02",
                capability_id="CAP-OPENAI",
                topic="LLM Orchestration, Prompt Engineering & Agents",
                priority=RequirementPriority.HIGH,
                prerequisite_ids=["LR-AI-01"],
                expected_outcome="Build multi-step agentic workflows and tool-calling systems using LLM APIs.",
            ),
            LearningRequirement(
                requirement_id="LR-AI-03",
                capability_id="CAP-DOCKER",
                topic="Containerization & Model Serving",
                priority=RequirementPriority.MEDIUM,
                prerequisite_ids=["LR-AI-01"],
                expected_outcome="Package AI services into Docker containers ready for cloud deployment.",
            ),
        ],
        experience_requirements=[
            ExperienceRequirement(
                requirement_id="ER-AI-01",
                category="PROJECT",
                description="Build and deploy an agentic AI application with persistent storage and external tool integration.",
                specificity=RequirementSpecificity.TARGET_SPECIFIC,
                capability_ids=["CAP-PYTHON", "CAP-OPENAI"],
            )
        ],
        evidence_expectations=[
            EvidenceExpectation(
                expectation_id="EE-AI-01",
                requirement_id="ER-AI-01",
                evidence_type="GITHUB_PROJECT",
                minimum_strength=EvidenceStrengthLevel.STRONG,
            )
        ],
        progression_paths=["Senior AI Engineer", "Staff AI Architect", "Head of AI Systems"],
        version="1.0",
    ),
    TargetProfile(
        target=Target(
            target_id="CAREER-FULLSTACK-DEV",
            target_type=TargetType.CAREER,
            name="Full Stack Developer",
            taxonomy_version="TAX_001",
        ),
        description="Develops complete end-to-end web applications covering responsive frontend interfaces, server-side APIs, and databases.",
        capability_requirements=[
            CapabilityRequirement(
                capability_id="CAP-TYPESCRIPT",
                importance=RequirementImportance.CORE,
                expected_proficiency=ProficiencyLevel.PROFICIENT,
                requirement_type=RequirementType.TECHNICAL,
            ),
            CapabilityRequirement(
                capability_id="CAP-REACT",
                importance=RequirementImportance.CORE,
                expected_proficiency=ProficiencyLevel.PROFICIENT,
                requirement_type=RequirementType.TECHNICAL,
            ),
            CapabilityRequirement(
                capability_id="CAP-NEXTJS",
                importance=RequirementImportance.CORE,
                expected_proficiency=ProficiencyLevel.PROFICIENT,
                requirement_type=RequirementType.TECHNICAL,
            ),
            CapabilityRequirement(
                capability_id="CAP-TAILWINDCSS",
                importance=RequirementImportance.IMPORTANT,
                expected_proficiency=ProficiencyLevel.DEVELOPING,
                requirement_type=RequirementType.TECHNICAL,
            ),
            CapabilityRequirement(
                capability_id="CAP-POSTGRESQL",
                importance=RequirementImportance.IMPORTANT,
                expected_proficiency=ProficiencyLevel.DEVELOPING,
                requirement_type=RequirementType.TECHNICAL,
            ),
            CapabilityRequirement(
                capability_id="CAP-TESTING",
                importance=RequirementImportance.SUPPORTING,
                expected_proficiency=ProficiencyLevel.DEVELOPING,
                requirement_type=RequirementType.TECHNICAL,
            ),
        ],
        learning_requirements=[
            LearningRequirement(
                requirement_id="LR-FS-01",
                capability_id="CAP-TYPESCRIPT",
                topic="Modern TypeScript & Type Systems",
                priority=RequirementPriority.HIGH,
                prerequisite_ids=[],
                expected_outcome="Implement type-safe architectures across client and server boundaries.",
            ),
            LearningRequirement(
                requirement_id="LR-FS-02",
                capability_id="CAP-NEXTJS",
                topic="Next.js App Router, Server Actions & Data Fetching",
                priority=RequirementPriority.HIGH,
                prerequisite_ids=["LR-FS-01"],
                expected_outcome="Build production fullstack web applications with server-side rendering and database mutations.",
            ),
        ],
        experience_requirements=[
            ExperienceRequirement(
                requirement_id="ER-FS-01",
                category="PROJECT",
                description="Architect and deploy a complete web application with authentication, database persistence, and responsive UI.",
                specificity=RequirementSpecificity.TARGET_SPECIFIC,
                capability_ids=["CAP-NEXTJS", "CAP-POSTGRESQL", "CAP-TAILWINDCSS"],
            )
        ],
        evidence_expectations=[
            EvidenceExpectation(
                expectation_id="EE-FS-01",
                requirement_id="ER-FS-01",
                evidence_type="GITHUB_PROJECT",
                minimum_strength=EvidenceStrengthLevel.STRONG,
            )
        ],
        progression_paths=["Senior Full Stack Engineer", "Engineering Lead", "Principal Software Architect"],
        version="1.0",
    ),
    TargetProfile(
        target=Target(
            target_id="DOMAIN-WEB-DEVELOPMENT",
            target_type=TargetType.DOMAIN,
            name="Web Development",
            taxonomy_version="TAX_001",
        ),
        description="Broad industry domain encompassing frontend user interfaces, backend APIs, protocols, and modern web architectures.",
        capability_requirements=[
            CapabilityRequirement(
                capability_id="CAP-JAVASCRIPT",
                importance=RequirementImportance.CORE,
                expected_proficiency=ProficiencyLevel.PROFICIENT,
                requirement_type=RequirementType.TECHNICAL,
            ),
            CapabilityRequirement(
                capability_id="CAP-CSS",
                importance=RequirementImportance.IMPORTANT,
                expected_proficiency=ProficiencyLevel.DEVELOPING,
                requirement_type=RequirementType.TECHNICAL,
            ),
            CapabilityRequirement(
                capability_id="CAP-REST-API",
                importance=RequirementImportance.IMPORTANT,
                expected_proficiency=ProficiencyLevel.DEVELOPING,
                requirement_type=RequirementType.TECHNICAL,
            ),
        ],
        learning_requirements=[
            LearningRequirement(
                requirement_id="LR-WEB-01",
                capability_id="CAP-JAVASCRIPT",
                topic="Web Standards, DOM & Asynchronous Programming",
                priority=RequirementPriority.HIGH,
                prerequisite_ids=[],
                expected_outcome="Understand the browser execution model, event loops, and modern web APIs.",
            )
        ],
        experience_requirements=[
            ExperienceRequirement(
                requirement_id="ER-WEB-01",
                category="PROJECT",
                description="Build interactive web projects adhering to semantic standards and responsive layouts.",
                specificity=RequirementSpecificity.GENERIC,
                capability_ids=["CAP-JAVASCRIPT", "CAP-CSS"],
            )
        ],
        evidence_expectations=[
            EvidenceExpectation(
                expectation_id="EE-WEB-01",
                requirement_id="ER-WEB-01",
                evidence_type="GITHUB_PROJECT",
                minimum_strength=EvidenceStrengthLevel.MODERATE,
            )
        ],
        progression_paths=["Frontend Specialization", "Backend Specialization", "Full Stack Specialization"],
        version="1.0",
    ),
]


class DynamicTaxonomySynthesizer:
    KNOWN_SPECS = {
        "JAVA": {
            "name": "Java Software Engineer",
            "description": "Enterprise backend architecture using Java, Spring Boot, Hibernate ORM, and relational databases.",
            "capabilities": [
                ("CAP-JAVA-CORE", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-SPRING-BOOT", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-HIBERNATE", "IMPORTANT", ProficiencyLevel.DEVELOPING),
                ("CAP-POSTGRESQL", "IMPORTANT", ProficiencyLevel.DEVELOPING),
                ("CAP-REST-API", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-TESTING", "SUPPORTING", ProficiencyLevel.DEVELOPING),
            ],
            "learning": [
                ("LR-JAVA-01", "CAP-JAVA-CORE", "Java OOP, Streams & Concurrency", "Write clean multi-threaded Java applications."),
                ("LR-JAVA-02", "CAP-SPRING-BOOT", "Spring Boot Microservices & Dependency Injection", "Build resilient RESTful services with Spring Boot."),
                ("LR-JAVA-03", "CAP-HIBERNATE", "JPA, Hibernate & Entity Mappings", "Manage persistence, transactions, and relational entity models."),
            ],
            "experience": "Design, build, and deploy an enterprise Spring Boot microservice with database persistence and REST APIs.",
            "progressions": ["Senior Java Engineer", "Lead Backend Architect", "Principal Enterprise Engineer"],
        },
        "RUST": {
            "name": "Rust Systems Engineer",
            "description": "High-performance systems programming, memory safety without garbage collection, and async runtimes.",
            "capabilities": [
                ("CAP-RUST-CORE", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-MEMORY-MANAGEMENT", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-ASYNC-TOKIO", "IMPORTANT", ProficiencyLevel.DEVELOPING),
                ("CAP-REST-API", "IMPORTANT", ProficiencyLevel.DEVELOPING),
                ("CAP-TESTING", "SUPPORTING", ProficiencyLevel.DEVELOPING),
            ],
            "learning": [
                ("LR-RUST-01", "CAP-RUST-CORE", "Ownership, Borrowing & Lifetimes", "Master memory safety semantics in Rust."),
                ("LR-RUST-02", "CAP-ASYNC-TOKIO", "Async Runtimes with Tokio & Axum", "Build high-throughput async services in Rust."),
            ],
            "experience": "Build a concurrent, memory-safe backend service or CLI application in Rust.",
            "progressions": ["Senior Systems Engineer", "Rust Platform Specialist", "Infrastructure Architect"],
        },
        "DEVOPS": {
            "name": "DevOps & Cloud Infrastructure Engineer",
            "description": "Continuous integration, container orchestration, infrastructure as code, and cloud reliability.",
            "capabilities": [
                ("CAP-DOCKER", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-KUBERNETES", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-CI-CD", "IMPORTANT", ProficiencyLevel.DEVELOPING),
                ("CAP-LINUX-SYSTEMS", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-CLOUD-INFRASTRUCTURE", "IMPORTANT", ProficiencyLevel.DEVELOPING),
            ],
            "learning": [
                ("LR-DEVOPS-01", "CAP-DOCKER", "Containerization & Multi-Stage Builds", "Package scalable microservices into containers."),
                ("LR-DEVOPS-02", "CAP-KUBERNETES", "Pod Scheduling, Services & Ingress", "Deploy and orchestrate workloads in Kubernetes."),
            ],
            "experience": "Build a complete CI/CD pipeline deploying containerized services to a Kubernetes cluster.",
            "progressions": ["Senior DevOps Engineer", "Site Reliability Engineer (SRE)", "Cloud Architect"],
        },
        "CSS": {
            "name": "Modern CSS & Responsive Design System",
            "description": "Design systems, layout algorithms, responsive typography, and web animation standards.",
            "capabilities": [
                ("CAP-CSS-FLEXBOX", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-CSS-GRID", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-RESPONSIVE-DESIGN", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-CSS-ANIMATIONS", "IMPORTANT", ProficiencyLevel.DEVELOPING),
                ("CAP-UI-STYLING", "SUPPORTING", ProficiencyLevel.DEVELOPING),
            ],
            "learning": [
                ("LR-CSS-01", "CAP-CSS-FLEXBOX", "Flexbox One-Dimensional Layouts", "Master flex alignment and distribution."),
                ("LR-CSS-02", "CAP-CSS-GRID", "Grid Two-Dimensional Layouts", "Build multi-track grid systems and auto-fit."),
                ("LR-CSS-03", "CAP-RESPONSIVE-DESIGN", "Media Queries & Fluid Layouts", "Design accessible responsive viewports."),
            ],
            "experience": "Build a responsive modern component library and design system utilizing Flexbox and Grid.",
            "progressions": ["Senior UI Stylist", "Design Systems Engineer", "Frontend UI Architect"],
        },
        "PYTHON": {
            "name": "Python Software Developer",
            "description": "Production Python development, asynchronous service design, API architectures, and data workflows.",
            "capabilities": [
                ("CAP-PYTHON", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-REST-API", "CORE", ProficiencyLevel.PROFICIENT),
                ("CAP-POSTGRESQL", "IMPORTANT", ProficiencyLevel.DEVELOPING),
                ("CAP-DOCKER", "IMPORTANT", ProficiencyLevel.DEVELOPING),
                ("CAP-TESTING", "SUPPORTING", ProficiencyLevel.DEVELOPING),
            ],
            "learning": [
                ("LR-PY-01", "CAP-PYTHON", "Advanced Python & Asyncio", "Master async execution and design patterns in Python."),
                ("LR-PY-02", "CAP-REST-API", "FastAPI / Django REST API Engineering", "Design and secure scalable REST APIs."),
            ],
            "experience": "Build and deploy a scalable Python backend service with testing and persistence.",
            "progressions": ["Senior Python Engineer", "Backend Architect", "Principal Engineer"],
        }
    }

    @classmethod
    def synthesize(cls, target_id: str, target_type: TargetType = TargetType.CAREER) -> TargetProfile:
        upper_id = target_id.upper()
        matched_spec = None
        for key, spec in cls.KNOWN_SPECS.items():
            if key in upper_id:
                matched_spec = spec
                break

        clean_token = (
            target_id.replace("CAREER-", "")
            .replace("DOMAIN-", "")
            .replace("TOPIC-", "")
            .upper()
            .replace("_", "-")
        )
        name = clean_token.replace("-", " ").title()

        if matched_spec:
            name = matched_spec["name"]
            desc = matched_spec["description"]
            raw_caps = matched_spec["capabilities"]
            raw_lrs = matched_spec["learning"]
            exp_desc = matched_spec["experience"]
            progressions = matched_spec["progressions"]
        else:
            desc = f"Professional software engineering profile and capability roadmap for {name}."
            raw_caps = [
                (f"CAP-{clean_token}-CORE", "CORE", ProficiencyLevel.PROFICIENT),
                (f"CAP-{clean_token}-ARCHITECTURE", "CORE", ProficiencyLevel.PROFICIENT),
                (f"CAP-{clean_token}-APPLIED", "IMPORTANT", ProficiencyLevel.DEVELOPING),
                ("CAP-REST-API", "IMPORTANT", ProficiencyLevel.DEVELOPING),
                ("CAP-TESTING", "SUPPORTING", ProficiencyLevel.DEVELOPING),
            ]
            raw_lrs = [
                (f"LR-{clean_token[:4]}-01", f"CAP-{clean_token}-CORE", f"{name} Core Architecture", f"Master foundational principles and implementation of {name}."),
                (f"LR-{clean_token[:4]}-02", f"CAP-{clean_token}-APPLIED", f"Production {name} Engineering", f"Build reliable software systems utilizing {name}."),
            ]
            exp_desc = f"Build and deploy an engineering application demonstrating {name}."
            progressions = [f"Senior {name} Specialist", f"{name} Tech Lead", f"Principal {name} Architect"]

        capability_requirements = [
            CapabilityRequirement(
                capability_id=c_id,
                importance=RequirementImportance[imp],
                expected_proficiency=prof,
                requirement_type=RequirementType.TECHNICAL,
            )
            for c_id, imp, prof in raw_caps
        ]

        learning_requirements = [
            LearningRequirement(
                requirement_id=lr_id,
                capability_id=c_id,
                topic=topic,
                priority=RequirementPriority.HIGH,
                prerequisite_ids=[],
                expected_outcome=outcome,
            )
            for lr_id, c_id, topic, outcome in raw_lrs
        ]

        exp_req_id = f"ER-{clean_token[:4]}-01"
        experience_requirements = [
            ExperienceRequirement(
                requirement_id=exp_req_id,
                category="PROJECT",
                description=exp_desc,
                specificity=RequirementSpecificity.TARGET_SPECIFIC,
                capability_ids=[capability_requirements[0].capability_id],
            )
        ]

        evidence_expectations = [
            EvidenceExpectation(
                expectation_id=f"EE-{clean_token[:4]}-01",
                requirement_id=exp_req_id,
                evidence_type="GITHUB_PROJECT",
                minimum_strength=EvidenceStrengthLevel.STRONG,
            )
        ]

        return TargetProfile(
            target=Target(
                target_id=target_id,
                target_type=target_type,
                name=name,
                taxonomy_version="TAX_DYNAMIC_001",
            ),
            description=desc,
            capability_requirements=capability_requirements,
            learning_requirements=learning_requirements,
            experience_requirements=experience_requirements,
            evidence_expectations=evidence_expectations,
            progression_paths=progressions,
            version="1.0",
        )


class DynamicTaxonomyRegistry:
    def __init__(self, profiles: Optional[List[TargetProfile]] = None):
        self._profiles: Dict[str, TargetProfile] = {}
        seed_profiles = profiles if profiles is not None else DEFAULT_TARGET_PROFILES
        for profile in seed_profiles:
            self.register_profile(profile)

    def register_profile(self, profile: TargetProfile):
        self._profiles[profile.target.target_id] = profile

    def get_profile(
        self,
        target_id: str,
        target_type: Optional[TargetType] = None,
        auto_synthesize: bool = True,
    ) -> TargetProfile:
        if target_id in self._profiles:
            return self._profiles[target_id]

        if auto_synthesize:
            inferred_type = target_type or (
                TargetType.CAREER if target_id.startswith("CAREER-") else TargetType.DOMAIN
            )
            synthesized_profile = DynamicTaxonomySynthesizer.synthesize(
                target_id=target_id,
                target_type=inferred_type,
            )
            self.register_profile(synthesized_profile)
            return synthesized_profile

        raise TargetNotFoundError(
            f"Target '{target_id}' is not registered in the taxonomy. "
            f"Available targets: {list(self._profiles.keys())}"
        )

    def list_targets(self, target_type: Optional[TargetType] = None) -> List[Target]:
        targets = [p.target for p in self._profiles.values()]
        if target_type:
            targets = [t for t in targets if t.target_type == target_type]
        return targets

    def exists(self, target_id: str) -> bool:
        return target_id in self._profiles
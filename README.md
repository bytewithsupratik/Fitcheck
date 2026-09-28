Fitcheck

Repository Overview

Fitcheck is a centralized monorepository containing all project components,
including the frontend, backend, intelligence layer, database artifacts, shared
packages, documentation, scripts, and test suites.

Repository Structure

Fitcheck/
├── apps/
│   ├── web/                # Frontend application
│   ├── api/                # Backend API
│   └── intelligence/       # Python-based AI/ML services
├── database/
│   ├── migrations/         # Schema migration scripts
│   ├── schemas/            # Database definitions
│   └── seeds/              # Initial data sets
├── packages/
│   ├── contracts/          # API, event, and schema definitions
│   ├── constants/          # Shared configuration constants
│   └── utils/              # Common utility functions
├── docs/
│   ├── architecture/       # System design overviews
│   ├── api/                # API specifications
│   ├── database/           # Data models and ERDs
│   ├── intelligence/       # AI logic and model documentation
│   └── decisions/          # Architecture Decision Records (ADRs)
├── scripts/                # Automation and CI/CD scripts
├── tests/
│   ├── integration/        # Cross-service testing
│   └── e2e/                # End-to-end user flows
└── .gitignore

Directory Responsibilities

| Directory            | Purpose                                            |
| :------------------- | :------------------------------------------------- |
| `apps/web/`          | Core frontend application                          |
| `apps/api/`          | Core backend application                           |
| `apps/intelligence/` | AI and machine learning services                   |
| `database/`          | Version-controlled database migrations and schemas |
| `packages/`          | Shared contracts, constants, and utilities         |
| `docs/`              | Technical documentation and architectural records  |
| `scripts/`           | Developer tooling and repository automation        |
| `tests/`             | Integration and end-to-end testing suites          |

Branching Strategy

  - main: The stable, production-ready branch.
  - develop: The primary integration branch for active development.
  - feature/*: Individual work branches. All feature development must occur on
    dedicated branches and merge into develop via pull requests.

Team Ownership

| Repository Area      | Primary Responsibility   |
| :------------------- | :----------------------- |
| `apps/web/`          | Frontend Team            |
| `apps/api/`          | Backend Team             |
| `apps/intelligence/` | Intelligence/AI Team     |
| `database/`          | Database & Backend Teams |
| `packages/`          | Technical Lead           |
| `docs/`              | Documentation Team       |
| `scripts/`           | Technical Lead & DevOps  |
| `tests/`             | Engineering Team         |

Repository Principles

The Fitcheck monorepository serves as the single source of truth for the entire
development lifecycle. To maintain repository health, follow these guidelines:

  - Encapsulation: Keep application-specific logic within its respective
    directory in apps/.
  - Shared Resources: Move code to packages/ only when it is required by
    multiple applications.
  - Organization: Ensure documentation, database artifacts, scripts, and tests
    remain in their designated directories to prevent clutter.

Development

Refer to CONTRIBUTING.md for environment setup instructions, coding standards,
and contribution workflows.

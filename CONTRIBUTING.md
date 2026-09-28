# Contributing to Fitcheck

This document outlines the Git workflow and repository conventions for the Fitcheck development team. Following these guidelines ensures an organized repository, prevents merge conflicts, and maintains a predictable collaborative environment.

---

## Repository Branches

Fitcheck utilizes a structured branching model to manage development:

```text
main
└── develop
    └── feature/*
```

*   **`main`**: Represents the stable production state. **Direct development on `main` is prohibited.**
*   **`develop`**: The primary integration branch for ongoing development.
*   **`feature/*`**: Dedicated branches for specific tasks, features, or fixes. Create these from the latest `develop` branch.

### Branch Naming

Use descriptive, lowercase names with hyphens.

| Type | Format | Examples |
| :--- | :--- | :--- |
| **Features** | `feature/<description>` | `feature/login-page`, `feature/intelligence-api` |
| **Bug Fixes** | `fix/<description>` | `fix/login-validation`, `fix/api-error-response` |
| **Maintenance** | `chore/<description>` | `chore/update-gitignore`, `chore/repository-setup` |
| **Documentation** | `docs/<description>` | `docs/api-documentation` |

---

## Development Workflow

### 1. Creating a Feature Branch

Always synchronize your local `develop` branch before starting a new task:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<short-description>
```

### 2. Area Responsibility

To minimize merge conflicts, restrict your work to the relevant directory:

*   **Frontend**: `apps/web/`
*   **Backend**: `apps/api/`
*   **Intelligence**: `apps/intelligence/`
*   **Database**: `database/`
*   **Documentation**: `docs/`
*   **Shared Code**: `packages/`

### 3. Commit Guidelines

#### Pre-Commit Review
Before committing, verify your changes and ensure no sensitive or unnecessary files are staged:
*   **Run**: `git status` and `git diff`
*   **Never commit**: `.env` files, credentials, `.venv/`, `node_modules/`, build artifacts (`dist/`), or personal IDE configs.

#### Commit Messages
Use the Conventional Commits format: `<type>: <description>`

*   **`feat`**: New functionality
*   **`fix`**: Bug fix
*   **`docs`**: Documentation updates
*   **`chore`**: Maintenance
*   **`refactor`**: Code restructuring
*   **`test`**: Adding/updating tests
*   **`style`**: Formatting/UI changes

**Example**: `feat: add user authentication middleware`

### 4. Pushing and Pull Requests

Push your branch to GitHub:
```bash
git push -u origin feature/<short-description>
```

All features must merge into `develop` via a Pull Request (PR) following this lifecycle:
`Feature Branch` → `Push` → `PR` → `Peer Review` → `Approval` → `Merge to Develop`

**PR Requirements:**
*   Clear, descriptive title.
*   Explanation of the change and its necessity.
*   Summary of testing performed.
*   No unrelated changes.

### 5. Keeping Branches Current
Before opening a PR, ensure your branch is up-to-date with `develop` to resolve conflicts early:

```bash
git checkout develop
git pull origin develop
git checkout feature/<name>
git merge develop
```

---

## Shared Packages Policy

The `packages/` directory is exclusively for code shared across multiple components (e.g., `contracts`, `constants`, `utils`). 
*   **Do not** place application-specific logic in `packages/`.
*   Keep frontend logic in `apps/web/`, backend logic in `apps/api/`, and AI logic in `apps/intelligence/`.

---

## Repository Hygiene

Maintain a clean history and secure environment:
*   **Secrets**: If a secret (API key, password) is committed, notify the Technical Lead immediately to initiate rotation and history scrubbing.
*   **Ignored Files**: Respect the `.gitignore`. Never force-add generated or machine-specific files.
*   **Focus**: Keep changes small and task-oriented.
*   **Communication**: Consult the team before modifying shared contracts or the core repository structure.

---


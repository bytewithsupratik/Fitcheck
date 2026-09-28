# FitCheck Backend Specification

## Scope and Evidence

This specification combines the frontend contract analysis under `apps/web/src` with the canonical database blueprint for the backend. It describes the current frontend requirements, the real-user persistence model, and future intelligence data boundaries.

Evidence labels used below:

- **Runtime service**: a request wrapper exists and can issue the request, although callers may currently fall back locally.
- **Service contract**: documented by a service/comment and intended for backend integration, but not reliably invoked by the rendered UI.
- **UI-only**: state or behavior exists in the browser with no backend request.

The current frontend is primarily an in-memory/localStorage prototype. Backend implementations must not trust client-derived scores, completion states, verification flags, uploaded-file metadata, or API keys.

### Mock Data Transition

The frontend currently uses mock data, local state, and localStorage while backend development is in progress. These are temporary development fallbacks only. After backend integration is complete, authenticated backend data becomes the source of truth and mock data must not be used in production.

- User profiles, onboarding, goals, roadmaps, missions, progress, forecasts, evidence, skills, and dashboard metrics must be persisted server-side.
- The frontend must replace mock imports and local fallback responses with API responses.
- The backend must calculate authoritative progress, readiness, streaks, verification, permissions, and generated intelligence.
- The frontend must support loading, empty, unauthorized, validation-error, and service-error states.

## Canonical Database Schema Blueprint

The following tables are the proposed PostgreSQL/Supabase schema. `public.users` is the application identity table. `public.learners` is a one-to-one learner projection for intelligence features; it must not become a second independent user identity system.

### 1. Accounts, Learning, and Catalog

#### `public.users`

Primary key: `id uuid DEFAULT gen_random_uuid()`

| Field | Type | Nullability / default | Constraints |
|---|---|---|---|
| `id` | uuid | NOT NULL | Primary key |
| `email` | varchar | NOT NULL | Unique, normalized case-insensitively |
| `username` | varchar | NOT NULL | Unique |
| `first_name` | varchar | nullable | |
| `last_name` | varchar | nullable | |
| `created_at` | timestamptz | NOT NULL, `now()` | |
| `updated_at` | timestamptz | NOT NULL, `now()` | Updated by trigger |
| `target_role` | varchar | nullable | Frontend target role |
| `focus_topic` | varchar | nullable | Frontend topic sprint |
| `timeline` | varchar | nullable | Preserve frontend free-text timeline initially |
| `streak` | varchar | nullable, `'0 Days'` | Presentation field; derive numeric streak separately |
| `day_number` | integer | nullable, `1` | Server-owned current day |
| `readiness` | varchar | nullable, `'25%'` | Presentation field; store numeric readiness separately |
| `goal` | varchar | nullable, `'85%'` | Presentation field; store numeric goal separately |
| `session_status` | varchar | nullable, `'Ready'` | Do not use as authorization state |
| `github_slug` | varchar | nullable | Canonical `owner/repository` |
| `uploaded_files` | jsonb | nullable, `[]` | Prefer normalized file records for production |

#### `public.learners`

Primary key and foreign key: `id uuid REFERENCES public.users(id)`.

Fields: `external_id varchar NULL`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.

#### Catalog tables

The following tables use `id uuid DEFAULT gen_random_uuid()` as primary key, `created_at timestamptz DEFAULT now()`, and `updated_at timestamptz DEFAULT now()` unless stated otherwise:

- `public.topics`: `name varchar NOT NULL UNIQUE`, `description text NULL`.
- `public.jobs`: `name varchar NOT NULL UNIQUE`, `description text NULL`.
- `public.skills`: `name varchar NOT NULL UNIQUE`, `description text NULL`.
- `public.capabilities`: `name varchar NOT NULL UNIQUE`, `description text NULL`, `domain varchar NULL`, `version varchar NULL`.
- `public.courses`: `name text NOT NULL`, `description text NULL`, `difficulty text NULL`, `prerequisites text[] NULL`. Constrain `difficulty` to `beginner`, `intermediate`, or `advanced`.
- `public.lessons`: `course_id uuid NOT NULL REFERENCES public.courses(id)`, `title text NOT NULL`, `content text NULL`, `video_url text NULL`, `order_idx integer DEFAULT 0`.
- `public.quizzes`: `lesson_id uuid NOT NULL REFERENCES public.lessons(id)`, `questions jsonb NOT NULL DEFAULT '[]'`. Answer keys must not be returned to the browser.

### 2. Goals, Roadmap, and Progress

#### `public.onboarding`

Primary key: `id uuid DEFAULT gen_random_uuid()`. Unique constraint: `user_id`. Foreign keys: `user_id REFERENCES public.users(id)`, `topic_id REFERENCES public.topics(id)`, `job_id REFERENCES public.jobs(id)`.

Fields: `mode varchar NOT NULL`, `duration_days integer NOT NULL`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`. Constraints: `mode IN ('TOPIC_SPRINT', 'JOB_READY')`; `duration_days > 0`.

#### `public.learner_goals`

Primary key: `id uuid DEFAULT gen_random_uuid()`. Foreign keys: `learner_id REFERENCES public.learners(id)`, `topic_id REFERENCES public.topics(id)`, `job_id REFERENCES public.jobs(id)`.

Fields: `goal_type varchar NOT NULL`, `status varchar NOT NULL DEFAULT 'active'`, `started_at timestamptz DEFAULT now()`, `ended_at timestamptz NULL`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`. Constraints: `goal_type IN ('TOPIC_SPRINT', 'JOB_READY')`; `status IN ('active', 'completed', 'cancelled')`.

#### Roadmap hierarchy

- `public.roadmap`: `id uuid DEFAULT gen_random_uuid()`, `user_id uuid NOT NULL REFERENCES public.users(id)`, `job_id uuid NULL REFERENCES public.jobs(id)`, `status varchar NOT NULL`, `version integer NOT NULL DEFAULT 1`, timestamps. Constraints: `status IN ('active', 'completed', 'archived')`; `version > 0`.
- `public.roadmap_stage`: `id uuid DEFAULT gen_random_uuid()`, `roadmap_id uuid NOT NULL REFERENCES public.roadmap(id)`, `title varchar NOT NULL`, `description text NULL`, `stage_order integer NOT NULL`, `status varchar NOT NULL`, timestamps. Constraints: `stage_order > 0`; `status IN ('not_started', 'in_progress', 'completed', 'blocked')`.
- `public.mission`: `id uuid DEFAULT gen_random_uuid()`, `stage_id uuid NOT NULL REFERENCES public.roadmap_stage(id)`, `title varchar NOT NULL`, `description text NULL`, `status varchar NOT NULL`, `mission_order integer NOT NULL`, timestamps. Constraints: `mission_order > 0`; same four-value status enum.
- `public.mission_task`: `id uuid DEFAULT gen_random_uuid()`, `mission_id uuid NOT NULL REFERENCES public.mission(id)`, `title varchar NOT NULL`, `description text NULL`, `task_order integer NOT NULL`, `status varchar NOT NULL`, timestamps. Constraint: `task_order > 0`; same four-value status enum.

#### Progress tables

`public.mission_progress` has primary key `id uuid DEFAULT gen_random_uuid()`, foreign keys `mission_id REFERENCES public.mission(id)` and `user_id REFERENCES public.users(id)`, and fields `progress integer NOT NULL DEFAULT 0`, `status varchar NOT NULL`, `started_at timestamptz NULL`, `completed_at timestamptz NULL`, `created_at`, and `updated_at`. Constrain `progress BETWEEN 0 AND 100` and status to `not_started`, `in_progress`, `completed`, or `blocked`. Add a unique constraint on `(mission_id, user_id)`.

`public.user_progress` uses composite primary key `(user_id, lesson_id)`, with foreign keys to `public.users(id)` and `public.lessons(id)`. Fields: `completed boolean DEFAULT false`, `completed_at timestamptz NULL`. This is the lesson-level progress projection used by the frontend learning views.

### 3. Evidence and Capability Tracking

#### `public.evidence`

Primary key: `id uuid DEFAULT gen_random_uuid()`. Foreign key: `learner_id REFERENCES public.learners(id)`.

Fields: `title varchar NULL`, `description text NULL`, `evidence_type varchar NOT NULL`, `source varchar NULL`, `source_url text NULL`, `occurred_at timestamptz NULL`, `status varchar NOT NULL DEFAULT 'PENDING'`, `source_reference text NULL`, `submitted_at timestamptz DEFAULT now()`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.

Require non-blank `evidence_type`; require non-blank `title` when supplied. Define and enforce an evidence status enum rather than accepting arbitrary client values.

`public.evidence_skills` is a many-to-many join table with composite primary key `(evidence_id, skill_id)`, foreign keys to `public.evidence(id)` and `public.skills(id)`, and `created_at timestamptz DEFAULT now()`.

#### Observations and claims

- `public.observations`: `id uuid DEFAULT gen_random_uuid()`, `learner_id uuid NOT NULL REFERENCES public.learners(id)`, `evidence_id uuid NULL REFERENCES public.evidence(id)`, `observation_type varchar NOT NULL`, `description text NOT NULL`, `observed_at timestamptz DEFAULT now()`, `created_at timestamptz DEFAULT now()`. Require non-blank type and description.
- `public.claims`: `id uuid DEFAULT gen_random_uuid()`, `learner_id uuid NOT NULL REFERENCES public.learners(id)`, `claim_type varchar NOT NULL`, `statement text NOT NULL`, `confidence numeric NOT NULL DEFAULT 0.0000`, `status varchar NOT NULL DEFAULT 'ACTIVE'`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`. Require `confidence BETWEEN 0 AND 1`; status must be `ACTIVE`, `PENDING`, `REJECTED`, `PROVEN`, or `ARCHIVED`.
- `public.claim_observations`: composite primary key `(claim_id, observation_id)`, foreign keys to claims and observations, `created_at`.

#### Capability evaluations

`public.capability_evaluations` has primary key `id uuid DEFAULT gen_random_uuid()` and foreign keys `learner_id REFERENCES public.learners(id)`, `capability_id REFERENCES public.capabilities(id)`, and optional `evidence_id REFERENCES public.evidence(id)`.

Fields: `level integer NOT NULL`, `confidence numeric NOT NULL`, `evaluation_method varchar NOT NULL`, `proficiency numeric NULL`, `mastery numeric NULL`, `evidence_strength numeric NULL`, `evaluation_id uuid NULL`, `evaluated_at timestamptz DEFAULT now()`, `created_at timestamptz DEFAULT now()`. Constraints: `level BETWEEN 0 AND 100`, `confidence BETWEEN 0 AND 1`, non-blank `evaluation_method`; apply the same `0..1` range to normalized proficiency/mastery/evidence-strength values when those fields are used.

Join tables:

- `public.capability_evaluation_claims`: composite primary key `(evaluation_id, claim_id)`, foreign keys to `capability_evaluations(id)` and `claims(id)`, `created_at`.
- `public.evaluation_observations`: composite primary key `(evaluation_id, observation_id)`, foreign keys to `capability_evaluations(id)` and `observations(id)`, `created_at`.
- `public.evaluation_evidence`: composite primary key `(evaluation_id, evidence_id)`, foreign keys to `capability_evaluations(id)` and `evidence(id)`, `created_at`.

### Blueprint integration decisions

- Use `users.id` as the authenticated account identity and `learners.id` as the intelligence-facing one-to-one projection.
- Use the normalized `roadmap -> roadmap_stage -> mission -> mission_task` hierarchy for real user data. Existing frontend `curriculum_*`, `daily_*`, and `user_roadmap_progress` concepts should map to these tables or be explicitly retained as catalog/progress projections, not duplicated accidentally.
- Store numeric readiness, streak, goal, and progress values as numeric columns. Keep formatted strings such as `'85%'` and `'0 Days'` only in API presentation serializers if the existing frontend requires them.
- Add `created_at` and `updated_at` triggers consistently, indexes on all foreign keys, and row-level security policies scoped to the authenticated user/learner.
- Apply check constraints and enum validation in the database and API. Client validation is only a usability layer.

## 1. Data Models & Entity Schema

### 1.1 Identity, authentication, and account entities

#### `users`

One user owns all user-scoped records below. `email` must be unique and normalized case-insensitively. The frontend assumes at least:

| Field | Type | Nullability | Constraints / notes |
|---|---|---:|---|
| `id` | UUID/string identifier | NOT NULL | Primary key; mock IDs use `usr_mock_*`. |
| `email` | string | NOT NULL | Unique; browser email validation only. |
| `full_name` | string | nullable | Registration field `fullName`. |
| `preferred_name` | string | nullable | Onboarding requires trimmed length >= 2. |
| `role` | string | nullable | Mentioned in auth comments; no frontend RBAC behavior defines allowed values. |
| `created_at` | timestamp | NOT NULL | Server generated. |
| `status` | enum/string | nullable | Profile defaults use `online`, `focus`, `idle`; account status is not clearly distinguished from presence status. |
| `avatar_color` | enum/string | nullable | `cyan`, `purple`, `emerald`, `amber`. |

#### `user_credentials`

| Field | Type | Nullability | Constraints / notes |
|---|---|---:|---|
| `user_id` | UUID/string | NOT NULL | FK to `users`, unique one-to-one. |
| `password_hash` | string | NOT NULL for password accounts | Store Argon2id or bcrypt output only. |
| `salt` | string | implementation-defined | Do not expose. |

#### `sessions`

| Field | Type | Nullability | Constraints / notes |
|---|---|---:|---|
| `id` | UUID/string | NOT NULL | Primary key. |
| `user_id` | UUID/string | NOT NULL | FK to `users`, one-to-many. |
| `token` / token identifier | opaque/JWT identifier | NOT NULL | The frontend expects `data.token`; do not persist raw bearer tokens unless architecture requires it. |
| `expires_at` | timestamp | NOT NULL | Required for revocation and expiry. |
| `revoked_at` | timestamp | nullable | Set by logout/revocation. |

OAuth comments also imply a one-to-many `user_oauth_identities` table with `provider`, `provider_uid`, and provider access-token material. Provider identity must be unique on `(provider, provider_uid)` and secrets must be encrypted or replaced with refresh-token vault references.

### 1.2 Profile and preferences

The profile service describes an atomic update spanning these one-to-one tables:

#### `user_bios`

`user_id` (FK/unique), `bio` (nullable string, UI max 280 characters), `location` (nullable string), `target_role` (nullable string).

#### `user_preferences`

`user_id` (FK/unique), `theme` enum (`cyber-dark`, `midnight`, `obsidian`, `light`), `density` enum (`compact`, `comfortable`), `code_font` enum/string (`JetBrains Mono`, `Fira Code`, `Geist Mono`, `ui-monospace`), and `default_landing` enum (`gym`, `forecast`, `home`).

#### `user_notifications`

`user_id` (FK/unique), `notify_daily_forecast` boolean, `forecast_time` time string in `HH:MM` format (default `08:00`), `notify_gym_streak` boolean, `notify_weekly_digest` boolean, `notify_push_alerts` boolean, and `sound_effects` boolean.

Profile identity also uses `username` (expected unique if used as a login/display handle), `title`, `github_username`, `github_url`, `github_verified` boolean, `two_factor_enabled` boolean, and `last_password_change` timestamp/date. These fields are currently local UI state and should be normalized or explicitly versioned in the API.

### 1.3 Onboarding and evidence

#### `user_onboarding_responses`

One user may have multiple submissions historically, but the active onboarding configuration should be unique per user or versioned.

| Field | Type | Nullability | Constraints / notes |
|---|---|---:|---|
| `id` | UUID | NOT NULL | Primary key. |
| `user_id` | UUID | NOT NULL | FK to `users`. |
| `preferred_name` | string | NOT NULL | Trimmed length >= 2. |
| `institute` / `university` | string | nullable | UI optional. |
| `year_of_study` / `standard_year` | string | nullable | UI optional. Preserve one canonical API name. |
| `goal_type` | enum | NOT NULL | `topic` or `job`. |
| `goal_input` | string | NOT NULL | Trimmed length >= 2. Topic or role depending on `goal_type`. |
| `timeline` | string | NOT NULL | Trimmed length >= 2; presets are `1 Week`, `3 Weeks`, `1 Month`, `3 Months`, `6 Months`, `1 Year`, but free text is accepted. |
| `github_url` | string | nullable | Client parser expects `github.com/<owner>/<repository>`. |
| `github_slug` | string | nullable | Canonical `<owner>/<repository>`, with one trailing `.git` removed. |
| `assessment_level` | enum | nullable | `beginner`, `moderate`, `advanced`. |
| `quiz_score` | integer | nullable | Client quiz has three questions per tier; server must recompute from submitted answers. |
| `quiz_completed` | boolean | NOT NULL | Defaults false in client state. |
| `attestation_checked` | boolean | NOT NULL | Required true when an assessment level is selected. |
| `submitted_at` | timestamp | NOT NULL | Server generated. |

The UI sends `uploadedFiles` as metadata objects when onboarding is submitted: `{ id, name, type, size }`. This is not sufficient for storage. The backend must bind uploaded objects to authenticated users and derive filename, MIME type, size, checksum, and object key server-side.

#### `user_resumes`

Implied by the onboarding service: `id`, `user_id`, `file_name`, `file_url`/object key, `parsed_skills`, `parsed_experience`, parser status, and timestamps. Use a separate object-storage record and asynchronous parser job for production workloads.

#### `user_github_integrations`

Implied fields: `user_id`, `github_handle`, `repos_count`, and `top_languages`. Add provider identity, verification timestamp, request status, and raw-response retention policy. Do not accept `verified` from the browser.

### 1.4 Curriculum and progression

#### `curriculum_tracks`

`id`, `slug`, `name`, `total_days`, `description`. `trackId` is currently a free query string with default `ai_ml`.

#### `curriculum_days`

`id`, `track_id` FK, `day_number` integer, `title`, `episode` integer, `episode_title`, `duration` string, `category`, `description`, `deliverable`, `is_milestone` boolean, and `node_type` enum (`milestone`, `active`, `practice`). `day_number` is unique within a track.

#### `user_roadmap_progress`

Unique on `(user_id, day_number)` or `(user_id, track_id, day_number)`. Fields: `user_id`, `track_id`, `day_number`, `status` enum (`completed`, `current`, `locked`), `stars` integer (mock values `0` or `3`; validate the allowed range), `completed_at`, and update timestamps. The server, not the client, determines unlockability and current day.

### 1.5 Daily forecast

#### `daily_forecasts`

Implied fields: `id`, `day_number`, `title`, `focus_topic`, `duration`, and `skill_chips`. Add track/user personalization keys as needed; `day_number` alone is not a safe tenant key.

#### `user_daily_tasks`

`user_id`, `forecast_id`, `task_id`, `title`, `duration` numeric minutes, `completed` boolean, and timestamps. Unique on `(user_id, forecast_id, task_id)`.

#### `video_lessons` and user video progress

Video fields: `id` string, `title`, `category`, `duration` display string, `tag`, `description`, `action_label`, and `url` if externally hosted. User progress fields: `user_id`, `video_id`, `is_completed` boolean, timestamps; unique on `(user_id, video_id)`.

#### `study_materials` and user material progress

Material fields: `id`, `category`, `title`, `duration`, `tag`, `summary`, `takeaways` string array, `code_snippet` string, and optionally `url`/publisher/read time. User progress: `user_id`, `material_id`, `is_read` boolean, timestamps; unique on `(user_id, material_id)`.

### 1.6 Technical Gym and evidence vault

#### `gym_challenges`

`id`, `title`, `prompt` or `description`, `category`, `tier`, `difficulty`, `time_est`, `starter_code`, `tests` string array, `options` array for quiz questions, `correct_answer` server-only, and `active` boolean/order sequence. Never return `correct_answer` in a challenge response.

#### `code_submissions`

`id`, `user_id`, `challenge_id`, `user_code`, `language`, `ast_score`, `pass_rate`, `test_results`, execution status, resource usage, and timestamps. Code execution must be isolated, resource-limited, time-limited, and network-disabled by default.

#### `evidence_verifications` / `evidence_certificates`

The frontend uses both names. Consolidate or define the relationship. Fields observed: `id`, `user_id`, `title`, `gym_sprint`, `tier`, `score`, `max_score`, `status`, `verification_hash`/`cert_hash`, `repo_url`, `verified_date`, `summary`, `metrics` JSON, `test_suites` JSON, `code_snippet`, `ai_examiner_feedback`, and audit timestamps. `status` currently includes exact value `Verified & Certified`.

### 1.7 Analytics and intelligence

#### `user_telemetry`

Implied fields: `user_id`, `readiness_pct`, `streak_days`, `goal_pct`, `weekly_velocity`, and timestamps. Percentages are numeric server values; the UI sometimes formats them as strings such as `78%`.

#### `skill_evaluations`

Fields: `user_id`, `skill_key`, `label`, `user_score`, `industry_benchmark`/`industry`, `gap` or derived difference, `note`, and timestamps. Mock skill keys include `react_core`, `state_optimistic`, `perf_virtual`, `async_resilience`, `distributed_cache`, `testing_ast`.

#### `intelligence_audits`

Fields observed: `user_id`, `target_role`, `overall_alignment`, `market_demand_tier`, `summary_assessment`, `signals`, `tactical_advice`, `readiness_band`, `hire_probability`, `strengths`, `gaps`, and timestamps. Treat signals and advice as generated, versioned data rather than mutable client input.

## 2. API Endpoints & Contract Definitions

### 2.1 Shared request and response rules

Base URL is `VITE_API_BASE_URL`, defaulting to `https://api.fitcheck.app/v1`. `apiFetch` sends `Content-Type: application/json`, `X-Api-Key`, and, when present, `Authorization: Bearer <token>`.

The frontend assumes successful responses are JSON. The common observed error extraction is:

```json
{
  "message": "Human-readable error"
}
```

Backend responses should standardize errors as:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ],
    "requestId": "req_01..."
  }
}
```

Use `400` for malformed requests, `401` for missing/invalid/expired sessions, `403` for policy/ownership denial, `404` for unknown resources, `409` for duplicate/conflicting mutations, `413` for oversized uploads, `415` for unsupported media, `422` for field validation, `429` for rate limits, and `5xx` for dependency/server failures. Keep `message` at the top level during migration because the current client reads `errorData.message`.

### 2.2 Authentication

#### `POST /auth/login` - Runtime service

Request:

```json
{ "email": "user@example.com", "password": "secret" }
```

Success (`200`):

```json
{
  "token": "JWT_OR_SESSION_TOKEN",
  "user": { "id": "usr_123", "email": "user@example.com", "fullName": "Alex Rivera" }
}
```

The service stores `token` under `fitcheck_auth_token`.

#### `POST /auth/register` - Runtime service

Request:

```json
{
  "email": "user@example.com",
  "password": "secret",
  "fullName": "Alex Rivera",
  "preferredName": "Alex",
  "targetRole": "AI/ML Specialist"
}
```

Success has the same `{ token, user }` shape (`201` preferred; client accepts any 2xx).

#### `POST /auth/logout` - Runtime service

No body. Revokes the active session and returns any JSON success object (`200` or `204`; current client expects JSON, so return JSON until the client changes).

#### OAuth - Service contract, currently UI-only

Commented contracts are `GET /auth/oauth/github` and `GET /auth/oauth/google`, intended to redirect to provider authorization. The UI also displays GitLab but has no GitLab endpoint contract. Define callback/token exchange behavior before enabling this flow; do not put provider secrets in Vite variables.

### 2.3 Onboarding

#### `POST /onboarding/submit` - Service contract; component call is commented out

Request is the onboarding state, observed as:

```json
{
  "preferredName": "Alex",
  "university": "Self-taught",
  "yearOfStudy": "Senior",
  "goalType": "job",
  "goalInput": "AI/ML Specialist",
  "timeline": "3 Months",
  "githubUrl": "https://github.com/owner/repository",
  "githubSlug": "owner/repository",
  "githubValid": true,
  "uploadedFiles": [
    { "id": "client-id", "name": "resume.pdf", "type": "PDF", "size": "120.0 KB" }
  ],
  "assessmentLevel": "moderate",
  "quizStarted": true,
  "quizCompleted": true,
  "quizScore": 2,
  "attestationChecked": true
}
```

Success shape is not consumed beyond returning backend JSON. Return a canonical onboarding record, allocation, and server-computed baseline. Validate that an assessment is complete and attested when `assessmentLevel` is present.

#### `POST /onboarding/parse-resume` - Runtime service, multipart

Multipart field: `resume` (single file). The client does not send JSON `Content-Type`. Success is expected as JSON; the fallback shape is:

```json
{
  "success": true,
  "fileName": "resume.pdf",
  "detectedSkills": ["PyTorch", "Transformers", "Distributed Training", "CUDA"]
}
```

Define size, MIME, malware scanning, retention, and asynchronous parsing limits. AI parser integrations are only comments, not active clients.

#### `GET /onboarding/github/:username` - Runtime service

Success fields observed:

```json
{
  "success": true,
  "username": "owner",
  "verified": true,
  "publicRepos": 18,
  "primaryLanguage": "Python / TypeScript"
}
```

The browser parser separately accepts repository URLs matching `github.com/<owner>/<repository>` and strips `.git` from the repository name. Validate usernames and repository ownership server-side.

### 2.4 User account and profile

#### `GET /user/profile` - Runtime service

Returns a profile object merged with local defaults. Include identity, bio, social, preferences, notifications, and security metadata in one stable object.

#### `PUT /user/profile` - Runtime service

Request is the full merged profile plus client-generated `updatedAt`:

```json
{
  "username": "rishi06.kk",
  "fullName": "Rishi Kumar",
  "email": "user@example.com",
  "title": "Full-Stack Systems Architect",
  "bio": "Systems thinker...",
  "location": "Bengaluru, India",
  "targetRole": "Senior Full-Stack Architect",
  "theme": "cyber-dark",
  "density": "comfortable",
  "codeFont": "JetBrains Mono",
  "defaultLanding": "gym",
  "notifications": {
    "notifyDailyForecast": true,
    "forecastTime": "08:00",
    "notifyGymStreak": true,
    "notifyWeeklyDigest": true,
    "notifyPushAlerts": true,
    "soundEffects": true
  },
  "updatedAt": "2026-09-23T00:00:00.000Z"
}
```

The comment describes an atomic transaction across `users`, `user_bios`, and `user_preferences`; include notifications in the same transaction or clearly return partial status.

#### `POST /user/change-password` - Runtime service

Request:

```json
{ "currentPassword": "old-secret", "newPassword": "new-secret" }
```

UI rules require non-empty current password, new password length >= 8, exact confirmation in the UI, and strength checks for uppercase, number, and non-alphanumeric symbol. The confirmation is not sent and must be validated server-side only for the new password rules.

#### `DELETE /user/account` - Runtime service

No body. Perform authenticated deletion or documented tombstoning with cascading personal data purge. Require re-authentication or an explicit confirmation token server-side. The current UI confirmation is the case-insensitive trimmed word `DELETE`, but it is not sent to this service.

#### `POST /user/export-data` - Service contract only

Documented but not called. Define an authenticated export job returning a download URL or JSON/CSV stream. The current UI instead creates a local JSON/CSV file and must not be treated as proof that backend export exists.

### 2.5 Dashboard

All dashboard requests are service contracts; rendered calls are currently incomplete/commented in the inspected source.

- `GET /dashboard/metrics`: expected fields include `readiness`, `streak`, `goal`, and `velocity`.
- `GET /dashboard/skills`: expected `{ "skills": [...], "timeline": [...] }`, where skill items use `key`, `label`, `user`, `industry`, and `note`; timeline items use `week`, `date`, `score`, `label`, and `delta`.
- `GET /dashboard/evidence`: expected `{ "evidence": [...] }`, with evidence fields from `evidence_certificates` above.
- `GET /dashboard/intelligence`: documented in components but no complete service response wrapper was observed. The UI expects intelligence data such as `targetRole`, `overallAlignment`, `marketDemandTier`, `summaryAssessment`, `signals`, and `tacticalAdvice`.

The checked-in `dashboardService.js` contains conflict-marker-like duplicated fragments. Resolve that source before treating its fallback branch as an executable contract.

### 2.6 Roadmap

#### `GET /roadmap/track?trackId=ai_ml` - Runtime service

Success expected:

```json
{ "days": [
  {
    "id": 56,
    "dayNumber": 56,
    "title": "Transformer KV-Cache & Continuous Batching",
    "episode": 2,
    "episodeTitle": "Month 2: Concurrency & Attention Architecture",
    "status": "current",
    "stars": 0,
    "duration": "30-45 mins",
    "category": "Transformers & Attention",
    "nodeType": "active",
    "description": "...",
    "deliverable": "..."
  }
] }
```

#### `POST /roadmap/complete-day` - Runtime service; currently no UI caller

Observed payload:

```json
{ "dayNumber": 56, "stars": 3 }
```

A comment also mentions `score`, but the implementation does not send it. The server must enforce sequence/unlock rules and use an idempotent upsert on user and day. Return `{ "success": true, "data": { ...progress } }`.

### 2.7 Forecast

#### `GET /forecast/today?dayNumber=56` - Runtime service

Success expected:

```json
{ "tasks": [], "videos": [], "docs": [], "materials": [] }
```

The exact item fields are defined in the entity section. No pagination, filtering, sorting, cursor, page, limit, or offset parameters are implemented.

#### `PATCH /forecast/tasks/:taskId` - Runtime service

```json
{ "completed": true }
```

#### `PATCH /forecast/videos/:videoId` - Runtime service

```json
{ "isCompleted": true }
```

#### `PATCH /forecast/materials/:materialId` - Runtime service

```json
{ "isRead": true }
```

Each mutation is expected by the wrapper as `{ "success": true, "data": ... }`. Enforce ownership and idempotency; never update another user's record based only on an exposed ID.

### 2.8 Technical Gym

#### `GET /gym/challenges` - Runtime service

Returns challenge JSON. The UI fallback has quiz questions with `id`, `prompt`, `codeSnippet`, `options[{id,text}]`, `correctAnswer`, and `explanation`, plus code challenges with `id`, `title`, `category`, `tier`, `difficulty`, `timeEst`, `description`, `starterCode`, and `tests`. Do not send answer keys in production challenge payloads.

#### `POST /gym/verify-repo` - Runtime service; UI caller is commented

```json
{ "repoUrl": "https://github.com/owner/repository", "sprintChallengeId": "ev-1" }
```

Success is wrapped by the service as `{ "success": true, "verification": <backend response> }`. Fallback verification includes `hash`, `status` (`Verified & Certified`), `score`, `astQuality`, `cyclomaticComplexity`, `repoUrl`. These values must be generated from a server-side GitHub fetch and isolated AST/test pipeline.

#### `POST /gym/submit-code` - Runtime service

```json
{ "challengeId": "ch-1", "code": "function ...", "language": "javascript" }
```

The fallback response includes `passed`, numeric `score`, and `testResults[{name,status,duration}]`, with test status `passed`. The backend must impose execution sandbox limits and return a stable result schema.

#### `POST /gym/certify` - Service contract only

Listed in comments but no implementation exists. Define request/response and authorization before exposing it; certification must be derived from a completed verified submission, not a client-provided score.

## 3. Business Logic, Calculations, & Rules

### 3.1 Server-owned calculations

- The client derives role/focus from `goalType`: `job` maps `goalInput` to `targetRole`; `topic` maps it to `focusTopic`.
- The client derives a readiness display score using `Math.round(50 + (quizScore / 3) * 35)`, with a default display of `54%`. This is presentation logic only. The backend must recompute readiness from canonical assessment, forecast, gym, evidence, and roadmap records.
- Roadmap status (`completed`, `current`, `locked`), next milestone, streak, velocity, unlocks, stars, scores, evidence status, verification hashes, and skill gaps must be server calculated.
- Optimistic local updates exist for profile, task/video/material completion, and roadmap completion. APIs must be idempotent and return authoritative state for reconciliation.
- Quiz scoring must be recomputed from server-held question answers. Do not accept `quizScore` as authoritative.

### 3.2 Validation rules to mirror

- `preferredName.trim().length >= 2`.
- `goalType` is exactly `topic` or `job`.
- `goalInput.trim().length >= 2`.
- `timeline.trim().length >= 2`; preset strings are listed above, but arbitrary text is accepted by the UI.
- `assessmentLevel` is `beginner`, `moderate`, or `advanced` when present.
- If assessment is selected: quiz must be complete and `attestationChecked` must be true.
- GitHub repository input must contain `github.com/<owner>/<repository>`; client accepts owner characters `[A-Za-z0-9-_]+` and repository characters `[A-Za-z0-9-_.]+`, then removes a trailing `.git`.
- Bio max length is 280 characters.
- Password must be at least 8 characters; the UI strength indicators require uppercase, number, and symbol. Enforce a server policy and do not rely on client strength indicators.
- Account deletion UI confirmation is case-insensitive trimmed `DELETE`; the backend should require a server-issued confirmation/re-authentication mechanism.
- `forecastTime` is an HTML time value, default `08:00`.
- Uploaded files currently have no client type, size, count, or MIME validation. Backend validation is mandatory.

### 3.3 Enumerations observed

`goalType`: `topic`, `job`  
`assessmentLevel`: `beginner`, `moderate`, `advanced`  
`theme`: `cyber-dark`, `midnight`, `obsidian`, `light`  
`density`: `compact`, `comfortable`  
`defaultLanding`: `gym`, `forecast`, `home`  
`avatarColor`: `cyan`, `purple`, `emerald`, `amber`  
`presence/status`: `online`, `focus`, `idle`  
`roadmap status`: `completed`, `current`, `locked`  
`roadmap node type`: `milestone`, `active`, `practice`  
`evidence status`: `Verified & Certified`  
`test status`: `passed` (other result states are not defined by the frontend)  
`font`: `JetBrains Mono`, `Fira Code`, `Geist Mono`, `ui-monospace`  
`assessment steps`: `About You`, `Your Focus`, `Deadline`, `Proof & Skills`  
`top-level views`: `landing`, `onboarding`, `home`  
`home tabs`: `home`, `forecast`, `gym`, `dashboard`, `profile`, `preferences`, `security`

### 3.4 RBAC and authorization

No executable role guard, protected-route component, permission check, or admin UI was found. `role` appears in comments and roadmap educational content, but no allowed role enum or admin capability is defined. For the backend, implement at minimum resource ownership checks for every user-scoped endpoint, and reserve explicit roles such as `user`, `admin`, and `service` only after product requirements define them. Never infer authorization from `targetRole`, `assessmentLevel`, or client view state.

## 4. Authentication & Security Requirements

### 4.1 Observed auth flow

The intended flow is API-key plus bearer-token authentication. The frontend reads `fitcheck_auth_token` from `localStorage`, sends it as `Authorization: Bearer <token>`, and stores `data.token` after login/register. Logout calls the API and removes the local token. The rendered `AuthModal` currently does not call `authService`; it simulates success and stores no token.

A production implementation should prefer short-lived access tokens in memory plus rotated refresh tokens in `HttpOnly`, `Secure`, `SameSite` cookies. If bearer tokens remain in localStorage, document and mitigate XSS risk. Never treat `VITE_API_KEY` as a secret: Vite exposes it to every browser user. Replace it with a public client identifier or enforce gateway controls, quotas, origin restrictions, and user authentication.

### 4.2 Protected data spaces

Require an active authenticated session for:

- `POST /auth/logout`.
- All onboarding submission and resume parsing operations tied to a user.
- GitHub verification when it creates a user integration record.
- User profile, password, account deletion, and export operations.
- Dashboard metrics, skills, evidence, and intelligence.
- Roadmap track/progress and completion mutations.
- Forecast retrieval and all task/video/material mutations.
- Gym challenges if personalized; repository verification, code submission, and certification.

Public access may be allowed for generic challenge/catalog data or OAuth authorization initiation, but the frontend does not establish a final public/private policy. Enforce ownership on every `:taskId`, `:videoId`, `:materialId`, `dayNumber`, challenge, submission, evidence, and uploaded object lookup.

### 4.3 Security controls

Use TLS, strict CORS, CSRF protection for cookie-authenticated mutations, API-key rotation, request IDs, structured audit logs, rate limiting, brute-force protection, password hashing, token revocation, secret redaction, and dependency timeouts. Validate and sanitize all user text and URLs. Scan uploads for malware, store outside the web root, and use signed URLs. Isolate code execution and repository analysis; prohibit arbitrary network access and credentials in submitted code. Encrypt OAuth/provider tokens and sensitive profile data at rest. Support account deletion/export as privacy operations with auditable completion status.

## 5. Advanced & Real-Time Infrastructure

### 5.1 WebSockets, SSE, and event streams

No executable WebSocket, Socket.IO, SSE, or `EventSource` client was found. `VITE_WS_TELEMETRY_URL=wss://api.fitcheck.app/v1/telemetry` exists only in `.env.example`, and mock roadmap text mentions WebSocket multiplexing/heartbeats. Therefore no frontend-consumed event names or emitted payloads can be specified without guessing.

If telemetry is enabled later, define authentication, connection expiry, heartbeat/reconnect behavior, tenant scoping, and a versioned event envelope before implementation. Candidate product domains mentioned by configuration are readiness, active presence, and live telemetry, but these are not current contracts.

### 5.2 Third-party integrations

Observed or documented integrations:

- GitHub REST API v3 for profile lookup, repository verification, AST scanning, and commit evidence. UI calls are currently simulated except the service wrapper path.
- OAuth provider concepts for GitHub and Google; GitLab is displayed but has no backend contract.
- Gemini/Anthropic document parsing is mentioned for resume parsing only; no active SDK/client is present.
- S3, GCS, or Supabase Storage are mentioned as possible resume/artifact storage; no active upload SDK is present.
- Supabase, Firebase, Auth0, Clerk, and NextAuth are listed as possible auth/database providers in comments only.
- AI/code evaluation credentials and external Hugging Face/vLLM URLs appear in configuration/mock content. Do not expose model/API secrets in the Vite bundle.

Each integration needs server-side credentials, timeouts, retries with backoff, circuit breaking, rate-limit handling, provider response normalization, and auditability.

### 5.3 Intelligence Layer Integration Handover

The intelligence layer is a separate FastAPI service in `apps/intelligence`. It is mounted from `apps/intelligence/src/main.py` and currently exposes EIE/evidence, CIE, RIE, MIE, UPE, and ADE routers. The Node API should act as the authenticated product gateway; the browser should not call internal intelligence engines directly or provide trusted scores.

#### Service ownership

| Layer | Responsibility | Canonical persistence |
|---|---|---|
| Node API | Auth, user ownership, profile/onboarding, frontend-compatible response envelopes, rate limits | `public.users`, onboarding, roadmap/progress, user preferences |
| EIE/evidence routes | Normalize evidence from assessments, GitHub, reports, and submissions | `evidence`, `observations`, `claims`, `evidence_skills` |
| CIE | Map a learner's target to capability requirements, gaps, trajectory, and roadmap | `jobs`, `topics`, `capabilities`, `roadmap`, roadmap stages/missions |
| RIE | Calculate deterministic readiness, priority gaps, trend, and explanation | `capability_evaluations`, readiness/skill projections, audit history |
| MIE | Turn priority gaps into learning experiences, missions, assessments, and resources | courses, lessons, quizzes, missions, tasks, progress |
| UPE | Consume progress signals and calculate progress/streak/velocity events | mission/lesson progress and telemetry projections |
| ADE | Govern adaptations, resolve conflicts, apply cooldowns, request approval, and dispatch decisions | versioned decision/event/audit tables |

#### Required request flow

1. The user authenticates with the Node API. The API resolves `auth.uid()` to `public.users.id` and, where intelligence is enabled, ensures the one-to-one `public.learners` row exists.
2. On onboarding completion, the Node API validates and persists the onboarding, normalized topic/job target, duration, assessment submission, and uploaded evidence references in one transaction.
3. The API publishes a versioned learner event to the intelligence service. The event must contain `event_id`, `event_type`, `producer`, `learner_id`, `occurred_at`, `correlation_id`, optional `causation_id`, and a typed `data` object. Do not send passwords, bearer tokens, or raw provider secrets.
4. EIE evaluates evidence and writes normalized evidence/observation/claim records. CIE resolves the target profile and capability requirements. RIE calculates readiness and gaps. MIE converts prioritized gaps into roadmap/mission candidates.
5. UPE emits progress events after authoritative lesson, task, mission, gym, or evidence changes. Do not emit events from optimistic browser state until the database mutation succeeds.
6. ADE consumes validated events, loads the learner context from Postgres, evaluates rules, resolves competing candidates, applies cooldown/oscillation governance, and creates an immutable decision record.
7. Autonomous ADE decisions are dispatched to the configured executor (`MIE`, `RIE`, `CIE`, or `NONE`). Approval-required decisions remain pending until the Node API records an authenticated user approval.
8. The Node API reads the persisted projections and returns dashboard, forecast, roadmap, and profile responses to the frontend. The frontend never treats an intelligence response as durable until it has been persisted or acknowledged by the API.

#### Current intelligence endpoints

These are the existing FastAPI route contracts. Put them behind internal service authentication and learner ownership checks before production:

- `POST /api/v1/evidence/evaluate`, `/api/v1/evidence/github`, `/api/v1/evidence/report`, and `/api/v1/evidence/assessment`: normalize source evidence and return evaluation results.
- `POST /api/v1/cie/evaluate`: accepts versioned learner state and a selected target; returns relevance, gaps, roadmap, trajectory, progression, alternatives, and grounded narrative.
- `GET /api/v1/cie/targets`: lists controlled career/domain targets.
- `GET /api/v1/cie/targets/:target_id`: returns target capability, learning, experience, and evidence requirements.
- `GET /api/v1/cie/targets/:target_id/roadmap`: returns high-level target roadmap stages.
- `POST /api/v1/readiness/evaluate`: calculates and stores readiness.
- `GET /api/v1/readiness/:learner_id/current` and `GET /api/v1/readiness/:learner_id/history`: return current and historical readiness.
- `POST /api/v1/readiness/handoff/mie`: transfers prioritized readiness gaps to MIE.
- MIE routes under `/api/v1`: project submissions, assessment attempts, learning experiences, and mission/resource operations. Keep the exact route list in the FastAPI OpenAPI document as the source of truth while the API gateway proxies them.
- UPE routes under `/api/v1/progress`: progress event ingestion and progress/current-state reads.
- `POST /api/v1/ade/events` and `/api/v1/ade/evaluate`: trigger ADE evaluation; `GET /api/v1/ade/decisions/:decision_id`, `GET /api/v1/ade/learners/:learner_id/decisions`, and `GET /api/v1/ade/learners/:learner_id/decisions/current` read decision state.
- `POST /api/v1/ade/decisions/:decision_id/approve` and `/reject`: execute governed user decisions. Approval must be authorized by the learner, not merely by possession of a decision ID.

#### Replace in-memory repositories before production

The current intelligence repositories, including `ade/persistence/repository.py`, `rie/repository.py`, `mie/repository.py`, and `upe/repository.py`, contain in-memory caches/stores. Replace them with interfaces backed by Postgres/Supabase transactions:

- `save_decision` must append an immutable decision and update an active-decision projection atomically.
- Event deduplication must use a unique database constraint on `(producer, event_id)` or globally unique `event_id`, not process memory.
- Decision history and readiness history must survive process restarts and multiple service replicas.
- Cooldowns and oscillation counters require durable, concurrency-safe rows or Redis with a database-backed audit record.
- Executor dispatch must use an outbox table and worker retries so a database commit cannot succeed while the handoff is lost.
- Every intelligence write must include `learner_id`, `correlation_id`, source/version metadata, and an idempotency key.

#### Recommended internal event envelope

```json
{
  "event_id": "EVT-UPE-01",
  "event_type": "PROGRESS_EVALUATED",
  "producer": "UPE",
  "learner_id": "learner-uuid",
  "occurred_at": "2026-09-24T12:00:00Z",
  "correlation_id": "request-or-workflow-id",
  "causation_id": null,
  "schema_version": "1.0",
  "data": {
    "overall_progress": 0.35,
    "trend": "DECLINING"
  }
}
```

#### Intelligence-to-frontend data contract

The gateway should expose stable product endpoints rather than leaking internal engine schemas:

- `GET /api/v1/dashboard/metrics` reads authoritative readiness, streak, goal, and velocity projections.
- `GET /api/v1/dashboard/skills` reads capability evaluations and benchmark comparisons.
- `GET /api/v1/dashboard/intelligence` reads the latest CIE/RIE audit and generated signals.
- `GET /api/v1/roadmap/track` reads the persisted roadmap/mission projection generated by CIE/MIE.
- `GET /api/v1/forecast/today` reads the current MIE-generated learning experience and user progress.

The gateway must serialize numeric database values into legacy frontend display shapes where required (`78%`, `12 Days`) while retaining numeric fields for future clients. When no intelligence result exists, return an explicit empty/loading-compatible response; never silently substitute mock intelligence data in production.

#### Reliability and security requirements

Use private service-to-service credentials, mTLS or signed internal JWTs, strict allowlists, request deadlines, retries only for idempotent operations, circuit breakers, and correlation IDs. Validate that every `learner_id` belongs to the authenticated user or authorized internal producer. Apply prompt/output sanitization to generated narratives, retain rule/config/model versions, and expose decision provenance for audit and support. Treat CIE/RIE/MIE/ADE as asynchronous-capable jobs for expensive evaluations; return job status or an accepted event when the work cannot complete within the API deadline.

#### Remaining intelligence-layer requirements before production

The current intelligence implementation is a working engine prototype, not yet a production service. The backend developer must close these gaps before exposing intelligence results as real user data:

1. **Replace every in-memory repository.** `ade/persistence/repository.py`, `rie/repository.py`, `mie/repository.py`, and `upe/repository.py` use process-local stores. Implement Postgres/Supabase repositories behind the same interfaces, with transactions, indexes, optimistic concurrency, and durable history. A restart or second service replica must not lose decisions, readiness, progress, learning experiences, or assessment results.
2. **Complete placeholder validation and state-machine logic.** Several validator/error classes and state-machine exception sections contain placeholder `pass` bodies. Implement event schema validation, learner ownership checks, enum validation, legal decision transitions, expiry checks, and structured error responses before accepting external requests.
3. **Secure all FastAPI routes.** The current routers do not show authentication dependencies. Add internal service authentication and user authorization to every route. Never trust `user_id` or `learner_id` from a request body when it conflicts with the authenticated principal. The gateway must inject or verify the canonical learner identity.
4. **Lock down CORS.** `main.py` currently allows all origins, credentials, methods, and headers. Replace this with an explicit production origin allowlist. The intelligence service should generally be private and callable only by the Node API or trusted workers.
5. **Persist CIG events and handoffs.** Evidence responses currently build CIG events, and MIE builds project/assessment events, but the service boundary must publish them through a durable outbox or message broker. Define retry, dead-letter, deduplication, ordering, and replay behavior. An HTTP response must not claim successful handoff if the event was only created in memory.
6. **Make expensive work asynchronous.** GitHub tree analysis, document/report parsing, LLM evaluation, CIE roadmap generation, and MIE generation can exceed request timeouts. Add job records with `queued`, `running`, `completed`, `failed`, and `cancelled` states; return a job ID for long-running work; and provide authenticated status/result endpoints or callbacks.
7. **Harden external repository analysis.** Validate GitHub URLs against an allowlist, prevent SSRF and redirects to private networks, enforce repository/file/byte limits, honor GitHub rate limits, cache immutable commit results, redact secrets from observations, and never execute repository code during static analysis. Store commit SHA and analyzer version for reproducibility.
8. **Separate deterministic scores from generated explanations.** RIE/UPE/CIE numeric outputs must be reproducible from persisted inputs and versioned formulas. LLM summaries are advisory and must never change readiness, capability level, approval, or access decisions without a deterministic validation step.
9. **Version all contracts and taxonomies.** Persist `schema_version`, `cig_state_version`, `ade_version`, `rule_version`, `configuration_version`, taxonomy version, analyzer version, and model/provider version with every evaluation and decision. Do not silently recalculate historical scores under new rules.
10. **Define transaction boundaries.** Evidence ingestion, observation/claim creation, capability evaluation, and event publication need an explicit transaction/outbox sequence. Roadmap/mission updates must be idempotent and must not be applied twice when a message is retried.
11. **Add operational controls.** Configure timeouts, rate limits per learner/provider, circuit breakers, bounded concurrency, secrets management, encrypted provider credentials, structured logs, metrics, traces, and alerts for failed handoffs, stale jobs, evaluator drift, and queue depth.
12. **Expand integration tests.** Cover cross-engine flows (`EIE -> CIG -> RIE -> MIE -> UPE -> ADE`), duplicate events, concurrent updates, unauthorized learner access, expired approvals, cooldowns, oscillation suppression, provider failures, malformed AI output, GitHub rate limits, and process-restart recovery.

#### Production readiness gate

Do not switch the frontend from mock data to intelligence-backed data until the following are true: all repositories are durable; all routes are authenticated; CORS is restricted; event delivery is durable and idempotent; long-running work is job-based; the database has RLS/ownership enforcement; versioned provenance is stored; and the cross-engine integration tests pass in a multi-process environment.

#### Intelligence additions required in the backend handover

The backend implementation must also define the following before the intelligence layer is considered complete:

1. **Complete engine API catalog:** document every EIE, CIE, RIE, MIE, UPE, and ADE route with exact request bodies, response schemas, authentication requirements, status codes, and error envelopes. FastAPI OpenAPI output should be checked into the API review workflow.
2. **Engine input/output contracts:** document what each engine consumes and produces in the chain `EIE -> CIE -> RIE -> MIE -> UPE -> ADE`, including required fields, schema versions, and ownership of each output.
3. **Database write ownership:** identify the only service allowed to write each intelligence table. Other engines must use commands/events or approved repository interfaces rather than directly mutating another engine's projections.
4. **Event and outbox schema:** add durable event/outbox records with event type, schema version, aggregate/learner ID, correlation and causation IDs, payload, status, retry count, next retry time, and dead-letter reason.
5. **Background-job contract:** define job creation, status polling, result retrieval, cancellation, expiry, and failure behavior for GitHub analysis, report parsing, LLM calls, CIE evaluation, MIE generation, and ADE dispatch.
6. **Internal authentication model:** specify Node-to-intelligence credentials, service roles, token expiry/rotation, mTLS or signed internal JWT validation, and the rule that the gateway owns the user-to-learner mapping.
7. **AI safety boundary:** define prompt-injection defenses, input/output size limits, PII and secret redaction, allowed model providers, model fallbacks, token/cost budgets, and the rule that generated text cannot override deterministic scores or governance.
8. **External provider policy:** document GitHub/API rate limits, caching by commit SHA, timeout and retry rules, repository size limits, webhook or polling strategy, and a prohibition on executing untrusted repository code.
9. **State and concurrency policy:** define optimistic version fields, idempotency keys, transaction boundaries, lock strategy, duplicate-event behavior, and conflict behavior when two evaluations update the same learner concurrently.
10. **Decision audit model:** persist every candidate/winner, rejected candidate reason, rule evaluation, approval action, dispatch attempt, execution result, and provenance version. Historical decisions must remain immutable.
11. **Monitoring and SLOs:** define latency/error targets for synchronous APIs, queue delay targets for jobs, freshness targets for dashboard projections, and alerts for retries, dead letters, stale decisions, provider failures, and score drift.
12. **Disaster recovery:** define replay from the event log/outbox, backup and restore expectations, idempotent rebuild of projections, and behavior after an intelligence service restart or partial outage.
13. **Test matrix:** include unit, contract, security, property-based rule, multi-tenant isolation, concurrency, replay, failure-injection, and end-to-end tests across the full engine chain.

### 5.4 Pagination, filtering, and sorting

No pagination is implemented. No `page`, `limit`, `offset`, cursor, server-side search, sorting, or filter query parameters are present. The only observed query parameters are:

- `dayNumber` on `GET /forecast/today`.
- `trackId` on `GET /roadmap/track`.

Dashboard intelligence tabs and roadmap month views filter already-loaded data locally. For scalability, add cursor pagination and bounded filters before making evidence, telemetry, intelligence signals, or challenge catalogs production-sized; doing so will require a frontend contract update.

## Implementation Gaps and Backend Acceptance Criteria

1. Resolve the dashboard service conflict fragments and decide canonical response envelopes.
2. Connect `AuthModal` to `authService`; remove unconditional mock success before production release.
3. Connect onboarding completion to `submitOnboardingData` and implement real upload binding.
4. Connect profile screens to `profileService`; replace local-only password/delete behavior with authenticated calls.
5. Connect dashboard, forecast, roadmap, and gym components to their service wrappers.
6. Replace local fallback success with visible, typed failure states once the backend is authoritative.
7. Define exact OAuth callback, export, certification, and real-time event contracts, which are currently incomplete.
8. Add contract tests covering all request payloads above, ownership isolation, invalid enum values, replay/idempotency, expired tokens, rate limits, and malformed uploads.
9. Add observability around request IDs, external provider calls, code execution jobs, parser jobs, and score calculation versions.

## Database Initialization Handover

This section is the executable database strategy for the canonical blueprint above. The four migration filenames are ordered and should be applied in numeric order by Supabase CLI or the project's migration runner. These migrations are authoritative where the earlier frontend analysis used provisional names.

### 1. Unified Canonical Schema Naming Conventions

#### 1.1 Naming rules

| Source convention | Canonical PostgreSQL convention | Example |
|---|---|---|
| JavaScript camelCase | lowercase `snake_case` | `targetRole` -> `target_role` |
| PascalCase type/model | lowercase plural table name | `UserProgress` -> `user_progress` |
| Boolean `isX`, `hasX`, `canX` | `is_x`, `has_x`, `can_x` boolean | `isCompleted` -> `is_completed` |
| Client `id` | `uuid` primary key | `id uuid DEFAULT gen_random_uuid()` |
| Client date string | `timestamptz` | `createdAt` -> `created_at` |
| Client percentage string | numeric value | `readiness: '78%'` -> `readiness_pct numeric(5,2)` |
| Client duration string | integer seconds/minutes plus optional display serializer | `duration: '18 min'` -> `duration_minutes integer` |
| Client object/map | `jsonb` only when schema is intentionally variable | `metrics` -> `metrics jsonb` |
| Client list | native PostgreSQL array for scalar homogeneous values | `prerequisites` -> `text[]` |
| Client relationship list | junction table with composite primary key | evidence skills -> `evidence_skills` |
| Client enum string | `text`/`varchar` plus `CHECK`, or a versioned PostgreSQL enum | `status` -> constrained `status text` |

Use singular semantic names for foreign-key columns (`user_id`, `lesson_id`) and plural table names. Use `text` for unrestricted human-authored content and bounded `varchar(n)` only where a real product limit exists. All timestamps are UTC `timestamptz`. All foreign keys must be indexed unless covered by a primary or unique index.

#### 1.2 Canonical frontend-to-database mapping

| Frontend field/model | Canonical column/model | Database representation |
|---|---|---|
| `fullName` | `users.first_name`, `users.last_name` | Split at the API boundary; do not persist a second `full_name` copy. |
| `preferredName` | `users.preferred_name` | `varchar(100)`, trimmed, length 2-100. |
| `targetRole` | `users.target_role` and/or `jobs.name` | `jobs.id` is canonical when selected from catalog; `target_role` is a display/cache field only. |
| `focusTopic` | `topics.id` through `onboarding.topic_id` or `learner_goals.topic_id` | Do not store duplicate free text when a catalog topic exists. |
| `goalType` | `onboarding.mode`, `learner_goals.goal_type` | Canonical values `TOPIC_SPRINT`, `JOB_READY`. |
| `timeline` | `onboarding.duration_days` | API may accept the legacy text, but persist normalized positive days. |
| `streak` | derived telemetry/progress value | Store `streak_days integer`; serialize as `'N Days'` only for legacy UI. |
| `readiness` | derived analytics value | Store `readiness_pct numeric(5,2)`; never accept `'78%'` as authoritative input. |
| `goal` | `goal_pct numeric(5,2)` or goal progress projection | Store numeric value and serialize at the API edge. |
| `sessionStatus` | session/presence projection | Do not use a display status as authentication state. |
| `uploadedFiles` | `user_files`/object storage record | The current blueprint's JSON is a migration-compatible cache only; derive metadata server-side. |
| `dayNumber` | roadmap/mission progress | Use `roadmap_id` plus an ordered stage/mission/task relation; do not rely on a global day number. |
| `isCompleted` | `completed` or `is_completed` | Use `completed` for progress tables and `is_read` for material reads. |
| `assessmentLevel` | assessment/quiz submission | Constrain to `beginner`, `moderate`, `advanced`; compute score server-side. |

### 2. Overlapping Model Deduplication Mapping

#### 2.1 `public.users` versus `public.learners`

`public.users` is the single canonical account and profile identity. It owns authentication-facing data, email, username, names, and user-scoped application records. `public.learners` is a one-to-one intelligence projection that adds an intelligence/external identifier; it is not a second user table and must not duplicate email, username, name, role, or profile fields.

| Data | Canonical source | Learner behavior |
|---|---|---|
| Account UUID | `users.id` | `learners.id` uses the same UUID as a primary-key foreign key. |
| Email, username, names | `users` | Never copy into `learners`. Join through `learners.id = users.id`. |
| Target role/topic/timeline | `users` for display; `jobs`, `topics`, and onboarding/goals for normalized relations | Intelligence reads the normalized goal and catalog IDs. |
| Authentication/session | auth/session tables and `users` mapping | `learners` has no password or token data. |
| Intelligence external identifier | `learners.external_id` | Unique only when present; nullable for users not yet enrolled in intelligence. |
| Learner timestamps | `learners.created_at`, `learners.updated_at` | Maintained independently for projection changes. |

#### 2.2 Foreign-key deletion policy

- `users -> learners`: `ON DELETE CASCADE`; a learner projection has no meaning without its user.
- `users -> private user-owned data`: `ON DELETE CASCADE` for onboarding, goals, roadmaps, progress, observations, claims, evidence, and evaluations, subject to legal retention requirements.
- `users -> externally attributable catalog rows`: never cascade into shared topics, jobs, skills, capabilities, courses, lessons, or quizzes.
- Optional evidence links (`observations.evidence_id`, `capability_evaluations.evidence_id`): `ON DELETE SET NULL`, preserving the observation/evaluation if evidence is redacted.
- Optional catalog links (`onboarding.topic_id`, `onboarding.job_id`, goals, and roadmap job references): `ON DELETE SET NULL`, preserving historical user records when a catalog item is archived.
- Required parent-child learning links (`course_id`, `lesson_id`, `roadmap_id`, `stage_id`, `mission_id`): `ON DELETE CASCADE` where children have no independent meaning.
- Many-to-many junction rows: `ON DELETE CASCADE` from both sides.
- `auth.users -> public.users.auth_user_id`: `ON DELETE SET NULL` if application records must survive auth-provider deletion for compliance workflows; otherwise use a documented account-purge job. Never cascade from an auth-provider deletion directly into shared catalog data.

## 3. Chronological SQL Migration Plan

The following blocks are complete migration files. They assume PostgreSQL/Supabase and the `pgcrypto` extension. Run them in order. The SQL uses constrained `text` values instead of PostgreSQL enum types so future enum additions can be deployed with transactional `CHECK` updates.

### `00001_core_extensions_and_auth.sql`

```sql
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email varchar(320) not null,
  username varchar(64) not null,
  first_name varchar(100),
  last_name varchar(100),
  preferred_name varchar(100),
  target_role varchar(200),
  focus_topic varchar(200),
  timeline varchar(100),
  streak_days integer not null default 0 check (streak_days >= 0),
  day_number integer not null default 1 check (day_number > 0),
  readiness_pct numeric(5,2) not null default 25.00 check (readiness_pct between 0 and 100),
  goal_pct numeric(5,2) not null default 85.00 check (goal_pct between 0 and 100),
  session_status varchar(32) not null default 'Ready',
  github_slug varchar(255),
  uploaded_files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_not_blank check (length(btrim(email)) > 0),
  constraint users_username_format check (username ~ '^[A-Za-z0-9_.-]{2,64}$')
);

create unique index users_email_lower_uidx on public.users (lower(email));
create unique index users_username_lower_uidx on public.users (lower(username));

create table public.learners (
  id uuid primary key references public.users(id) on delete cascade,
  external_id varchar(255) unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger learners_set_updated_at
before update on public.learners
for each row execute function public.set_updated_at();

create index learners_external_id_idx on public.learners (external_id);
```

### `00002_catalog_and_learning_structures.sql`

```sql
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_name_not_blank check (length(btrim(name)) > 0)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_name_not_blank check (length(btrim(name)) > 0)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_name_not_blank check (length(btrim(name)) > 0)
);

create table public.capabilities (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null unique,
  description text,
  domain varchar(100),
  version varchar(50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint capabilities_name_not_blank check (length(btrim(name)) > 0)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  description text,
  difficulty text,
  prerequisites text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_difficulty_check check (difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced'))
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title varchar(255) not null,
  content text,
  video_url text,
  order_idx integer not null default 0 check (order_idx >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, order_idx)
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lessons_course_id_idx on public.lessons (course_id);
create index quizzes_lesson_id_idx on public.quizzes (lesson_id);
```

### `00003_roadmaps_and_progress_tracking.sql`

```sql
create table public.onboarding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  mode varchar(32) not null,
  duration_days integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_mode_check check (mode in ('TOPIC_SPRINT', 'JOB_READY')),
  constraint onboarding_duration_check check (duration_days > 0),
  constraint onboarding_target_check check (
    (mode = 'TOPIC_SPRINT' and topic_id is not null and job_id is null) or
    (mode = 'JOB_READY' and job_id is not null and topic_id is null)
  )
);

create table public.learner_goals (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  goal_type varchar(32) not null,
  status varchar(16) not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_goals_type_check check (goal_type in ('TOPIC_SPRINT', 'JOB_READY')),
  constraint learner_goals_status_check check (status in ('active', 'completed', 'cancelled')),
  constraint learner_goals_target_check check (
    (goal_type = 'TOPIC_SPRINT' and topic_id is not null and job_id is null) or
    (goal_type = 'JOB_READY' and job_id is not null and topic_id is null)
  )
);

create unique index one_active_goal_per_learner_uidx
on public.learner_goals (learner_id) where status = 'active';

create table public.roadmap (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  status varchar(16) not null default 'active',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roadmap_status_check check (status in ('active', 'completed', 'archived')),
  constraint roadmap_version_check check (version > 0)
);

create table public.roadmap_stage (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmap(id) on delete cascade,
  title varchar(255) not null,
  description text,
  stage_order integer not null check (stage_order > 0),
  status varchar(16) not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (roadmap_id, stage_order),
  constraint roadmap_stage_status_check check (status in ('not_started', 'in_progress', 'completed', 'blocked'))
);

create table public.mission (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.roadmap_stage(id) on delete cascade,
  title varchar(255) not null,
  description text,
  status varchar(16) not null default 'not_started',
  mission_order integer not null check (mission_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, mission_order),
  constraint mission_status_check check (status in ('not_started', 'in_progress', 'completed', 'blocked'))
);

create table public.mission_task (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.mission(id) on delete cascade,
  title varchar(255) not null,
  description text,
  task_order integer not null check (task_order > 0),
  status varchar(16) not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, task_order),
  constraint mission_task_status_check check (status in ('not_started', 'in_progress', 'completed', 'blocked'))
);

create table public.mission_progress (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.mission(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  status varchar(16) not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, user_id),
  constraint mission_progress_status_check check (status in ('not_started', 'in_progress', 'completed', 'blocked'))
);

create table public.user_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index learner_goals_learner_id_idx on public.learner_goals (learner_id);
create index roadmap_user_id_idx on public.roadmap (user_id);
create index roadmap_stage_roadmap_id_idx on public.roadmap_stage (roadmap_id);
create index mission_stage_id_idx on public.mission (stage_id);
create index mission_task_mission_id_idx on public.mission_task (mission_id);
create index mission_progress_user_id_idx on public.mission_progress (user_id);
```

### `00004_evidence_and_evaluations.sql`

```sql
create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  title varchar(255),
  description text,
  evidence_type varchar(100) not null,
  source varchar(100),
  source_url text,
  occurred_at timestamptz,
  status varchar(32) not null default 'PENDING',
  source_reference text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_type_not_blank check (length(btrim(evidence_type)) > 0),
  constraint evidence_title_not_blank check (title is null or length(btrim(title)) > 0)
);

create table public.evidence_skills (
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (evidence_id, skill_id)
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  evidence_id uuid references public.evidence(id) on delete set null,
  observation_type varchar(100) not null,
  description text not null,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint observations_type_not_blank check (length(btrim(observation_type)) > 0),
  constraint observations_description_not_blank check (length(btrim(description)) > 0)
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  claim_type varchar(100) not null,
  statement text not null,
  confidence numeric(5,4) not null default 0.0000 check (confidence between 0 and 1),
  status varchar(16) not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint claims_type_not_blank check (length(btrim(claim_type)) > 0),
  constraint claims_statement_not_blank check (length(btrim(statement)) > 0),
  constraint claims_status_check check (status in ('ACTIVE', 'PENDING', 'REJECTED', 'PROVEN', 'ARCHIVED'))
);

create table public.claim_observations (
  claim_id uuid not null references public.claims(id) on delete cascade,
  observation_id uuid not null references public.observations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (claim_id, observation_id)
);

create table public.capability_evaluations (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  capability_id uuid not null references public.capabilities(id) on delete cascade,
  evidence_id uuid references public.evidence(id) on delete set null,
  level integer not null check (level between 0 and 100),
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  evaluation_method varchar(100) not null,
  proficiency numeric(5,4) check (proficiency is null or proficiency between 0 and 1),
  mastery numeric(5,4) check (mastery is null or mastery between 0 and 1),
  evidence_strength numeric(5,4) check (evidence_strength is null or evidence_strength between 0 and 1),
  evaluation_id uuid,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint capability_evaluations_method_not_blank check (length(btrim(evaluation_method)) > 0)
);

create table public.capability_evaluation_claims (
  evaluation_id uuid not null references public.capability_evaluations(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (evaluation_id, claim_id)
);

create table public.evaluation_observations (
  evaluation_id uuid not null references public.capability_evaluations(id) on delete cascade,
  observation_id uuid not null references public.observations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (evaluation_id, observation_id)
);

create table public.evaluation_evidence (
  evaluation_id uuid not null references public.capability_evaluations(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (evaluation_id, evidence_id)
);

create index evidence_learner_id_idx on public.evidence (learner_id);
create index observations_learner_id_idx on public.observations (learner_id);
create index claims_learner_id_idx on public.claims (learner_id);
create index capability_evaluations_learner_id_idx on public.capability_evaluations (learner_id);
create index capability_evaluations_capability_id_idx on public.capability_evaluations (capability_id);
```

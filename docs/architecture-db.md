# Architecture, Shared Libraries, and Database

This document maps the monorepo, the in-house packages (`@devpulse/lib`, `@devpulse/env`), and the PostgreSQL schema as implemented in TypeORM.

---

## 1. Monorepo layout

| Path                         | Role                                                          |
| :--------------------------- | :------------------------------------------------------------ |
| `backend/`                   | NestJS REST API, TypeORM, BullMQ workers                      |
| `packages/web/`              | Next.js dashboard                                             |
| `packages/vscode-extension/` | VS Code telemetry client                                      |
| `packages/lib/`              | `@devpulse/lib` — branded IDs, API contracts, crypto helpers  |
| `packages/env/`              | `@devpulse/env` — Zod-validated env for API / web / extension |
| `packages/eslint-config/`    | Shared ESLint config                                          |

Backend, web, and extension share types through `@devpulse/lib` so a `TypeId<'users'>` cannot be passed where a project ID is expected.

---

## 2. Own libraries

Teacher checklist: **interface, models, non-obvious logic, error handling, configuration / keys**.

### 2.1. `@devpulse/lib` — interface and models

**Branded IDs (`TypeId`).** Prefix map in `packages/lib/src/ids/types.ts`:

| Domain            | Prefix | Example |
| :---------------- | :----- | :------ |
| `users`           | `u`    | `u_…`   |
| `encryption`      | `en`   | `en_…`  |
| `apiKeys`         | `ak`   | `ak_…`  |
| `projects`        | `p`    | `p_…`   |
| `telemetryEvents` | `te`   | `te_…`  |
| `workSessions`    | `ws`   | `ws_…`  |
| `worklogEntries`  | `we`   | `we_…`  |

```ts
export type TypeId<T extends IdTypePrefixes> = `${(typeof idTypes)[T]}_${string}`;
```

`typeIdGenerator('users')` builds a CUID2 payload (`TYPEID_LENGTH = 26`) with the domain prefix. `AppBaseEntity<Prefix>` uses `id: TypeId<Prefix>` as a `varchar(48)` primary key.

**Contracts (interface):**

- `ApiResponse<T>` / `ApiErrorResponse` — success envelope vs `{ success: false, error: { code, message, details? } }` (`api-response.contract.ts`). Used by `TransformInterceptor` and `AllExceptionsFilter`.
- `TelemetryEventDto` — event types the extension may send (`heartbeat`, `git_commit`, `ai_interaction`, …).
- `DashboardStats`, `IntegrationTodayStats` — analytics shapes shared with the web app.

**Non-obvious logic:**

- `stripUrlCredentials` (`git-url.ts`) strips `user:pass@` from remotes before they are stored or shown.
- Login proof (`crypto.ts`): HMAC-SHA256 over a domain-separated message (`DevPulse-v1-login-proof`) using `@noble/hashes` + `tweetnacl` challenges. Not a full Diffie–Hellman; the challenge is a nonce.

**Error handling in the library:** the package defines the **error JSON shape**. HTTP mapping lives in the backend filter (see `docs/maintenance.md`).

### 2.2. `@devpulse/env` — configuration and keys

Zod + `@t3-oss/env-core`. Backend (`packages/env/api.ts`) fails boot if required keys are missing:

| Variable                       | Purpose             |
| :----------------------------- | :------------------ |
| `DATABASE_URL`, `POSTGRES_*`   | PostgreSQL          |
| `REDIS_URL`                    | Redis / BullMQ      |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Access tokens       |
| `CORS_ORIGIN`                  | Allowed web origin  |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email |

LLM keys are **not** in server env: each user stores their OpenRouter / OpenAI / custom key on the `users` row (profile Settings).

---

## 3. Database environment

|                   |                                                                      |
| :---------------- | :------------------------------------------------------------------- |
| **Engine**        | PostgreSQL 16 (`postgres:16-alpine` in `docker-compose.yml`)         |
| **ORM**           | TypeORM on NestJS                                                    |
| **Dev schema**    | `synchronize: true` when `NODE_ENV !== 'production'`                 |
| **Prod schema**   | `migrationsRun: true`; migrations under `backend/src/db/migrations/` |
| **Cache / queue** | Redis 7 (not a second database of record)                            |

Every table extends `AppBaseEntity`: branded `id`, `created_at`, `updated_at` (`timestamptz`).

---

## 4. Tables and ERD

```mermaid
erDiagram
    USERS ||--o{ WORK_SESSIONS : has
    USERS ||--o{ PROJECTS : has
    USERS ||--o{ API_KEYS : has
    USERS ||--|| USER_ENCRYPTION : has
    USERS ||--o{ WORKLOG_ENTRIES : has
    USERS ||--o{ TELEMETRY_EVENTS : has
    PROJECTS ||--o{ WORK_SESSIONS : groups
    WORK_SESSIONS ||--o{ TELEMETRY_EVENTS : contains
    API_KEYS ||--o{ TELEMETRY_EVENTS : authorizes
    PROJECTS ||--o{ TELEMETRY_EVENTS : groups

    USERS {
        varchar id PK
        varchar email UK
        varchar display_name
        boolean is_active
        varchar timezone
        varchar openai_key
        varchar llm_provider
        varchar llm_model
        varchar llm_base_url
        real hourly_rate
        varchar currency
        timestamptz created_at
        timestamptz updated_at
    }

    USER_ENCRYPTION {
        varchar id PK
        varchar userId FK
        text clientPublicKey
        text serverPrivateKey
        text salt
        text verifier
        text publicKey
        text encryptedPrivateKey
        text iv
        text tag
        text protectedKey
        text protectedKeyIV
        text protectedKeyTag
        timestamptz created_at
        timestamptz updated_at
    }

    API_KEYS {
        varchar id PK
        varchar name
        varchar key_hash
        varchar key_prefix
        timestamptz last_used_at
        varchar device_label
        text_array scopes
        varchar user_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    PROJECTS {
        varchar id PK
        text git_remote_url
        varchar name
        varchar user_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    WORK_SESSIONS {
        varchar id PK
        enum status
        varchar git_branch
        timestamptz started_at
        timestamptz ended_at
        int active_seconds
        int idle_seconds
        decimal focus_score
        decimal earned_money
        varchar primary_language
        jsonb language_seconds
        varchar current_language
        varchar machine_id
        int commands_run
        int failed_commands
        jsonb terminal_commands
        int commits_count
        jsonb commits
        boolean ai_assisted
        int ai_interactions_count
        varchar user_id FK
        varchar project_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    TELEMETRY_EVENTS {
        varchar id PK
        varchar git_branch
        timestamptz event_timestamp
        int active_seconds
        int idle_seconds
        jsonb files_changed
        jsonb file_extensions
        varchar machine_id
        varchar vscode_session_id
        varchar command
        varchar command_cwd
        int exit_code
        varchar task_name
        varchar task_source
        varchar commit_hash
        varchar commit_message
        int insertions
        int deletions
        varchar user_id FK
        varchar api_key_id FK
        varchar project_id FK
        varchar session_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    WORKLOG_ENTRIES {
        varchar id PK
        date date
        varchar format
        varchar language
        char facts_hash
        text text
        varchar model
        varchar user_id FK
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 5. Models (what each table is for)

### `users`

Account, timezone (daily analytics), hourly rate / currency (earnings), LLM provider fields (`llm_provider`, `llm_model`, `llm_base_url`, `openai_key`). Email is unique.

### `user_encryption` (1:1)

SRP salt/verifier and wrapped keys (`clientPublicKey`, `serverPrivateKey`, `publicKey`, `encryptedPrivateKey`, `iv`, `tag`, `protectedKey`, `protectedKeyIV`, `protectedKeyTag`). Separate table so profile queries do not load crypto material.

### `api_keys`

Key metadata (`name`, `key_prefix`, `device_label`, `last_used_at`). `key_hash` is unique and `select: false` (never loaded by default). `scopes` is a PostgreSQL `text[]` (`telemetry:write` / `analytics:read`).

### `projects`

Git remotes per user (`git_remote_url`, `name`). Unique constraint on `[gitRemoteUrl, userId]`.

### `work_sessions`

Aggregated work blocks: time (`active_seconds`, `idle_seconds`), `focus_score`, `earned_money`, git branch, languages (`JSONB`), terminal commands (`JSONB`), commits (`JSONB`), AI flags (`ai_assisted`, `ai_interactions_count`). Status enum: `active` | `closed`.

### `telemetry_events`

Raw extension events for audit and re-aggregation: branch, active/idle seconds, changed files and extensions, terminal command (`command`, `command_cwd`, `exit_code`), task, commit data (`commit_hash`, `commit_message`, `insertions`, `deletions`).

### `worklog_entries`

Cached AI worklog text and the model that produced it (`model`). Unique on `[userId, date, format, language]`. `facts_hash` invalidates the cache when session facts change.

---

## 6. Relations and FK actions

| Relation                     | Cardinality | `onDelete` |
| :--------------------------- | :---------- | :--------- |
| User → Project               | 1:N         | `CASCADE`  |
| User → ApiKey                | 1:N         | `CASCADE`  |
| User → WorkSession           | 1:N         | `CASCADE`  |
| User → UserEncryption        | 1:1         | `CASCADE`  |
| User → WorklogEntry          | 1:N         | `CASCADE`  |
| User → TelemetryEvent        | 1:N         | `CASCADE`  |
| Project → WorkSession        | 1:N         | `SET NULL` |
| WorkSession → TelemetryEvent | 1:N         | `CASCADE`  |
| ApiKey → TelemetryEvent      | 1:N         | `SET NULL` |
| Project → TelemetryEvent     | 1:N         | `SET NULL` |

Deleting a user removes projects, keys, sessions, events, encryption, and worklogs. Deleting a project keeps sessions with `project_id = NULL`.

---

## 7. Indexes

Declared with TypeORM `@Index`:

| Table              | Index                                                                          |
| :----------------- | :----------------------------------------------------------------------------- |
| `work_sessions`    | `[userId, startedAt]`, `[userId, gitBranch, status]`, `[projectId, gitBranch]` |
| `telemetry_events` | `[userId, eventTimestamp]`, `[projectId, gitBranch, eventTimestamp]`           |

These match dashboard filters (user + time range, branch, project).

---

## 8. Procedures, functions, triggers

**None in PostgreSQL.** Aggregation (`focus_score`, session grouping) runs in `TelemetryWorker` (NestJS + BullMQ). Easier to test and version than PL/pgSQL.

Integrity comes from:

- Foreign keys (`CASCADE` / `SET NULL`)
- Unique constraints (`users.email`, `projects(gitRemoteUrl, userId)`, `worklog_entries(userId, date, format, language)`, `api_keys.key_hash`)
- Application validation (`class-validator` + global `ValidationPipe`) before insert

---

## 9. Scaling and sharding

Current shape: **one PostgreSQL primary**, **stateless API**, **Redis** for BullMQ (`telemetry-ingestion` queue, 3 attempts, exponential backoff) and auth/rate-limit support.

| Technique        | Status                                                                                                                                                                                         |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vertical scale   | Increase CPU/RAM on the API and Postgres host                                                                                                                                                  |
| Horizontal scale | Run more NestJS processes behind a load balancer (JWT in cookie/header, no sticky sessions required)                                                                                           |
| Queue offload    | Telemetry ingest is async; the HTTP handler only enqueues                                                                                                                                      |
| Read replicas    | Not deployed; analytics are user-scoped `SELECT`s on indexed columns — replicas are the next step                                                                                              |
| Sharding         | **Not used.** All rows are already keyed by `user_id` (`TypeId<'users'>`), so a later hash-shard by user is possible without rewriting IDs. JSONB avoids extra tables for command/commit lists |

Redis is **not** sharded; one instance is enough for the queue size of a single-team deployment.

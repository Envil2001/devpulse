# Product Maintenance, SemVer, and Scaling

Stage 4: **semantic versioning**, **backward compatibility**, **error handling** (backlog, SLA, observability), **performance**, and **scaling** (Redis, vertical / horizontal).

---

## 1. Semantic versioning (SemVer `X.Y.Z`)

Current packages ship as **`0.0.1`** (`devpulse`, `backend`, `@devpulse/lib`, `@devpulse/env`, VS Code extension). While major is `0`, the public HTTP contract is still treated as **API v1** (`/api/v1` URI versioning in `main.ts`).

| Bump | When |
| :--- | :--- |
| **Z (patch)** | Bug fixes, query/index tweaks, no contract change |
| **Y (minor)** | New endpoints or optional JSON fields; old clients keep working |
| **X (major)** | Breaking JSON, removed routes, or a new URI version (`/api/v2`) |

VS Code extension follows the same `X.Y.Z` in `packages/vscode-extension/package.json`. A breaking telemetry DTO change is a **major** (or a new event `type` that old servers ignore).

**Backward compatibility rules in force today:**

- Global prefix + `VersioningType.URI` default `'1'` — existing clients stay on `/api/v1`.  
- `TypeId` prefixes are stable (`u_`, `ws_`, …); do not reuse prefixes.  
- Telemetry ingest is additive: unknown fields are stripped by `ValidationPipe` (`whitelist`); new optional event types can be added on `TelemetryEventDto`.  
- Integration surface is documented separately (`/api/v1/docs-json` only lists `/integrations/`).

---

## 2. Error handling

### 2.1. In the application

`AllExceptionsFilter` (`backend/src/common/filters/all-exceptions.filter.ts`) catches every exception:

- Maps `HttpException` to `{ success: false, error: { code, message, details? }, timestamp, path }` (`ApiErrorResponse` from `@devpulse/lib`).  
- Validation arrays become `message: "Validation failed"` plus `details`.  
- Unknown errors become **500** with message `Internal server error` (no stack in the body).  
- Status ≥ 500 is written to the Nest **Logger** with stack.

Success paths use `TransformInterceptor` (`success: true`, `data`, `timestamp`, `path`). CSV export is a `StreamableFile` and is not wrapped.

Auth and ingest are additionally limited: `AuthThrottle` (5 / 60s), `TelemetryThrottle` (60 / 60s), plus global `ThrottlerGuard` (10/s burst, 200/min sustained).

### 2.2. Backlog and SLA (operations)

| Item | Practice |
| :--- | :--- |
| **Backlog** | Defects as GitHub issues on this repo; severity: S1 API down / data loss, S2 ingest broken, S3 dashboard bugs, S4 cosmetic |
| **SLA (pilot)** | S1: acknowledge 4 h, mitigate 1 business day. S2: 1 business day. No 24/7 on-call unless contracted |
| **Sentry** | **Not wired yet.** 5xx go to process logs (`AllExceptionsFilter`). Next maintenance step is a Sentry DSN in `@devpulse/env` and `Sentry.captureException` in the filter for status ≥ 500 — same JSON contract, extra alerting |

---

## 3. Performance

| Layer | What exists | How to inspect |
| :---- | :---------- | :------------- |
| **API** | Stateless Nest handlers; telemetry `POST` only enqueues (`TelemetryQueue.addEventsJob`) | `LoggingInterceptor`; time `POST /telemetry/events/batch` vs worker lag |
| **SQL** | Composite indexes on `work_sessions` and `telemetry_events` (user + time / branch / project) | `EXPLAIN ANALYZE` on dashboard range queries |
| **RPS** | Throttler limits above; ingest 60 batches/min/key | Burst test should hit 429, not Postgres |
| **JSON** | `language_seconds`, `terminal_commands`, `commits` as JSONB — no extra joins for session detail | Avoid unbounded `GET /telemetry/sessions` (`limit` capped at 100) |

Acceptance target from `docs/acceptance.md`: API response **&lt; 200 ms** for typical dashboard reads on indexed paths (not for LLM worklog generation).

---

## 4. Servicing and scaling

### 4.1. Redis and BullMQ (offload Postgres)

Redis is the **queue and ephemeral cache**, not the analytics store.

- Queue name: `telemetry-ingestion`.  
- Job: `{ userId, events }`, **3 attempts**, exponential backoff (1s+), `removeOnComplete`.  
- Worker: `TelemetryWorker` in the API process — aggregates into `work_sessions` / `telemetry_events`.  
- Auth/session helpers also use `RedisService`.

Effect: ingest spikes become queue depth, not row-lock storms on `work_sessions`.

### 4.2. Vertical vs horizontal

| Direction | Apply to |
| :-------- | :------- |
| **Vertical** | Larger VM for Postgres (memory for indexes, disk for `telemetry_events`) and for a single API node if worker CPU is the bottleneck |
| **Horizontal** | Multiple NestJS processes behind a reverse proxy. JWT is in cookie/header; no sticky sessions. **Constraint:** each process currently starts a `TelemetryWorker` — for more than one API replica, run **one** worker replica or give BullMQ a dedicated worker process so jobs are not double-processed carelessly (BullMQ supports competing consumers; verify worker concurrency before scaling API copies) |
| **Web** | Next.js can scale independently (`pnpm start` replicas); it only calls `/api/v1` |
| **Postgres** | One primary now; read replicas later for `/analytics/*` if SELECT load grows |
| **Sharding** | Not in use; see `docs/architecture-db.md` §9 (`user_id` is the natural shard key) |

### 4.3. Routine service tasks

- Watch Docker health (`pg_isready`, `redis-cli ping`) and disk on `data/postgres`.  
- Apply migrations on release (`NODE_ENV=production` → `migrationsRun`).  
- Rotate `JWT_SECRET` / Resend keys as secrets hygiene (forces re-login).  
- Confirm CI still runs on every PR to `dev` (`docs/deployment.md` §3).

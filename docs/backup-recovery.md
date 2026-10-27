# Backups and System Recovery

Stage 3 checklist: **who owns backups**, **type / interval / retention / storage** (RODO/GDPR, ISO 27001), and **how to rebuild from zero** (env, cache, database, backend, frontend, start order).

---

## 1. Who is responsible

| Scenario | Owner | What they do |
| :------- | :---- | :----------- |
| **Application** | DevPulse backend | Does **not** dump Postgres itself. Relies on `pg_dump` / host snapshots and Redis RDB. The app only writes durable state to PostgreSQL. |
| **System owner (on-premise)** | Customer IT | Runs the dump script, stores media, tests restores. Contractor delivers this procedure. |
| **Infrastructure / cloud** | Hosting (e.g. managed Postgres) | Automated snapshots. Operator verifies restore drills, not “the app made a backup”. |

Personal laptops are **not** the system of record. If a developer loses a machine, sessions already ingested live in PostgreSQL. Lost only: local unsent event buffer (bounded in the extension) and the device API key (recreate in Settings → API Keys).

---

## 2. Backup attributes

### 2.1. PostgreSQL (system of record)

| Attribute | Policy |
| :-------- | :----- |
| **Type** | Full logical dump (`pg_dump`, custom or SQL format). Incremental WAL archiving is optional on managed Postgres (PITR); the baseline requirement is a **daily full** dump. |
| **Interval** | Daily at 03:00 (server timezone). |
| **Retention** | 30 days of daily dumps. |
| **Storage** | Encrypted object storage or SFTP **outside** the API host (separate account). Access limited to operators. |
| **Contents** | All relations: `users`, `user_encryption`, `api_keys`, `projects`, `work_sessions`, `telemetry_events`, `worklog_entries`. |

Example (owner-run):

```bash
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  > "devpulse-$(date -u +%Y%m%d).dump"
```

### 2.2. Redis (queue / cache — not the archive)

| Attribute | Policy |
| :-------- | :----- |
| **Type** | RDB snapshot (Compose volume `./data/redis`). |
| **Interval** | Redis default + volume backup with the host (at least daily). |
| **On failure** | At most the last minutes of **unprocessed** BullMQ jobs. Source events are already in Postgres once the worker commits; in-flight batches may be retried (queue `attempts: 3`). |

JWT cookies are short-lived; they are **not** backed up. After restore, users sign in again.

### 2.3. Configuration

`.env` and TLS private keys are backed up in a **secrets** store (not in Git, not in the Postgres dump). `JWT_SECRET` rotation invalidates sessions (see recovery).

---

## 3. RODO / GDPR and ISO 27001 alignment

Telemetry is **activity metadata**, not source-file contents (see `packages/vscode-extension/PRIVACY.md`). Backup policy follows the same principles:

| Control | How |
| :------ | :-- |
| **Lawful processing / minimisation** | Dumps contain only tables the product already stores; no extra PII collectors. |
| **Storage limitation** | 30-day dump retention unless a longer legal hold is agreed in writing. |
| **Integrity / confidentiality (ISO 27001 A.8 / A.12 class)** | Encrypted transport and at-rest storage; separate backup account; restore tests. |
| **Erasure** | User delete uses FK `ON DELETE CASCADE` (sessions, events, keys, worklogs, encryption). After deletion, the next **full** dump no longer contains that user; older dumps stay until retention expires. |
| **Access** | Backup media is operator-only; API keys in the dump are hashes (`key_hash`, `select: false` at query time). |
| **Location** | Store backups in the same region as production if the customer requires EEA residency. |

LLM API keys on `users.openai_key` are customer secrets — treat dumps as **confidential**.

---

## 4. RPO / RTO targets

| Metric | Target | Meaning |
| :----- | :----- | :------ |
| **RPO** | ≤ 24 h (daily full dump) | Maximum data loss = work since last dump (plus any unqueued Redis jobs). |
| **RTO** | ≤ 4 h for a single-VM restore | Time to empty host → healthy API + web after a total loss of the original machine. |

Tighten RPO with managed PITR if the customer requires it.

---

## 5. Restoring the system from zero

### 5.1. Prepare a clean environment

1. New host with Docker, Node 20+, pnpm 9.14.2, Git.  
2. Clone the release tag / `dev` commit that matches the dump schema.  
3. `cp .env.example .env` and restore secrets (`JWT_SECRET` **must** match the dump if you need existing cookies; otherwise users re-login).  
4. `pnpm install && pnpm build`.

### 5.2. Clear cache and sessions

```bash
docker compose down
# optional: wipe local volumes if the host is dirty
rm -rf data/postgres data/redis
docker compose up -d db redis
```

- Redis empty = empty BullMQ; no stale jobs.  
- Old JWT cookies are invalid if `JWT_SECRET` changed.

### 5.3. Check and restore the database

Wait until `docker compose ps` shows `db` healthy (`pg_isready`).

```bash
# empty database created by Compose from POSTGRES_DB
docker compose exec -T db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
  < devpulse-YYYYMMDD.dump
```

Sanity checks:

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM work_sessions;
SELECT COUNT(*) FROM telemetry_events;
```

If you restore onto a schema created by `synchronize`/`migrations`, `--clean` drops objects first. Prefer restore onto the Compose-created empty DB, then let the API run with `NODE_ENV=production` so pending migrations (if any) apply.

### 5.4. Backend and frontend

```bash
cd backend && NODE_ENV=production pnpm start:prod
cd packages/web && pnpm start
```

Confirm `GET /api/v1/auth/me` after login and the dashboard at port 3001.

### 5.5. Microservice / process start order

DevPulse is a **modular monolith**, not many independent deployables. Process order:

1. **PostgreSQL**  
2. **Redis**  
3. **NestJS API** (includes `TelemetryWorker` in-process; it will drain the queue)  
4. **Next.js web**  
5. **VS Code extensions** on developer machines (they only need a reachable API + a valid API key)

Do not start the API before Postgres is healthy. Do not start workers-only: the worker is part of the API process.

### 5.6. After restore

- Ask users to sign in again if cookies were dropped.  
- Recreate extension API keys only if `api_keys` was not in the dump.  
- Drop a test telemetry batch and confirm a new `work_sessions` row.

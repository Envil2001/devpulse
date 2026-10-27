# Deployment, Docker, and CI/CD

How DevPulse is installed (technical prerequisites, Docker, VS Code distribution), how versions are built (PR → build → review → merge), and what the client must prepare. Business conditions (data migration, downtime) are included for Stage 3.

---

## 1. Technical prerequisites

| Requirement | Detail |
| :---------- | :----- |
| Compute | Host or VPS that can run Node.js 20+ (API + Next.js) plus Docker for Postgres 16 and Redis 7 |
| Network | Domain (e.g. `app.devpulse.example`) and TLS |
| Secrets | `.env` as in `docs/setup.md` (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `RESEND_*`) |
| Optional SaaS | Resend (email), OpenRouter/OpenAI (per-user LLM keys) |
| Client devices | VS Code ≥ 1.93.0 and a modern browser |

Hosting (VPS vs PaaS) is chosen at go-live: contractor-managed SaaS or customer on-premise. The **compose file and CI workflow are in the repo today**; a production `Dockerfile` for the Node apps is **not** in the tree yet — production run is `pnpm build` + `pnpm start:prod` / `pnpm start` (see `docs/setup.md` §6).

---

## 2. Installation process

### 2.1. Infrastructure with Docker

`docker-compose.yml` starts the data plane only:

| Service | Image | Port | Volume |
| :------ | :---- | :--- | :----- |
| `db` | `postgres:16-alpine` | 5432 | `./data/postgres` |
| `redis` | `redis:7-alpine` | 6379 | `./data/redis` |

Healthchecks: `pg_isready`, `redis-cli ping`.

```bash
cp .env.example .env   # fill secrets
docker compose up -d
cd backend && pnpm migration:run   # prod: also applied on boot (migrationsRun)
```

### 2.2. Application processes (script)

```bash
pnpm install
pnpm build
# API
cd backend && pnpm start:prod
# Web (other process / reverse proxy)
cd packages/web && pnpm start
```

Reverse-proxy TLS to API `:3000` and web `:3001`. CORS must list the public web origin (`CORS_ORIGIN`).

### 2.3. VS Code extension (stores)

| Channel | How |
| :------ | :-- |
| **Marketplace** | Publish after `package.json`, `README.md`, `PRIVACY.md` pass store review |
| **Internal / air-gapped** | `cd packages/vscode-extension && pnpm compile && pnpm vsce package --no-dependencies` → install `devpulse-0.0.1.vsix` via **Extensions: Install from VSIX...** |

Pilot groups typically use the `.vsix` path.

---

## 3. Version build process (PR → build → review → merge)

Workflow file: `.github/workflows/ci-cd.yml` (job name `CI`).

**Triggers:** `push` to `dev`, `pull_request` targeting `dev`.

```
open PR against `dev`
        → GitHub Actions `validate`
              1. checkout
              2. pnpm 9.14.2 + Node 24
              3. pnpm install --frozen-lockfile
              4. pnpm build          (NEXT_PUBLIC_API_URL set)
              5. pnpm typecheck
              6. pnpm lint
              7. pnpm --filter backend test
        → human review
        → merge to `dev`
```

Tests run with dummy `RESEND_API_KEY` / `JWT_SECRET` (see the workflow `env:` block). There is **no deploy job** in this workflow: merge does not push to production automatically. Production is a manual/scripted start of the built artifacts after review.

Local equivalent before opening a PR:

```bash
pnpm build
pnpm typecheck
pnpm lint
cd backend && pnpm test
```

---

## 4. Business conditions

### 4.1. Data migration

Greenfield product. **No import from a previous time-tracker is required.** Collection starts when developers install the extension and create API keys.

### 4.2. Client preparation

- DNS + TLS for the dashboard and API
- List of pilot developers (VS Code version check)
- Decision: Marketplace vs internal `.vsix`
- Users who want AI worklogs add **their own** LLM key in Settings (no shared company key)

### 4.3. Downtime

No store-close or sales freeze. First boot applies TypeORM migrations in seconds. BullMQ processes telemetry in the background and does not block HTTP.

### 4.4. Rollout

1. **Pilot:** 5–10 developers, `.vsix`, watch Postgres/Redis and API latency.  
2. **Full:** remaining team after the pilot.

---

## 5. Runtime order (production)

Start in this order (same as recovery — see `docs/backup-recovery.md`):

1. PostgreSQL (`docker compose up -d db`) — wait for healthy  
2. Redis (`docker compose up -d redis`) — wait for healthy  
3. NestJS API (`pnpm start:prod`) — runs migrations when `NODE_ENV=production`  
4. Next.js (`pnpm start`)  
5. Extension on developer machines (API already reachable)

# API Specification and Contract Map

## 1. Overview and authentication

The backend is a REST JSON API. Global prefix is `api` with URI versioning (`defaultVersion: 1`), so every controller route below is served at **`/api/v1/...`**.

Clients:

1. **Web dashboard (Next.js):** JWT (`JwtAuthGuard`). Token is sent as `Authorization: Bearer` **or** cookie `access_token`.
2. **VS Code extension:** API key header `X-API-Key` (`ApiKeyGuard` + `ScopesGuard`). Extension keys have scope `telemetry:write`.
3. **External integrations:** same API key header. Integration keys have scope `analytics:read`.

JSON responses (except CSV export) are wrapped by `TransformInterceptor`:

```json
{ "success": true, "data": { }, "timestamp": "...", "path": "..." }
```

Validation: global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`). IDs use branded types from `@devpulse/lib` (`TypeId<'users'>`, `TypeId<'projects'>`, `TypeId<'apiKeys'>`, …).

OpenAPI (local):

| What | URL |
| :--- | :-- |
| Full schema UI | `http://localhost:3000/api/v1/dev-docs` |
| Full schema JSON | `http://localhost:3000/api/v1/dev-docs-json` |
| Public integrations schema JSON | `http://localhost:3000/api/v1/docs-json` |

---

## 2. Endpoint inventory

Routes in tables are relative to `/api/v1`.

### A. Authentication (`AuthController`, `/auth`)

SRP signup/login. Auth endpoints (except `GET /auth/me`) are rate-limited (`AuthThrottle`). `POST /auth/logout` has no JWT guard.

| Method | Route | Request | Response | Guards | Description |
| :----- | :---- | :------ | :------- | :----- | :---------- |
| `POST` | `/auth/signup/begin` | `BeginSignupRequestDto` | `MessageResponseDto` | — | Start signup; send email verification code. |
| `POST` | `/auth/signup/verify` | `VerifySignUpRequestDto` | `VerifySignUpResponseDto` | — | Verify signup code. |
| `POST` | `/auth/signup/complete` | `CompleteSignupRequestDto` + `Authorization: Bearer` (signup token) | `SignUpCompleteResponseDto` | — | Finish signup; set `access_token` cookie. |
| `POST` | `/auth/signin/begin` | `LoginBeginRequestDto` | `LoginBeginResult` | — | SRP login step 1 (salt / server key). |
| `POST` | `/auth/signin/verify` | `LoginVerifyRequestDto` | `LoginVerifyResponseDto` | — | SRP login step 2; set cookie; return `accessToken`. |
| `GET` | `/auth/me` | — | `UserResponseDto` | `JwtAuthGuard` | Current user profile (incl. LLM settings). |
| `POST` | `/auth/logout` | — | `MessageResponseDto` | — | Clear cookies. |

### B. Users (`UsersController`, `/users`)

| Method | Route | Request | Response | Guards | Description |
| :----- | :---- | :------ | :------- | :----- | :---------- |
| `PATCH` | `/users/me` | `UpdateUserRequestDto` | `UserResponseDto` | `JwtAuthGuard` | Update profile (timezone, hourly rate, LLM provider / key / model / base URL). |

### C. API keys (`ApiKeysController`, `/api-keys`)

| Method | Route | Request | Response | Guards | Description |
| :----- | :---- | :------ | :------- | :----- | :---------- |
| `POST` | `/api-keys` | `CreateApiKeyRequestDto` | `CreateApiKeyResponseDto` | `JwtAuthGuard` | Create key; `rawKey` is returned once. Types: `extension` (`telemetry:write`) or `integration` (`analytics:read`). |
| `GET` | `/api-keys` | — | `ApiKeyResponseDto[]` | `JwtAuthGuard` | List the current user’s keys. |
| `DELETE` | `/api-keys/:id` | Path: `id` (`TypeId<'apiKeys'>`) | `MessageResponseDto` | `JwtAuthGuard` | Revoke a key. |

### D. Projects (`ProjectsController`, `/projects`)

| Method | Route | Request | Response | Guards | Description |
| :----- | :---- | :------ | :------- | :----- | :---------- |
| `GET` | `/projects` | — | `ProjectSummaryDto[]` | `JwtAuthGuard` | User projects with aggregated metrics. |
| `GET` | `/projects/:id` | Path: `id` (`TypeId<'projects'>`) | `ProjectSummaryDto` | `JwtAuthGuard` | Single project (languages, recent sessions). |

### E. Telemetry (`TelemetryController`, `/telemetry`)

Hybrid auth: ingestion and “today” for the extension; session history for the web app. Batch ingest is rate-limited (`TelemetryThrottle`).

| Method | Route | Request | Response | Guards | Description |
| :----- | :---- | :------ | :------- | :----- | :---------- |
| `POST` | `/telemetry/events/batch` | `IngestTelemetryBatchRequestDto` | `IngestTelemetryBatchResponseDto` | `ApiKeyGuard`, `ScopesGuard` (`telemetry:write`) | Queue a batch of extension events on BullMQ. |
| `GET` | `/telemetry/today` | — | `GetIntegrationTodayResponseDto` | `ApiKeyGuard`, `ScopesGuard` (`telemetry:write`) | Today’s stats for the VS Code status bar. |
| `GET` | `/telemetry/sessions` | Query: `limit?`, `projectId?` | `WorkSessionSummaryDto[]` | `JwtAuthGuard` | Work session list for the dashboard. |
| `GET` | `/telemetry/sessions/:id` | Path: `id` | `WorkSessionDetailDto` | `JwtAuthGuard` | Session detail (commands, commits, focus). |

### F. Analytics dashboard (`AnalyticsController`, `/analytics`)

JWT only. Range query: `GetAnalyticsRangeRequestDto` (`startDate?`, `endDate?`, `projectId?`). `GET /analytics/status` has no range query.

| Method | Route | Request | Response | Guards | Description |
| :----- | :---- | :------ | :------- | :----- | :---------- |
| `GET` | `/analytics/dashboard` | Query: `GetAnalyticsRangeRequestDto` | `GetAnalyticsDashboardResponseDto` | `JwtAuthGuard` | High-level dashboard stats. |
| `GET` | `/analytics/timeseries` | Query: `GetAnalyticsRangeRequestDto` | `GetAnalyticsTimeseriesResponseDto` | `JwtAuthGuard` | Activity time series. |
| `GET` | `/analytics/branches` | Query: `GetAnalyticsRangeRequestDto` | `GetAnalyticsBranchesResponseDto` | `JwtAuthGuard` | Time per Git branch. |
| `GET` | `/analytics/status` | — | `GetIntegrationStatusResponseDto` | `JwtAuthGuard` | Live coding heartbeat. |
| `GET` | `/analytics/languages` | Query: `GetAnalyticsRangeRequestDto` | `GetIntegrationLanguagesResponseDto` | `JwtAuthGuard` | Language breakdown. |
| `GET` | `/analytics/commands` | Query: `GetAnalyticsRangeRequestDto` | `GetAnalyticsCommandsResponseDto` | `JwtAuthGuard` | Terminal command frequency / failures. |
| `GET` | `/analytics/export` | Query: `GetAnalyticsRangeRequestDto` | CSV (`text/csv`, not JSON envelope) | `JwtAuthGuard` | Download sessions as CSV. |
| `GET` | `/analytics/ai-roi` | Query: `GetAnalyticsRangeRequestDto` | `GetIntegrationAiRoiResponseDto` | `JwtAuthGuard` | AI speedup and estimated ROI. |

### G. Integrations analytics (`IntegrationsAnalyticsController`, `/integrations/analytics`)

Controller-level `ApiKeyGuard` + `ScopesGuard`. Every route requires `analytics:read`. This is the public integration surface (also what `/api/v1/docs-json` exposes).

| Method | Route | Request | Response | Guards | Description |
| :----- | :---- | :------ | :------- | :----- | :---------- |
| `GET` | `/integrations/analytics/ping` | — | `{ success, message, userId }` | API key `analytics:read` | Verify key and scopes. |
| `GET` | `/integrations/analytics/today` | — | `GetIntegrationTodayResponseDto` | API key `analytics:read` | Today’s metrics (user timezone). |
| `GET` | `/integrations/analytics/sessions` | Query: `limit?` | `GetIntegrationSessionItemDto[]` | API key `analytics:read` | Recent work sessions. |
| `GET` | `/integrations/analytics/status` | — | `GetIntegrationStatusResponseDto` | API key `analytics:read` | Live coding status. |
| `GET` | `/integrations/analytics/languages` | — | `GetIntegrationLanguagesResponseDto` | API key `analytics:read` | Language breakdown. |
| `GET` | `/integrations/analytics/projects` | — | `ProjectSummaryDto[]` | API key `analytics:read` | Time per project. |

### H. Worklog (`WorklogController`, `/worklog`)

| Method | Route | Request | Response | Guards | Description |
| :----- | :---- | :------ | :------- | :----- | :---------- |
| `GET` | `/worklog/plan` | Query: `WorklogPlanQueryDto` (`startDate`, `endDate`, `YYYY-MM-DD`) | `WorklogPlan` | `JwtAuthGuard` | Days with activity and LLM quota; no LLM call. |
| `POST` | `/worklog/day` | `GenerateDayDto` (`date`, `format`, `language`, `force?`) | `WorklogDayResult` | `JwtAuthGuard` | Generate or return cached daily worklog (OpenRouter / OpenAI / custom e.g. Ollama). |

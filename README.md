# devpulse
An automated time-tracking and workflow analytics platform for developers, built with NestJS, Next.js, and VS Code Extension API.

## Analytics and AI ROI

The dashboard includes an **AI Assistance & ROI** panel. It compares sessions with
AI assistance against manual coding sessions for the selected date range and project.
AI-assisted sessions are detected from telemetry that contains an AI tool or AI
interactions, such as Copilot, Claude, or Aider.

The panel shows:

- number of AI-assisted and manual sessions;
- total detected AI interactions;
- code velocity for AI-assisted and manual sessions, measured in lines per active hour;
- relative speedup percentage;
- estimated hours saved compared with the manual-session velocity.

The metrics are estimates based on recorded telemetry and commit statistics. They
should be used for productivity trends, not as an exact measure of generated code
or financial savings. If the selected period has no AI activity, the panel displays
an empty state instead of calculated metrics.

### AI ROI API

Authenticated clients can request the same metrics through:

```text
GET /api/v1/analytics/ai-roi
```

Optional query parameters:

| Parameter | Format | Description |
| --- | --- | --- |
| `startDate` | ISO 8601 datetime | Include sessions starting at or after this date |
| `endDate` | ISO 8601 datetime | Include sessions starting at or before this date |
| `projectId` | string | Restrict metrics to one project |

The endpoint returns `aiSessionsCount`, `manualSessionsCount`,
`totalAiInteractions`, `aiVelocityLinesPerHour`, `manualVelocityLinesPerHour`,
`speedupPercentage`, and `estimatedHoursSaved`.

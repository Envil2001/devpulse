# DevPulse

**Automatic worklog and standup drafts for developers.**

DevPulse tracks your coding activity inside VS Code — file saves, git
commits, terminal commands, test runs — and uses AI to generate a natural
standup draft for you. No more "what did I do yesterday?" at the morning
sync.

## Features

- 📊 **Dashboard** — active time, focus score, branches, languages,
  terminal activity, and a GitHub-style heatmap.
- 🤖 **AI standup draft** — one-click summary of your day, week, or month.
- 🌿 **Git-aware** — every event is tagged with the current branch and
  remote. Commit messages are used as context.
- 💻 **Terminal tracking** — see which commands you ran, how long they took,
  and whether they failed. Powers the "fixed the failing tests" insight.
- 🔒 **Privacy-first** — never reads file contents. Sanitizes commands.
  Respects workspace trust and the VS Code telemetry toggle.
- ⏸️ **Pause / Resume** — stop collection at any time from the Command
  Palette.

## Getting started

### 1. Install the extension

From the VS Code Marketplace — search for "DevPulse" and click Install.

### 2. Get an API key

Sign up at your DevPulse backend (by default `http://localhost:3001`) and
create an extension key from **Settings → API Keys**.

### 3. Add the API key to VS Code

Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run:
DevPulse: Set API Key

Paste your key. The status bar in the bottom-left shows whether DevPulse is
active, waiting for activity, paused, buffering locally, or blocked. Hover it
to see the exact reason and the current sync state.

### 4. Work normally

DevPulse starts tracking automatically. Events are batched and sent every
minute. Watch the log in **Output → DevPulse** if you want to see what is
being sent.

Active time follows confirmed activity rather than the time VS Code stays
open. After two minutes without editor, terminal, task, debug, or workspace
activity, the whole idle interval is excluded. Losing window focus is confirmed
after a ten-second grace period and then counted as idle from the moment the
window lost focus; system sleep is detected separately. Pausing tracking closes
the current session, and resuming starts a fresh boundary so paused time cannot
leak into active time.

The tracker reports clear local reasons when it cannot collect activity:
workspace not trusted, VS Code telemetry disabled, no workspace, no Git
branch, or startup failure. Missing/invalid API keys and server outages are
shown separately because activity can still be buffered locally.

## Configuration

| Setting                 | Default                        | Description                        |
| ----------------------- | ------------------------------ | ---------------------------------- |
| `devpulse.apiUrl`       | `http://localhost:3000/api/v1` | DevPulse API base URL              |
| `devpulse.dashboardUrl` | `http://localhost:3001`        | Dashboard URL (used by quick menu) |

## Commands

| Command                      | Description                                           |
| ---------------------------- | ----------------------------------------------------- |
| `DevPulse: Set API Key`      | Paste a new API key                                   |
| `DevPulse: Clear API Key`    | Remove the stored key                                 |
| `DevPulse: Pause Tracking`   | Stop collection (buffered events flushed first)       |
| `DevPulse: Resume Tracking`  | Resume collection                                     |
| `DevPulse: Show Menu`        | Open the quick menu (same as clicking the status bar) |
| `DevPulse: Open Dashboard`   | Open the dashboard in the browser                     |
| `DevPulse: Show Log`         | Open the DevPulse output panel                        |
| `DevPulse: Show Diagnostics` | Print diagnostic info to the output panel             |

## Privacy

DevPulse never reads file contents. It tracks metadata — workspace-relative file paths,
language IDs, git branches, terminal command text (sanitized), commit
messages — and sends it to the backend you choose.

See [PRIVACY.md](./PRIVACY.md) for the full policy.

## Requirements

- VS Code **1.93.0** or newer (for Shell Integration API).
- A running DevPulse backend with a valid API key.
- Git installed and available in `PATH` for git-based features.

## License

MIT — see [LICENSE](./LICENSE).

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

Paste your key. The status bar in the bottom-left should switch to a
green indicator within a minute.

### 4. Work normally

DevPulse starts tracking automatically. Events are batched and sent every
minute. Watch the log in **Output → DevPulse** if you want to see what is
being sent.

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

DevPulse never reads file contents. It tracks metadata — file paths,
language IDs, git branches, terminal command text (sanitized), commit
messages — and sends it to the backend you choose.

See [PRIVACY.md](./PRIVACY.md) for the full policy.

## Requirements

- VS Code **1.93.0** or newer (for Shell Integration API).
- A running DevPulse backend with a valid API key.
- Git installed and available in `PATH` for git-based features.

## License

MIT — see [LICENSE](./LICENSE).

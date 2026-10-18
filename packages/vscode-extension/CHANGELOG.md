# Changelog

All notable changes to the DevPulse extension will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.0.1] — 2026-10-18

### Added

- **Activity tracking** — active/idle detection based on editor events,
  window focus, and system sleep detection.
- **Git context** — tracks branch and remote URL, survives brief loss of
  focus via 2-minute grace period.
- **Terminal tracking** — captures commands, working directory, exit code,
  and duration using VS Code Shell Integration API.
- **Task tracking** — captures task name, source, exit code, and duration.
- **Git commit tracking** — captures commit hash, message, and diff stats
  by watching `.git/logs/HEAD`.
- **Command sanitization** — strips URL credentials, Bearer tokens, and
  password flags before sending.
- **Status bar** — shows active time today, current branch, and health
  indicator. Click opens a quick menu with actions.
- **Quick menu** — Pause/Resume tracking, open dashboard, set/clear API key,
  show log, show diagnostics.
- **Health notifications** — warning when API key is invalid or revoked.
- **Privacy-first** — respects workspace trust, VS Code global telemetry
  toggle, and never reads file contents.
- **Local buffering** — events buffered in `globalState` when offline,
  retried on next flush.
- **Gzip compression** — for payloads over 10 KB.

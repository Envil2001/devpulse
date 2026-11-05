import { describe, expect, it } from '@jest/globals';

import type { DayFacts } from '../interfaces/day-facts.interface';

import { buildSystemPrompt, buildUserPrompt } from './build-prompt';

const FACTS: DayFacts = {
  date: '2026-11-05',
  activeMinutes: 120,
  focusScore: 85,
  projects: [],
  languages: [],
  hotFiles: [{ path: 'src/auth/auth.service.ts', minutes: 90, percent: 75 }],
  terminal: {
    totalRuns: 0,
    failedRuns: 0,
    tests: null,
    builds: null,
    lint: null,
  },
  commits: [],
  aiAssistedPercent: null,
};

describe('worklog prompt', () => {
  it('explains how the model may use hot files without inferring work', () => {
    const prompt = buildSystemPrompt('daily-log', 'en');

    expect(prompt).toContain('"hotFiles" contains up to five workspace-relative files');
    expect(prompt).toContain('Never infer an implementation');
  });

  it('includes sanitised hot-file facts in the telemetry block', () => {
    expect(buildUserPrompt(FACTS)).toContain(
      '"hotFiles":[{"path":"src/auth/auth.service.ts","minutes":90,"percent":75}]',
    );
  });
});

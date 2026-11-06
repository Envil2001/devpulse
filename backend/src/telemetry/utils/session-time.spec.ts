import { describe, expect, it } from '@jest/globals';

import { calculateSessionTime, resolveIdleStartedAt } from './session-time';

describe('session time', () => {
  const startedAt = new Date('2026-11-06T10:00:00.000Z');

  it('subtracts confirmed idle time from the observed session duration', () => {
    const result = calculateSessionTime(startedAt, new Date('2026-11-06T10:10:00.000Z'), 180);

    expect(result).toEqual({ wallSeconds: 600, activeSeconds: 420, idleSeconds: 180 });
  });

  it('caps idle time at the observed session duration', () => {
    const result = calculateSessionTime(startedAt, new Date('2026-11-06T10:05:00.000Z'), 1800);

    expect(result).toEqual({ wallSeconds: 300, activeSeconds: 0, idleSeconds: 300 });
  });

  it('never returns negative counters for invalid time ordering', () => {
    const result = calculateSessionTime(startedAt, new Date('2026-11-06T09:59:00.000Z'), -30);

    expect(result).toEqual({ wallSeconds: 0, activeSeconds: 0, idleSeconds: 0 });
  });

  it('allows an idle event to rewind heartbeats sent after the last activity', () => {
    const idleStartedAt = new Date('2026-11-06T10:04:00.000Z');
    const boundary = resolveIdleStartedAt(startedAt, idleStartedAt);

    expect(boundary).toEqual(idleStartedAt);
    expect(calculateSessionTime(startedAt, boundary, 0)).toEqual({
      wallSeconds: 240,
      activeSeconds: 240,
      idleSeconds: 0,
    });
  });

  it('does not move a session boundary before the session start', () => {
    expect(resolveIdleStartedAt(startedAt, new Date('2026-11-06T09:59:00.000Z'))).toEqual(
      startedAt,
    );
  });
});

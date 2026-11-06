export interface SessionTime {
  wallSeconds: number;
  activeSeconds: number;
  idleSeconds: number;
}

/**
 * Keeps the persisted session counters internally consistent.
 * Idle reports come from the client and therefore must never make the session
 * longer, produce negative active time, or exceed the observed wall time.
 */
export function calculateSessionTime(
  startedAt: Date,
  endedAt: Date,
  reportedIdleSeconds: number,
): SessionTime {
  const wallSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
  const idleSeconds = Math.min(wallSeconds, Math.max(0, Math.round(reportedIdleSeconds)));

  return {
    wallSeconds,
    activeSeconds: wallSeconds - idleSeconds,
    idleSeconds,
  };
}

/** An idle transition may arrive after newer heartbeats and must rewind them. */
export function resolveIdleStartedAt(startedAt: Date, idleStartedAt: Date): Date {
  return idleStartedAt.getTime() < startedAt.getTime() ? startedAt : idleStartedAt;
}

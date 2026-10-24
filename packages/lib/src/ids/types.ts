export const idTypes = {
  users: 'u',
  encryption: 'en',
  apiKeys: 'ak',
  projects: 'p',
  telemetryEvents: 'te',
  workSessions: 'ws',
  worklogEntries: 'we',
} as const;

export type IdTypePrefixes = keyof typeof idTypes;

export type TypeId<T extends IdTypePrefixes> = `${(typeof idTypes)[T]}_${string}`;

export const idTypes = {
  users: 'u',
  apiKeys: 'ak',
  projects: 'p',
  telemetryEvents: 'te',
  workSessions: 'ws',
} as const;

export type IdTypePrefixes = keyof typeof idTypes;

export type TypeId<T extends IdTypePrefixes> = `${(typeof idTypes)[T]}_${string}`;

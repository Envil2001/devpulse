import path from 'node:path';

export const MAX_FILE_PATH_LENGTH = 512;
export const MAX_TRACKED_FILES_PER_SESSION = 1000;
export const MAX_FILE_ACTIVITY_DELTA_SECONDS = 300;

const WINDOWS_ABSOLUTE_PATH = /^[a-zA-Z]:\//;

export function normalizeWorkspaceFilePath(rawPath: string | null | undefined): string | null {
  if (rawPath === null || rawPath === undefined) {
    return null;
  }

  const withForwardSlashes = rawPath.trim().replaceAll('\\', '/');

  if (
    withForwardSlashes === '' ||
    withForwardSlashes.includes('\0') ||
    withForwardSlashes.length > MAX_FILE_PATH_LENGTH ||
    path.posix.isAbsolute(withForwardSlashes) ||
    WINDOWS_ABSOLUTE_PATH.test(withForwardSlashes)
  ) {
    return null;
  }

  const segments = withForwardSlashes.split('/');

  if (segments.includes('..')) {
    return null;
  }

  const normalized = path.posix.normalize(withForwardSlashes).replace(/^\.\//, '');

  return normalized === '.' || normalized === '' ? null : normalized;
}

export function addFileActivity(
  buckets: Readonly<Record<string, number>> | null | undefined,
  filePath: string,
  seconds: number,
): Record<string, number> {
  const next = { ...buckets };

  if (
    seconds <= 0 ||
    (!(filePath in next) && Object.keys(next).length >= MAX_TRACKED_FILES_PER_SESSION)
  ) {
    return next;
  }

  next[filePath] = (next[filePath] ?? 0) + seconds;
  return next;
}

export function getFileActivityDeltaSeconds(previousAt: Date, nextAt: Date): number {
  const deltaSeconds = Math.round((nextAt.getTime() - previousAt.getTime()) / 1000);
  return Math.min(Math.max(0, deltaSeconds), MAX_FILE_ACTIVITY_DELTA_SECONDS);
}

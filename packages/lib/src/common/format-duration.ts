/**
 * Formats a duration in seconds into a human-readable string.
 *
 * @example
 * formatDuration(45)    // "45s"
 * formatDuration(90)    // "1m 30s"
 * formatDuration(3600)  // "1h"
 * formatDuration(3660)  // "1h 1m"
 *
 * @param seconds - The duration in seconds. Must be a non-negative number.
 * @returns A formatted string with units (s, m, h).
 */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, seconds);

  if (s < 1) {
    const ms = Math.round(s * 1000);
    return `${String(ms)}ms`;
  }

  const totalSec = Math.floor(s);

  if (totalSec < 60) {
    return `${String(totalSec)}s`;
  }

  const totalMin = Math.floor(totalSec / 60);

  if (totalMin < 60) {
    const sec = totalSec % 60;
    return sec > 0 ? `${String(totalMin)}m ${String(sec)}s` : `${String(totalMin)}m`;
  }

  const totalHours = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return min > 0 ? `${String(totalHours)}h ${String(min)}m` : `${String(totalHours)}h`;
}

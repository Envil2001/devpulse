const REASONING_PROBE_LENGTH = 200;

const REASONING_MARKERS: ReadonlyArray<RegExp> = [
  /\bThe user wants\b/i,
  /\bI need to (write|draft|create|analyze)\b/i,
  /\bLet me (think|draft|write|analyze)\b/i,
  /\bLet's (write|draft|start)\b/i,
];

/** English only: for other languages the heuristic leaves the text untouched. */
const REPORT_START =
  /\bI (worked|spent|focused|implemented|ran|built|fixed|started|continued|completed|reviewed|tested|debugged)\b/i;

/**
 * Last line of defence against models that leak their chain of thought into the answer.
 * Providers that support it should be asked to exclude reasoning in the request itself.
 */
export function stripReasoning(raw: string): string {
  const text = raw
    .trim()
    .replace(/^<think>[\S\s]*?<\/think>\s*/i, '')
    .replace(/^Thinking:.*\n\n/i, '');

  const probe = text.slice(0, REASONING_PROBE_LENGTH);

  if (!REASONING_MARKERS.some((marker) => marker.test(probe))) {
    return text;
  }

  const reportStart = text.search(REPORT_START);

  return reportStart > 0 ? text.slice(reportStart).trim() : text;
}

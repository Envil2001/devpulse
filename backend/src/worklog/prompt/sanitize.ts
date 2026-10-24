// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/**
 * Obvious secrets that sometimes end up in commit messages.
 * This is a safety net, not a guarantee: it reduces accidental leaks to the LLM provider.
 */
const SECRET_PATTERNS: ReadonlyArray<RegExp> = [
  /\bsk-[\w-]{16,}/g,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_\w{20,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g,
  /\bBearer\s+[\w.~+/=-]{12,}/gi,
  /\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*\S+/gi,
];

const REDACTED = '[redacted]';

export function redactSecrets(value: string): string {
  let text = value;
  for (const pattern of SECRET_PATTERNS) {
    text = text.replaceAll(pattern, REDACTED);
  }
  return text;
}

/**
 * Makes untrusted text safe to place inside the telemetry block:
 * one line, no angle brackets (so nobody can close the block), secrets removed, length capped.
 * Redaction runs before truncation so a secret is never cut in half and left readable.
 */
export function sanitizeText(value: string, maxLength: number): string {
  const cleaned = redactSecrets(
    value.replaceAll(CONTROL_CHARS, ' ').replaceAll(/[<>]/g, '').replaceAll(/\s+/g, ' ').trim(),
  );

  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
}

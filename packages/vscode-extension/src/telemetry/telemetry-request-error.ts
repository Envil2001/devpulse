const AUTH_STATUSES: ReadonlySet<number> = new Set([401, 403]);
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([408, 425, 429]);

export class TelemetryRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'TelemetryRequestError';
  }

  public get retryable(): boolean {
    if (this.status === null) return true;
    return this.status >= 500 || RETRYABLE_STATUSES.has(this.status);
  }

  public get isAuthError(): boolean {
    return this.status !== null && AUTH_STATUSES.has(this.status);
  }
}

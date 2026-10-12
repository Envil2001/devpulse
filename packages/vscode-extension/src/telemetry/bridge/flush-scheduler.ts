const FLUSH_INTERVAL_MS = 60_000;
const FLUSH_SIZE_THRESHOLD = 50;
const FLUSH_DEBOUNCE_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 60_000;

export interface FlushSchedulerCallbacks {
  flush: () => void;
  heartbeat: () => void;
}

export class FlushScheduler {
  private flushInterval: ReturnType<typeof setInterval> | undefined;
  private heartbeatInterval: ReturnType<typeof setInterval> | undefined;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly callbacks: FlushSchedulerCallbacks) {}

  start(): void {
    this.flushInterval = setInterval(() => {
      this.callbacks.flush();
    }, FLUSH_INTERVAL_MS);

    this.heartbeatInterval = setInterval(() => {
      this.callbacks.heartbeat();
    }, HEARTBEAT_INTERVAL_MS);
  }

  scheduleFlush(queueSize: number): { immediate: boolean } {
    if (queueSize >= FLUSH_SIZE_THRESHOLD) {
      this.clearDebounce();
      return { immediate: true };
    }

    this.debounceFlush();
    return { immediate: false };
  }

  stop(): void {
    if (this.flushInterval !== undefined) {
      clearInterval(this.flushInterval);
      this.flushInterval = undefined;
    }

    if (this.heartbeatInterval !== undefined) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    this.clearDebounce();
  }

  private debounceFlush(): void {
    this.clearDebounce();

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this.callbacks.flush();
    }, FLUSH_DEBOUNCE_MS);
  }

  private clearDebounce(): void {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }
}

const PENDING_BUFFER_TTL_MS = 2 * 60 * 1000;

export type PendingEventType = 'terminal_command' | 'task_run';

export interface PendingEventPartial {
  command?: string;
  commandCwd?: string | null;
  exitCode?: number | null;
  durationMs?: number | null;
  taskName?: string;
  taskSource?: string;
}

export interface PendingEvent {
  type: PendingEventType;
  partial: PendingEventPartial;
  createdAt: number;
}

export interface DrainResult {
  valid: Array<PendingEvent>;
  dropped: number;
}

export class PendingBuffer {
  private readonly items: Array<PendingEvent> = [];

  get size(): number {
    return this.items.length;
  }

  push(event: PendingEvent): void {
    this.items.push(event);
  }

  clear(): void {
    this.items.length = 0;
  }

  drain(): DrainResult {
    if (this.items.length === 0) {
      return { valid: [], dropped: 0 };
    }

    const now = Date.now();
    const valid: Array<PendingEvent> = [];
    let dropped = 0;

    for (const item of this.items) {
      if (now - item.createdAt < PENDING_BUFFER_TTL_MS) {
        valid.push(item);
      } else {
        dropped += 1;
      }
    }

    this.items.length = 0;
    return { valid, dropped };
  }
}

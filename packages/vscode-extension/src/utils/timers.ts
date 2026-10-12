export class ReschedulableTimer {
  private handle: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly callback: () => void) {}

  schedule(delayMs: number): void {
    this.cancel();
    this.handle = setTimeout(() => {
      this.handle = undefined;
      this.callback();
    }, delayMs);
  }

  cancel(): void {
    if (this.handle !== undefined) {
      clearTimeout(this.handle);
      this.handle = undefined;
    }
  }

  get isActive(): boolean {
    return this.handle !== undefined;
  }
}

export class IntervalTimer {
  private handle: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly callback: () => void) {}

  start(intervalMs: number): void {
    this.stop();
    this.handle = setInterval(() => {
      this.callback();
    }, intervalMs);
  }

  stop(): void {
    if (this.handle !== undefined) {
      clearInterval(this.handle);
      this.handle = undefined;
    }
  }
}

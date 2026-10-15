let activeTourId: string | null = null;
const listeners = new Set<() => void>();

function emit(next: string | null): void {
  activeTourId = next;
  listeners.forEach((listener) => listener());
}

export const tourStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): string | null {
    return activeTourId;
  },

  getServerSnapshot(): string | null {
    return null;
  },

  start(tourId: string): void {
    if (activeTourId === tourId) return;
    emit(tourId);
  },

  stop(): void {
    if (activeTourId === null) return;
    emit(null);
  },
};

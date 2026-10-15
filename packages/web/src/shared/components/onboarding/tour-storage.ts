import { TOURS } from './tour-steps';

function storageKey(tourId: string, userId: string): string {
  return `devpulse:tour:${tourId}:v1:${userId}`;
}

export function hasSeenTour(tourId: string, userId: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(tourId, userId)) === '1';
  } catch {
    return true;
  }
}

export function markTourSeen(tourId: string, userId: string): void {
  try {
    window.localStorage.setItem(storageKey(tourId, userId), '1');
  } catch {
  }
}

export function resetAllTours(userId: string): void {
  try {
    TOURS.forEach((tour) => window.localStorage.removeItem(storageKey(tour.id, userId)));
  } catch {
  }
}

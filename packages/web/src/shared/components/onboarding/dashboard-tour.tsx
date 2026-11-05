'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { type JSX } from 'react/jsx-runtime';
import { type EventHandler, Joyride, type Locale, type Options, STATUS } from 'react-joyride';

import { findTourById, findTourByPath } from './tour-steps';
import { hasSeenTour, markTourSeen } from './tour-storage';
import { tourStore } from './tour-store';
import { TourTooltip } from './tour-tooltip';

const DESKTOP_QUERY = '(min-width: 1024px)';

const TOUR_OPTIONS: Partial<Options> = {
  skipBeacon: true,
  zIndex: 10000,
  overlayColor: 'rgb(0 0 0 / 0.7)',
  spotlightPadding: 6,
  spotlightRadius: 12,
  offset: 12,
  blockTargetInteraction: true,
  overlayClickAction: false,
  dismissKeyAction: false,
};

const TOUR_LOCALE: Locale = {
  back: 'Back',
  close: 'Close',
  last: 'Done',
  next: 'Next',
  skip: 'Skip',
};

interface DashboardTourProps {
  userId: string;
}

export function DashboardTour({ userId }: DashboardTourProps): JSX.Element | null {
  const pathname = usePathname();
  const activeTourId = useSyncExternalStore(
    tourStore.subscribe,
    tourStore.getSnapshot,
    tourStore.getServerSnapshot,
  );

  useEffect(() => {
    const tour = findTourByPath(pathname);
    if (!tour) return undefined;

    const shouldRun = window.matchMedia(DESKTOP_QUERY).matches && !hasSeenTour(tour.id, userId);
    if (!shouldRun) return undefined;

    tourStore.start(tour.id);
    return () => tourStore.stop();
  }, [pathname, userId]);

  const tour = activeTourId ? findTourById(activeTourId) : undefined;
  if (!tour) return null;

  const handleEvent: EventHandler = (data) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      markTourSeen(tour.id, userId);
      tourStore.stop();
    }
  };

  return (
    <Joyride
      key={tour.id}
      run
      continuous
      steps={tour.steps}
      options={TOUR_OPTIONS}
      locale={TOUR_LOCALE}
      tooltipComponent={TourTooltip}
      floatingOptions={{ hideArrow: true }}
      onEvent={handleEvent}
    />
  );
}

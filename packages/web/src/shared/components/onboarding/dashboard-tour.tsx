'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { Joyride, STATUS, type EventHandler, type Locale, type Options } from 'react-joyride';
import { TourTooltip } from './tour-tooltip';
import { findTourById, findTourByPath } from './tour-steps';
import { hasSeenTour, markTourSeen } from './tour-storage';
import { tourStore } from './tour-store';

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

export function DashboardTour({ userId }: DashboardTourProps) {
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

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { TOUR_START_PATH } from './tour-steps';
import { resetAllTours } from './tour-storage';

interface RestartTourButtonProps {
  userId: string;
}

export function RestartTourButton({ userId }: RestartTourButtonProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => {
        resetAllTours(userId);
        router.push(TOUR_START_PATH);
      }}
    >
      Restart tour
    </Button>
  );
}

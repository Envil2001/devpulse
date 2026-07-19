'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-fluor/10 border border-red-fluor/20">
          <AlertTriangle className="h-10 w-10 text-red-fluor" />
        </div>

        <h2 className="h4 text-neutral-100 mb-2">Something went wrong!</h2>
        <p className="body1 text-neutral-400 mb-8">
          We couldn&apos;t load the dashboard data. Please try again or contact support if the
          problem persists.
        </p>

        <div className="flex gap-4">
          <Button variant="default" onClick={() => reset()} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="secondary" onClick={() => (window.location.href = '/login')}>
            Back to login
          </Button>
        </div>
      </div>
    </div>
  );
}

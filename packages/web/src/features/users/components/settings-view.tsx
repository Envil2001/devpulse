'use client';

import { useState } from 'react';

import { ApiKeysPanel } from '@/features/api-keys/components/api-keys-panel';
import { useAuth } from '@/features/auth/context';
import { Button } from '@/shared/components/ui/button';

const TIMEZONES = Intl.supportedValuesOf('timeZone');

function TimezonePreference({
  initialTimezone,
  onSave,
  isPending,
}: {
  initialTimezone: string;
  onSave: (tz: string) => void;
  isPending: boolean;
}) {
  const [timezone, setTimezone] = useState(initialTimezone);

  return (
    <div className="flex items-center gap-3">
      <select
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        disabled={isPending}
        className="max-w-65 rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-electric disabled:opacity-50"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
      <Button
        onClick={() => onSave(timezone)}
        disabled={timezone === initialTimezone || isPending}
        size="sm"
      >
        {isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}

export function SettingsView() {
  const { user, isLoading, updateProfile } = useAuth();
  const [isPending, setIsPending] = useState(false);

  async function handleSave(timezone: string) {
    setIsPending(true);
    try {
      await updateProfile({ timezone });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="h4 text-neutral-100">Settings</h1>
        <p className="desc mt-1 text-neutral-400">Manage your account and preferences</p>
      </div>

      <ApiKeysPanel />

      <div className="rounded-xl bg-neutral-900 p-6">
        <p className="mini mb-4 text-neutral-400">PREFERENCES</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="body1 text-neutral-200">Timezone</p>
              <p className="desc text-neutral-500">Used for daily calculations</p>
            </div>

            {isLoading || !user ? (
              <div className="h-9 w-50 animate-pulse rounded-lg bg-neutral-800" />
            ) : (
              <TimezonePreference
                key={user.timezone ?? 'UTC'}
                initialTimezone={user.timezone ?? 'UTC'}
                onSave={handleSave}
                isPending={isPending}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

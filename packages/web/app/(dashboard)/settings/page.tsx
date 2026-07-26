'use client';

<<<<<<< Updated upstream
=======
import { useState } from 'react';

import { ApiKeysPanel } from '@/components/settings/api-keys-panel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

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

>>>>>>> Stashed changes
export default function SettingsPage() {
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h4 text-neutral-100">Settings</h1>
        <p className="desc mt-1 text-neutral-400">Manage your account and preferences</p>
      </div>

      <div className="rounded-xl bg-neutral-900 p-6">
        <p className="mini mb-4 text-neutral-400">API KEYS</p>
        <p className="body1 text-neutral-300">
          Create and manage API keys for the VS Code extension.
        </p>
        <button className="mt-4 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950">
          Create new key
        </button>
      </div>

      <div className="rounded-xl bg-neutral-900 p-6">
        <p className="mh4 text-neutral-100 uppercase mb-4">PREFERENCES</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="body1 text-neutral-200">Timezone</p>
              <p className="desc text-neutral-500">Used for daily calculations</p>
            </div>
<<<<<<< Updated upstream
            <select className="rounded-lg bg-neutral-800 px-3 py-2 text-neutral-100">
              <option>Europe/Moscow</option>
              <option>UTC</option>
            </select>
=======

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
>>>>>>> Stashed changes
          </div>
        </div>
      </div>
    </div>
  );
}

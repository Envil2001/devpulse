'use client';

import { useState } from 'react';
import { Globe, Key } from 'lucide-react';

import { ApiKeysPanel } from '@/features/api-keys/components/api-keys-panel';
import { useAuth } from '@/features/auth/context';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/cn';
import { Input } from '@/shared/components/ui/input';

const TIMEZONES = Intl.supportedValuesOf('timeZone');

function OpenAiKeyPreference({
  isSet,
  onSave,
  isPending,
}: {
  isSet: boolean;
  onSave: (key: string | null) => void;
  isPending: boolean;
}) {
  const [key, setKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(key || null);
    setKey('');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setKey('');
    setIsEditing(false);
  };

  const handleRemove = () => {
    onSave(null);
    setKey('');
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setKey('');
    setIsEditing(true);
  };

  if (isSet && !isEditing) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-64">
          <Input
            type="password"
            value="sk-•••••••••••••••••••••••••"
            disabled
            className="bg-neutral-800/50"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleStartEdit}
            disabled={isPending}
            size="sm"
            variant="secondary"
          >
            Change
          </Button>
          <Button
            onClick={handleRemove}
            disabled={isPending}
            size="sm"
            variant="ghost"
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="w-full sm:w-64">
        <Input
          type="password"
          placeholder={isSet ? 'Enter new key to update' : 'sk-...'}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={isPending}
          autoFocus={isEditing}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!key || isPending}
          loading={isPending}
          size="sm"
        >
          {isSet ? 'Update' : 'Save'}
        </Button>
        {isEditing && (
          <Button
            onClick={handleCancel}
            disabled={isPending}
            size="sm"
            variant="ghost"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

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
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="w-full sm:w-64">
        <Select value={timezone} onValueChange={setTimezone} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={() => onSave(timezone)}
        disabled={timezone === initialTimezone || isPending}
        loading={isPending}
        size="sm"
      >
        Save
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div>
        <h1 className="title-1">Settings</h1>
        <p className="body-muted mt-1">Manage your account and preferences</p>
      </div>

      <ApiKeysPanel />

      <div
        className={cn(
          'rounded-2xl border border-white/5 bg-neutral-900/50 p-6 backdrop-blur-sm',
          'transition-colors hover:border-white/10',
        )}
      >
        <p className="label-caps mb-5">Preferences</p>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-neutral-900">
                <Globe className="h-4.5 w-4.5 text-neutral-300" />
              </div>
              <div>
                <p className="body-base">Timezone</p>
                <p className="caption mt-0.5">
                  Used for calculating daily active coding sessions and metrics
                </p>
              </div>
            </div>

            {isLoading || !user ? (
              <div className="h-9 w-64 animate-pulse rounded-lg bg-neutral-800" />
            ) : (
              <TimezonePreference
                key={user.timezone}
                initialTimezone={user.timezone}
                onSave={handleSave}
                isPending={isPending}
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-neutral-900">
                <Key className="h-4.5 w-4.5 text-neutral-300" />
              </div>
              <div>
                <p className="body-base">OpenAI API Key</p>
                <p className="caption mt-0.5 max-w-sm">
                  Required to generate AI summaries. Your key is securely stored and only used for
                  your requests.
                </p>
              </div>
            </div>

            {isLoading || !user ? (
              <div className="h-9 w-64 animate-pulse rounded-lg bg-neutral-800" />
            ) : (
              <OpenAiKeyPreference
                isSet={user.hasOpenaiKey}
                onSave={async (newKey) => {
                  setIsPending(true);
                  try {
                    await updateProfile({ openaiKey: newKey });
                  } finally {
                    setIsPending(false);
                  }
                }}
                isPending={isPending}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

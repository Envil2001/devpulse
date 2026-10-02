'use client';

import { useMemo, useState } from 'react';
import { Globe, Key } from 'lucide-react';

import { ApiKeysPanel } from '@/features/api-keys/components/api-keys-panel';
import {
  Page,
  PageDescription,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
} from '@/shared/components/layout/page';
import { Panel } from '@/shared/components/layout/panel';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useRequireAuth } from '@/features/auth/context';

const SUPPORTED_TIMEZONES = Intl.supportedValuesOf('timeZone');
const OPENAI_KEY_PREFIX = 'sk-';
const OPENAI_KEY_MASK = 'sk-••••••••••••••••••••••••';

function isValidOpenAiKey(value: string): boolean {
  return value.startsWith(OPENAI_KEY_PREFIX) && value.length > OPENAI_KEY_PREFIX.length;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unknown error occurred';
}

interface TimezonePreferenceProps {
  initialTimezone: string;
  onSave: (timezone: string) => Promise<void>;
}

function TimezonePreference({ initialTimezone, onSave }: TimezonePreferenceProps) {
  const [timezone, setTimezone] = useState(initialTimezone);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(
    () =>
      SUPPORTED_TIMEZONES.includes(initialTimezone)
        ? SUPPORTED_TIMEZONES
        : [initialTimezone, ...SUPPORTED_TIMEZONES],
    [initialTimezone],
  );

  const handleSave = async () => {
    setIsPending(true);
    setError(null);
    try {
      await onSave(timezone);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-64">
          <Select value={timezone} onValueChange={setTimezone} disabled={isPending}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {options.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSave}
          disabled={timezone === initialTimezone || isPending}
          loading={isPending}
          size="sm"
        >
          Save
        </Button>
      </div>

      {error && <p className="caption text-red-coral">{error}</p>}
    </div>
  );
}

interface OpenAiKeyPreferenceProps {
  isSet: boolean;
  onSave: (key: string | null) => Promise<void>;
}

function OpenAiKeyPreference({ isSet, onSave }: OpenAiKeyPreferenceProps) {
  const [key, setKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedKey = key.trim();
  const showFormatHint = trimmedKey !== '' && !isValidOpenAiKey(trimmedKey);

  const closeEditor = () => {
    setKey('');
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setIsPending(true);
    setError(null);
    try {
      await onSave(trimmedKey);
      closeEditor();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  const handleRemove = async () => {
    setIsPending(true);
    setError(null);
    try {
      await onSave(null);
      closeEditor();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  if (isSet && !isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-full sm:w-64">
            <Input type="password" value={OPENAI_KEY_MASK} disabled className="bg-neutral-800/50" />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(true)}
              disabled={isPending}
              size="sm"
              variant="secondary"
            >
              Change
            </Button>
            <Button onClick={handleRemove} disabled={isPending} size="sm" variant="ghost">
              Remove
            </Button>
          </div>
        </div>

        {error && <p className="caption text-red-coral">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
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
            disabled={!isValidOpenAiKey(trimmedKey) || isPending}
            loading={isPending}
            size="sm"
          >
            {isSet ? 'Update' : 'Save'}
          </Button>
          {isEditing && (
            <Button onClick={closeEditor} disabled={isPending} size="sm" variant="ghost">
              Cancel
            </Button>
          )}
        </div>
      </div>

      {showFormatHint && <p className="caption text-red-coral">OpenAI keys start with sk-</p>}
      {error && <p className="caption text-red-coral">{error}</p>}
    </div>
  );
}

export function SettingsView() {
  const { user, updateProfile } = useRequireAuth();

  return (
    <Page className="max-w-4xl mx-auto">
      <PageHeader>
        <div>
          <PageHeaderHeading>
            <PageTitle>Settings</PageTitle>
          </PageHeaderHeading>
          <PageDescription>Manage your account and preferences</PageDescription>
        </div>
      </PageHeader>

      <ApiKeysPanel />

      <Panel>
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

            <TimezonePreference
              key={user.timezone}
              initialTimezone={user.timezone}
              onSave={(timezone) => updateProfile({ timezone })}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-neutral-900">
                <Key className="h-4.5 w-4.5 text-neutral-300" />
              </div>
              <div>
                <p className="body-base">OpenAI API Key</p>
                <p className="caption mt-0.5 max-w-sm">
                  Required to generate AI summaries. Used only for your own requests.
                </p>
              </div>
            </div>

            <OpenAiKeyPreference
              isSet={user.hasOpenaiKey}
              onSave={(openaiKey) => updateProfile({ openaiKey })}
            />
          </div>
        </div>
      </Panel>
    </Page>
  );
}

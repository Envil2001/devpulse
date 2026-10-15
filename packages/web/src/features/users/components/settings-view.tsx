'use client';

import { useMemo, useState } from 'react';
import { Compass, Globe, Key } from 'lucide-react';

import { ApiKeysPanel } from '@/features/api-keys/components/api-keys-panel';
import {
  Page,
  PageDescription,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
} from '@/shared/components/layout/page';
import { Panel, PanelHeader, PanelTitle } from '@/shared/components/layout/panel';
import { RestartTourButton } from '@/shared/components/onboarding/restart-tour-button';
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

      {error && <p className="text-xs text-red-coral">{error}</p>}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <Input type="password" value={OPENAI_KEY_MASK} disabled className="bg-gray-alpha-50" />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(true)}
              disabled={isPending}
              size="sm"
              variant="outline"
            >
              Change
            </Button>
            <Button onClick={handleRemove} disabled={isPending} size="sm" variant="ghost">
              Remove
            </Button>
          </div>
        </div>

        {error && <p className="text-xs text-red-coral">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

      {showFormatHint && <p className="text-xs text-red-coral">OpenAI keys start with sk-</p>}
      {error && <p className="text-xs text-red-coral">{error}</p>}
    </div>
  );
}

export function SettingsView() {
  const { user, updateProfile } = useRequireAuth();

  return (
    <Page className="mx-auto max-w-4xl">
      <PageHeader>
        <div>
          <PageHeaderHeading>
            <PageTitle>Settings</PageTitle>
          </PageHeaderHeading>
          <PageDescription>Manage your account and preferences</PageDescription>
        </div>
      </PageHeader>

      <div data-tour="api-keys">
        <ApiKeysPanel />
      </div>

      <Panel>
        <PanelHeader>
          <PanelTitle>Preferences</PanelTitle>
        </PanelHeader>

        <div className="flex flex-col gap-6">
          <div
            data-tour="settings-timezone"
            className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-gray-alpha-50">
                <Globe className="h-4.5 w-4.5 text-subtle" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Timezone</p>
                <p className="mt-0.5 text-xs text-subtle">
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

          <div
            data-tour="settings-openai"
            className="flex flex-col justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-gray-alpha-50">
                <Key className="h-4.5 w-4.5 text-subtle" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">OpenAI API Key</p>
                <p className="mt-0.5 max-w-sm text-xs text-subtle">
                  Required to generate AI summaries. Used only for your own requests.
                </p>
              </div>
            </div>

            <OpenAiKeyPreference
              isSet={user.hasOpenaiKey}
              onSave={(openaiKey) => updateProfile({ openaiKey })}
            />
          </div>

          <div
            data-tour="settings-tour"
            className="flex flex-col justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-gray-alpha-50">
                <Compass className="h-4.5 w-4.5 text-subtle" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Onboarding tour</p>
                <p className="mt-0.5 max-w-sm text-xs text-subtle">
                  Replay the guided tour of every page, starting from the dashboard
                </p>
              </div>
            </div>

            <RestartTourButton userId={user.id} />
          </div>
        </div>
      </Panel>
    </Page>
  );
}

'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';

import type { DayState } from '../hooks';
import { formatDuration } from '@devpulse/lib';

interface WorklogDayEntryProps {
  state: DayState;
  disabled: boolean;
  onRegenerate: (date: string) => void;
}

export function WorklogDayEntry({ state, disabled, onRegenerate }: WorklogDayEntryProps) {
  const { day, status, result, error } = state;

  return (
    <div className="rounded-xl border border-border bg-gray-alpha-50 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h4 className="text-[13px] font-medium text-foreground">{day.date}</h4>
          <span className="text-xs text-subtle">{formatDuration(day.activeMinutes)}</span>
        </div>

        {status === 'done' && result && (
          <div className="flex items-center gap-2">
            <span className="max-w-40 truncate text-xs text-subtle" title={result.model}>
              {result.cached ? 'Saved' : result.model}
            </span>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => onRegenerate(day.date)}
              aria-label={`Regenerate ${day.date}`}
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      {status === 'pending' && <p className="text-xs text-subtle">Waiting</p>}

      {status === 'loading' && (
        <div className="flex flex-col gap-2" aria-busy="true">
          <div className="h-3.5 w-full animate-pulse rounded bg-gray-alpha-100" />
          <div className="h-3.5 w-5/6 animate-pulse rounded bg-gray-alpha-100" />
        </div>
      )}

      {status === 'done' && result && (
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
          {result.text}
        </p>
      )}

      {status === 'failed' && (
        <div className="flex items-start gap-2" role="alert">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-red-coral"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-xs text-red-coral/90">{error ?? 'Generation failed'}</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { AlertCircle, Check, Copy, Sparkles } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { DateRangePicker } from '@/shared/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Panel } from '@/shared/components/layout/panel';
import { toDateInput } from '@/shared/lib/date';
import type { WorklogFormat } from '@/shared/types';

import { useWorklogRun } from '../hooks';
import { buildReportText } from '../lib/build-report';

import { WorklogDayEntry } from './worklog-day-entry';

const MAX_RANGE_DAYS = 31;

const FORMAT_OPTIONS: ReadonlyArray<{ value: WorklogFormat; label: string }> = [
  { value: 'daily-log', label: 'Daily log' },
  { value: 'standup', label: 'Standup' },
  { value: 'client-report', label: 'Client report' },
];

const COPIED_RESET_MS = 2000;

export function AiWorklogCard() {
  const { phase, plan, days, error, start, resume, cancel, regenerateDay } = useWorklogRun();

  const [startDate, setStartDate] = useState(() => toDateInput(new Date()));
  const [endDate, setEndDate] = useState(() => toDateInput(new Date()));
  const [format, setFormat] = useState<WorklogFormat>('daily-log');
  const [copied, setCopied] = useState(false);

  const isBusy = phase === 'planning' || phase === 'running';
  const doneCount = days.filter((item) => item.status === 'done').length;
  const canResume = !isBusy && plan !== null && !plan.exceedsLimit && doneCount < days.length;

  const handleGenerate = () => {
    void start({ startDate, endDate, format });
  };

  const handleCopy = () => {
    if (!plan) return;

    navigator.clipboard
      .writeText(buildReportText(plan, days))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_RESET_MS);
      })
      .catch(() => {});
  };

  return (
    <Panel className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/30 bg-brand-soft">
            <Sparkles className="h-4.5 w-4.5 text-brand" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">AI Worklog</h3>
            <p className="mt-0.5 text-xs text-subtle">
              Day-by-day summary for up to {String(MAX_RANGE_DAYS)} days
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            maxDays={MAX_RANGE_DAYS}
            onChange={(range) => {
              setStartDate(range.startDate);
              setEndDate(range.endDate);
            }}
          />

          <Select value={format} onValueChange={(value) => setFormat(value as WorklogFormat)}>
            <SelectTrigger className="w-36" aria-label="Report format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {phase === 'running' ? (
            <Button variant="outline" onClick={cancel}>
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              loading={phase === 'planning'}
              disabled={isBusy}
              variant={days.length > 0 ? 'outline' : 'default'}
            >
              {days.length > 0 ? 'Start over' : 'Generate'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-coral/20 bg-red-coral/10 p-4"
          role="alert"
        >
          <AlertCircle
            className="h-5 w-5 shrink-0 text-red-coral"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1">
            <p className="text-[13px] font-medium text-red-coral">Could not prepare the worklog</p>
            <p className="text-xs text-red-coral/80">{error}</p>
          </div>
        </div>
      )}

      {plan?.exceedsLimit && (
        <div
          className="flex items-start gap-3 rounded-xl border border-yellow-amber/30 bg-yellow-amber/10 p-4"
          role="alert"
        >
          <AlertCircle
            className="h-5 w-5 shrink-0 text-yellow-amber"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-xs text-foreground">
            This period has {String(plan.totals.activeDays)} active days. Your AI provider allows{' '}
            {String(plan.limits.maxActiveDays)} per run
            {plan.limits.tier === 'free' ? ' (free models are rate-limited)' : ''}. Pick a shorter
            period{plan.limits.tier === 'free' ? ' or choose a paid model in Settings' : ''}.
          </p>
        </div>
      )}

      {days.length > 0 && !plan?.exceedsLimit && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-subtle" aria-live="polite">
            {String(doneCount)} of {String(days.length)} days ready
            {phase === 'running' ? '…' : ''}
          </p>

          <div className="flex items-center gap-2">
            {canResume && (
              <Button size="sm" onClick={resume}>
                Continue
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleCopy} disabled={doneCount === 0}>
              {copied ? (
                <Check className="mr-1.5 h-4 w-4 text-brand" strokeWidth={1.5} />
              ) : (
                <Copy className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
              )}
              {copied ? 'Copied' : 'Copy all'}
            </Button>
          </div>
        </div>
      )}

      {days.length > 0 && !plan?.exceedsLimit && (
        <div className="flex flex-col gap-3">
          {days.map((item) => (
            <WorklogDayEntry
              key={item.day.date}
              state={item}
              disabled={isBusy}
              onRegenerate={(date) => void regenerateDay(date)}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

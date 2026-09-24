'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check, AlertCircle } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { DateRangePicker } from '@/shared/components/ui/date-range-picker';
import { cn } from '@/shared/lib/cn';
import { toDateInput } from '@/shared/lib/date';
import { useGenerateWorklog } from '../hooks';

export function AiWorklogCard() {
  const { mutate, data, isPending, error, reset } = useGenerateWorklog();
  const [copied, setCopied] = useState(false);
  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [endDate, setEndDate] = useState(toDateInput(new Date()));

  const handleGenerate = () => {
    mutate({ startDate, endDate });
  };

  const handleCopy = () => {
    if (data?.summary) {
      navigator.clipboard.writeText(data.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/5 bg-neutral-900/50 p-6 backdrop-blur-sm',
        'transition-colors hover:border-white/10 flex flex-col gap-5',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
            <Sparkles className="h-4.5 w-4.5 text-purple-400" />
          </div>
          <div>
            <h3 className="body-base font-semibold">AI Standup Draft</h3>
            <p className="caption mt-0.5">Generate a summary for a date range</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateRangeChange}
          />
          <Button
            onClick={handleGenerate}
            loading={isPending}
            disabled={isPending}
            variant={data ? 'secondary' : 'default'}
            size="sm"
          >
            {data ? 'Regenerate' : 'Generate'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-coral/20 bg-red-coral/10 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-coral" />
          <div className="flex flex-col gap-1">
            <p className="body-sm font-medium text-red-coral">Failed to generate summary</p>
            <p className="caption text-red-coral/80">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
            <button
              onClick={reset}
              className="caption mt-1 text-left text-red-coral hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {isPending && !data && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-neutral-950/40 p-4">
          <div className="h-4 w-full animate-pulse rounded bg-neutral-800" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-800" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-neutral-800" />
        </div>
      )}

      {data && !isPending && (
        <div className="group relative rounded-xl border border-white/5 bg-neutral-950/50 p-4 transition-colors hover:border-white/10 hover:bg-neutral-950/80">
          <p className="body-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
            {data.summary}
          </p>

          <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              onClick={handleCopy}
              variant="secondary"
              size="icon"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-spring" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

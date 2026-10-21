'use client';

import { Sparkles, TrendingUp, Clock, Bot, Cpu } from 'lucide-react';
import { Panel } from '@/shared/components/layout/panel';
import { useAiRoiMetrics, type DateRange } from '../hooks';

export function AiRoiPanel({ range, projectId }: { range: DateRange; projectId?: string }) {
  const { data: roi, isLoading } = useAiRoiMetrics(range, projectId);

  if (isLoading) {
    return (
      <Panel className="p-6">
        <div className="h-28 animate-pulse rounded-lg bg-surface-hover/30" />
      </Panel>
    );
  }

  const hasAiActivity = roi && (roi.aiSessionsCount > 0 || roi.totalAiInteractions > 0);

  return (
    <Panel className="relative overflow-hidden p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/30 bg-brand-soft">
            <Sparkles className="h-4.5 w-4.5 text-brand" strokeWidth={1.5} aria-hidden="true" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">AI Assistance & ROI</h3>
              {hasAiActivity && (
                <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                  <TrendingUp className="h-3 w-3" />+{roi.speedupPercentage}% speedup
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-subtle">
              {hasAiActivity
                ? `You've saved an estimated ~${roi.estimatedHoursSaved} hours using AI-assisted pair programming.`
                : 'Start using Claude Code, Aider, or Copilot in your sessions to unlock speedup metrics.'}
            </p>
          </div>
        </div>

        {hasAiActivity ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-subtle">
                <Clock className="h-3.5 w-3.5" />
                Hours Saved
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-foreground">
                ~{roi.estimatedHoursSaved}h
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-subtle">
                <Cpu className="h-3.5 w-3.5" />
                AI Velocity
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-brand">
                {roi.aiVelocityLinesPerHour}{' '}
                <span className="text-xs font-normal text-subtle">lines/h</span>
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-subtle">
                Manual Velocity
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-foreground">
                {roi.manualVelocityLinesPerHour}{' '}
                <span className="text-xs font-normal text-subtle">lines/h</span>
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-subtle">
                <Bot className="h-3.5 w-3.5" />
                Interactions
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-foreground">
                {roi.totalAiInteractions}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-2 text-xs text-subtle">
            No AI sessions recorded for this period
          </div>
        )}
      </div>
    </Panel>
  );
}

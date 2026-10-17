'use client';

import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { formatDuration } from '@devpulse/lib';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';

import { useDashboardComparison, type DateRange } from '../hooks';

interface ComparisonPanelProps {
  range: DateRange;
  projectId?: string;
}

interface MetricDelta {
  label: string;
  current: string;
  diff: number;
  format: (v: number) => string;
}

function deltaColor(diff: number): string {
  if (diff > 0) return 'text-brand';
  if (diff < 0) return 'text-red-coral';
  return 'text-subtle';
}

function DeltaIcon({ diff }: { diff: number }) {
  if (diff > 0) return <ArrowUp className="h-3 w-3" strokeWidth={1.5} />;
  if (diff < 0) return <ArrowDown className="h-3 w-3" strokeWidth={1.5} />;
  return <ArrowRight className="h-3 w-3" strokeWidth={1.5} />;
}

export function ComparisonPanel({ range, projectId }: ComparisonPanelProps) {
  const { current, previous, isLoading } = useDashboardComparison(range, projectId);

  if (isLoading || !current || !previous) {
    return null;
  }

  if (previous.totalActiveSeconds === 0 && previous.totalSessionsCount === 0) {
    return null;
  }

  const metrics: Array<MetricDelta> = [
    {
      label: 'Active time',
      current: formatDuration(current.totalActiveSeconds),
      diff: current.totalActiveSeconds - previous.totalActiveSeconds,
      format: (v) => formatDuration(Math.abs(v)),
    },
    {
      label: 'Focus score',
      current: `${String(Math.round(current.averageFocusScore))}%`,
      diff: current.averageFocusScore - previous.averageFocusScore,
      format: (v) => `${String(Math.round(Math.abs(v)))}%`,
    },
    {
      label: 'Sessions',
      current: String(current.totalSessionsCount),
      diff: current.totalSessionsCount - previous.totalSessionsCount,
      format: (v) => String(Math.abs(v)),
    },
    {
      label: 'Top language',
      current: current.topLanguage ?? 'N/A',
      diff: current.topLanguage === previous.topLanguage ? 0 : 1,
      format: () => '',
    },
  ];

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Comparison</PanelTitle>
          <PanelDescription>vs previous period of the same length</PanelDescription>
        </div>
      </PanelHeader>
      <PanelContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col gap-1">
              <span className="text-xs text-subtle">{m.label}</span>
              <span className="font-mono text-lg font-semibold tracking-tight tabular-nums text-foreground">
                {m.current}
              </span>
              {m.label === 'Top language' ? (
                m.diff !== 0 && <span className="text-xs text-subtle">changed</span>
              ) : m.diff === 0 ? (
                <span className="flex items-center gap-1 text-xs text-subtle">
                  <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  no change
                </span>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1 font-mono text-xs tabular-nums',
                    deltaColor(m.diff),
                  )}
                >
                  <DeltaIcon diff={m.diff} />
                  {m.diff > 0 ? '+' : '−'}
                  {m.format(m.diff)}
                </span>
              )}
            </div>
          ))}
        </div>
      </PanelContent>
    </Panel>
  );
}

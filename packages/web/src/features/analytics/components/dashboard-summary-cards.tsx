'use client';

import { Clock, Zap, Layers, Code2 } from 'lucide-react';
import { Panel } from '@/shared/components/layout/panel';
import { useDashboardStats, type DateRange } from '../hooks';
import { formatDuration } from '@devpulse/lib';

export function DashboardSummaryCards({ range }: { range: DateRange }) {
  const { data: stats, isLoading } = useDashboardStats(range);

  const cards = [
    {
      label: 'Active Time',
      icon: Clock,
      value: isLoading || !stats ? '—' : formatDuration(stats.totalActiveSeconds / 1000),
      sub: 'this period',
    },
    {
      label: 'Focus Score',
      icon: Zap,
      value: isLoading || !stats ? '—' : `${Math.round(stats.averageFocusScore)}%`,
      sub: 'average',
    },
    {
      label: 'Sessions',
      icon: Layers,
      value: isLoading || !stats ? '—' : String(stats.totalSessionsCount),
      sub: 'this period',
    },
    {
      label: 'Top Language',
      icon: Code2,
      value: isLoading || !stats ? '—' : (stats.topLanguage ?? 'N/A'),
      sub: 'most active',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Panel key={card.label} className="flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-subtle">{card.label}</p>
                <Icon className="h-4 w-4 text-subtle" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                  {card.value}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-subtle">{card.sub}</p>
          </Panel>
        );
      })}
    </div>
  );
}

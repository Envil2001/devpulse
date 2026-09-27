'use client';

import { useMemo } from 'react';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { Panel } from '@/shared/components/layout/panel';
import { useRequireAuth } from '@/features/auth/context';
import { periodToDateRange, useDashboardStats } from '../hooks';

export function EarningsSummaryCards() {
  const { user } = useRequireAuth();

  const range30d = useMemo(() => periodToDateRange('30d'), []);
  const range7d = useMemo(() => periodToDateRange('7d'), []);

  const { data: stats30d } = useDashboardStats(range30d);
  const { data: stats7d } = useDashboardStats(range7d);

  const activeHoursThisMonth = Number(((stats30d?.totalActiveSeconds ?? 0) / 3600).toFixed(1));
  const activeHoursThisWeek = Number(((stats7d?.totalActiveSeconds ?? 0) / 3600).toFixed(1));

  const earnedThisMonth = activeHoursThisMonth * user.hourlyRate;
  const earnedThisWeek = activeHoursThisWeek * user.hourlyRate;

  const earningsCards = [
    {
      label: 'This week',
      icon: Clock,
      value: `${earnedThisWeek.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${user.currency}`,
      sub: `${activeHoursThisWeek}h active coding`,
      accent: false,
    },
    {
      label: 'This month (30d)',
      icon: TrendingUp,
      value: `${earnedThisMonth.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${user.currency}`,
      sub: `${activeHoursThisMonth}h active coding`,
      accent: true,
    },
    {
      label: 'Effective hourly',
      icon: DollarSign,
      value: `${user.hourlyRate.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${user.currency}`,
      sub: 'Based on your saved rate',
      accent: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {earningsCards.map((card) => {
        const Icon = card.icon;
        return (
          <Panel key={card.label} className="flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between">
                <p className="caption font-medium">{card.label}</p>
                <Icon className="h-4 w-4 text-neutral-500" aria-hidden="true" />
              </div>
              <p
                className={cn(
                  'metric mt-3',
                  card.accent ? 'text-green-spring' : 'text-neutral-100',
                )}
              >
                {card.value}
              </p>
            </div>
            <p className="caption mt-2">{card.sub}</p>
          </Panel>
        );
      })}
    </div>
  );
}

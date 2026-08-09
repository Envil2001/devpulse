'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { TimeSwitcher } from '@/components/analytics/analytics/time-switcher';
import { useAuth } from '@/contexts/auth-context';
import {
  periodToDateRange,
  useAnalyticsTimeseries,
  useBranchesDistribution,
  useDashboardStats,
  type AnalyticsPeriod,
} from '@/hooks/use-analytics';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDateRangeLabel(period: AnalyticsPeriod): string {
  const { startDate, endDate } = periodToDateRange(period);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return period === 'today' ? fmt(end) : `${fmt(start)} – ${fmt(end)}`;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useDashboardStats(period);
  const { data: timeseries, isLoading: timeseriesLoading } = useAnalyticsTimeseries(period);
  const { data: branches, isLoading: branchesLoading } = useBranchesDistribution(period);

  const chartData =
    timeseries?.map((point) => ({
      date: new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Math.round((point.activeSeconds / 3600) * 10) / 10,
    })) ?? [];

  return (
    <div className="flex flex-col gap-4 pb-10">
      <header className="mb-2 flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="h4 text-neutral-100">Hello, {user?.displayName ?? '...'}</h1>
          <div className="body1 flex items-center gap-2">
            <span className="text-neutral-400">{formatDateRangeLabel(period)}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-green-spring shadow-[0_0_8px_rgba(21,255,171,0.6)]" />
            <span className="text-green-spring">Tracking now</span>
          </div>
        </div>
        <TimeSwitcher value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)} />
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex justify-between gap-4 rounded-xl bg-neutral-900 p-4">
          <div className="flex flex-col justify-between">
            <span className="body1 text-neutral-200">Active Time</span>
            <span className="h6 text-neutral-100">
              {statsLoading ? '—' : formatDuration(stats?.totalActiveSeconds ?? 0)}
            </span>
            <span className="desc text-neutral-600">this period</span>
          </div>
        </div>

        <div className="flex justify-between gap-4 rounded-xl bg-neutral-900 p-4">
          <div className="flex flex-col justify-between">
            <span className="body1 text-neutral-200">Average Focus Score</span>
            <span className="h6 text-neutral-100">
              {statsLoading ? '—' : `${Math.round(stats?.averageFocusScore ?? 0)}%`}
            </span>
            <span className="desc text-neutral-600">this period</span>
          </div>
        </div>

        <div className="flex justify-between gap-4 rounded-xl bg-neutral-900 p-4">
          <div className="flex flex-col justify-between">
            <span className="body1 text-neutral-200">Sessions</span>
            <span className="h6 text-neutral-100">
              {statsLoading ? '—' : (stats?.totalSessionsCount ?? 0)}
            </span>
            <span className="desc text-neutral-600">this period</span>
          </div>
        </div>

        <div className="flex justify-between gap-4 rounded-xl bg-neutral-900 p-4">
          <div className="flex flex-col justify-between">
            <span className="body1 text-neutral-200">Top Language</span>
            <span className="h6 text-neutral-100">
              {statsLoading ? '—' : (stats?.topLanguage ?? 'n/a')}
            </span>
            <span className="desc text-neutral-600">most active time</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-60 flex-col rounded-xl bg-neutral-900 p-6">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="h4 text-neutral-100">Activity</h2>
          <span className="desc text-neutral-400">Active time by day</span>
        </div>

        {timeseriesLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="desc animate-pulse text-neutral-600">Loading…</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30">
            <span className="desc text-neutral-600">No activity recorded for this period</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#737373"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} unit="h" />
              <Tooltip
                contentStyle={{
                  background: '#171717',
                  border: '1px solid #262626',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#a3a3a3' }}
                formatter={(value: unknown) => {
                  if (typeof value !== 'number') {
                    return ['0h', 'Active time'];
                  }
                  return [`${value}h`, 'Active time'];
                }}
              />
              <Bar dataKey="hours" fill="#15ffab" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-col rounded-xl bg-neutral-900 p-6">
        <div className="mb-6">
          <span className="mini text-neutral-400">
            BRANCHES {period === 'today' ? 'TODAY' : 'THIS PERIOD'}
          </span>
        </div>

        <div className="flex flex-col">
          <div className="mb-3 grid grid-cols-12 gap-4 border-b border-neutral-800 pb-2 text-xs text-neutral-500">
            <div className="col-span-8">BRANCH</div>
            <div className="col-span-4 text-right">ACTIVE TIME</div>
          </div>

          {branchesLoading && (
            <div className="py-8 text-center">
              <span className="desc animate-pulse text-neutral-600">Loading…</span>
            </div>
          )}

          {!branchesLoading && branches?.length === 0 && (
            <div className="py-8 text-center">
              <span className="desc text-neutral-600">
                No branch activity recorded for this period
              </span>
            </div>
          )}

          {branches?.map((branch) => (
            <div
              key={branch.branchName}
              className="grid grid-cols-12 gap-4 border-b border-neutral-800/40 py-3 text-sm text-neutral-300 last:border-0"
            >
              <div className="col-span-8">
                <span className="rounded bg-neutral-800 px-2 py-1 font-mono text-xs">
                  {branch.branchName}
                </span>
              </div>
              <div className="col-span-4 text-right text-neutral-100">
                {formatDuration(branch.activeSeconds)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

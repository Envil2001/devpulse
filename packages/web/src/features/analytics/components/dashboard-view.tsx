'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock, Zap, Layers, Code2, GitBranch, Download, TerminalSquare } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';

import { useRequireAuth } from '@/features/auth/context';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';
import { formatChartAxisLabel, toDateInput } from '@/shared/lib/date';
import {
  AnalyticsPeriod,
  useDashboardStats,
  useAnalyticsTimeseries,
  useBranchesDistribution,
  useExportSessions,
  useLiveStatus,
  useLanguagesBreakdown,
  periodToDateRange,
} from '../hooks';
import { TimeSwitcher } from './time-switcher';
import { AiWorklogCard } from '@/features/worklog/components/ai-worklog-card';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function CustomChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950/90 p-3 shadow-xl backdrop-blur-md">
      <p className="caption font-medium">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-spring" aria-hidden="true" />
        <span className="font-mono text-sm font-semibold text-neutral-100">
          {payload[0].value}h
        </span>
        <span className="caption">active time</span>
      </div>
    </div>
  );
}

function getInitialCustomDates(): { startDate: string; endDate: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { startDate: toDateInput(from), endDate: toDateInput(to) };
}

export function DashboardView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const [customDates, setCustomDates] = useState(getInitialCustomDates);

  const range = useMemo(() => periodToDateRange(period, customDates), [period, customDates]);

  const { user, isLoading: authLoading } = useRequireAuth();
  const exportMutation = useExportSessions();

  const { data: stats, isLoading: statsLoading } = useDashboardStats(range);
  const { data: timeseries = [], isLoading: timeseriesLoading } = useAnalyticsTimeseries(range);
  const { data: branches = [], isLoading: branchesLoading } = useBranchesDistribution(range);

  const { data: liveStatus } = useLiveStatus();
  const { data: languagesData, isLoading: languagesLoading } = useLanguagesBreakdown();

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="body-muted animate-pulse">Loading...</span>
      </div>
    );
  }

  const rangeDays = differenceInCalendarDays(new Date(range.endDate), new Date(range.startDate));

  const chartData = timeseries.map((point) => ({
    date: formatChartAxisLabel(point.date, rangeDays),
    hours: Math.round((point.activeSeconds / 3600) * 10) / 10,
  }));

  const statCards = [
    {
      label: 'Active Time',
      icon: Clock,
      value: statsLoading || !stats ? '—' : formatDuration(stats.totalActiveSeconds),
      sub: 'this period',
    },
    {
      label: 'Focus Score',
      icon: Zap,
      value: statsLoading || !stats ? '—' : `${Math.round(stats.averageFocusScore)}%`,
      sub: 'average',
    },
    {
      label: 'Sessions',
      icon: Layers,
      value: statsLoading || !stats ? '—' : String(stats.totalSessionsCount),
      sub: 'this period',
    },
    {
      label: 'Top Language',
      icon: Code2,
      value: statsLoading || !stats ? '—' : (stats.topLanguage ?? 'N/A'),
      sub: 'most active',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="title-1">Hello, {user.displayName}</h2>

            {liveStatus?.isCodingNow && (
              <div className="flex items-center gap-2 rounded-full border border-green-spring/20 bg-green-spring/10 px-3 py-1 text-sm text-green-spring shadow-[0_0_15px_rgba(21,255,171,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-spring opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-spring"></span>
                </span>
                <span className="font-medium">
                  Coding in {liveStatus.currentProject || 'Unknown'}
                  {liveStatus.currentLanguage && ` (${liveStatus.currentLanguage})`}
                </span>
              </div>
            )}
          </div>
          <p className="body-muted mt-1">Here&apos;s what&apos;s happening with your workflow.</p>
        </div>

        <div className="flex items-center gap-3">
          <TimeSwitcher
            value={period}
            onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}
            customRange={customDates}
            onCustomRangeChange={setCustomDates}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                'rounded-2xl border border-white/5 bg-neutral-900/50 p-5 backdrop-blur-sm',
                'transition-colors hover:border-white/10 flex flex-col justify-between',
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <p className="caption font-medium">{card.label}</p>
                  <Icon className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="metric text-neutral-100">{card.value}</span>
                </div>
              </div>
              <p className="caption mt-2">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          'rounded-2xl border border-white/5 bg-neutral-900/50 p-6 backdrop-blur-sm',
          'transition-colors hover:border-white/10',
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="title-4">Activity</h3>
            <p className="caption mt-0.5">Active coding time by day</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              exportMutation.mutate({ startDate: range.startDate, endDate: range.endDate })
            }
            disabled={exportMutation.isPending}
          >
            <Download />
            {exportMutation.isPending ? 'Exporting…' : 'Export'}
          </Button>
        </div>

        {timeseriesLoading ? (
          <div className="flex h-55 items-center justify-center">
            <span className="body-muted animate-pulse">Loading activity…</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-55 items-center justify-center rounded-xl border border-dashed border-white/10">
            <span className="body-muted">No activity recorded for this period</span>
          </div>
        ) : (
          <div className="h-55 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#5b5b65"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#5b5b65" fontSize={11} tickLine={false} axisLine={false} unit="h" />
                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="hours" fill="#15ffab" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <AiWorklogCard />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className={cn(
            'rounded-2xl border border-white/5 bg-neutral-900/50 p-6 backdrop-blur-sm transition-colors hover:border-white/10',
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="title-4">Branches</h3>
              <p className="caption mt-0.5">Where you spent time</p>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="label-caps mb-2 grid grid-cols-12 gap-4 border-b border-white/5 pb-2">
              <div className="col-span-8">BRANCH</div>
              <div className="col-span-4 text-right">ACTIVE TIME</div>
            </div>

            {branchesLoading && (
              <div className="py-8 text-center">
                <span className="body-muted animate-pulse">Loading branch data…</span>
              </div>
            )}

            {!branchesLoading && branches.length === 0 && (
              <div className="py-8 text-center">
                <span className="body-muted">No branch activity recorded for this period</span>
              </div>
            )}

            {branches.map((branch, i) => (
              <div
                key={branch.branchName}
                className={cn(
                  'grid grid-cols-12 items-center gap-4 py-3.5 text-sm transition-colors',
                  i !== branches.length - 1 && 'border-b border-white/5',
                  'hover:bg-white/2 rounded-lg px-2 -mx-2',
                )}
              >
                <div className="col-span-8 flex items-center gap-2">
                  <span className="mono-sm inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-neutral-950/40 px-2 py-0.5">
                    <GitBranch className="h-3 w-3 text-neutral-500" aria-hidden="true" />
                    {branch.branchName}
                  </span>
                </div>
                <div className="mono-sm col-span-4 text-right text-neutral-200">
                  {formatDuration(branch.activeSeconds)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'rounded-2xl border border-white/5 bg-neutral-900/50 p-6 backdrop-blur-sm transition-colors hover:border-white/10',
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="title-4">Languages</h3>
              <p className="caption mt-0.5">Your technology stack</p>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="label-caps mb-2 grid grid-cols-12 gap-4 border-b border-white/5 pb-2">
              <div className="col-span-8">LANGUAGE</div>
              <div className="col-span-4 text-right">ACTIVE TIME</div>
            </div>

            {languagesLoading && (
              <div className="py-8 text-center">
                <span className="body-muted animate-pulse">Loading languages…</span>
              </div>
            )}

            {!languagesLoading && languagesData?.languages.length === 0 && (
              <div className="py-8 text-center">
                <span className="body-muted">No language data recorded</span>
              </div>
            )}

            {languagesData?.languages.map((lang, i) => (
              <div
                key={lang.language}
                className={cn(
                  'grid grid-cols-12 items-center gap-4 py-3 text-sm transition-colors',
                  i !== languagesData.languages.length - 1 && 'border-b border-white/5',
                  'hover:bg-white/2 rounded-lg px-2 -mx-2',
                )}
              >
                <div className="col-span-8 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <TerminalSquare className="h-4 w-4 text-neutral-500" />
                    <span className="body-base capitalize">{lang.language}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full bg-green-spring/70"
                      style={{ width: `${lang.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="mono-sm col-span-4 flex flex-col items-end justify-center text-right">
                  <span className="text-neutral-200">{lang.formattedTime}</span>
                  <span className="text-xs text-neutral-500">{lang.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

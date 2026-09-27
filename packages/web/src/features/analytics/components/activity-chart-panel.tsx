'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';

import { Button } from '@/shared/components/ui/button';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';
import { formatChartAxisLabel } from '@/shared/lib/date';
import { useAnalyticsTimeseries, useExportSessions, type DateRange } from '../hooks';
import { ActivityChartTooltip } from './activity-chart-tooltip';

export function ActivityChartPanel({ range }: { range: DateRange }) {
  const { data: timeseries = [], isLoading } = useAnalyticsTimeseries(range);
  const exportMutation = useExportSessions();

  const chartData = useMemo(() => {
    const rangeDays = differenceInCalendarDays(new Date(range.endDate), new Date(range.startDate));
    return timeseries.map((point) => ({
      date: formatChartAxisLabel(point.date, rangeDays),
      hours: Math.round((point.activeSeconds / 3600) * 10) / 10,
    }));
  }, [timeseries, range.startDate, range.endDate]);

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Activity</PanelTitle>
          <PanelDescription>Active coding time by day</PanelDescription>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportMutation.mutate(range)}
          disabled={exportMutation.isPending}
          aria-label="Export activity data to CSV"
        >
          <Download aria-hidden="true" className="mr-2 h-4 w-4" />
          {exportMutation.isPending ? 'Exporting…' : 'Export'}
        </Button>
      </PanelHeader>

      <PanelContent>
        {isLoading ? (
          <div className="flex h-55 items-center justify-center">
            <span className="body-muted animate-pulse">Loading activity…</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-55 items-center justify-center rounded-xl border border-dashed border-white/10">
            <span className="body-muted">No activity recorded for this period</span>
          </div>
        ) : (
          <div className="h-55 w-full" role="region" aria-label="Activity Chart">
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
                  content={<ActivityChartTooltip />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="hours" fill="#15ffab" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </PanelContent>
    </Panel>
  );
}

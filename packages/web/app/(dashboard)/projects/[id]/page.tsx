'use client';

import { useParams } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useProject } from '@/hooks/use-projects';
import { useAnalyticsTimeseries, useBranchesDistribution } from '@/hooks/use-analytics';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);
  const { data: timeseries, isLoading: timeseriesLoading } = useAnalyticsTimeseries(
    '30d',
    projectId,
  );
  const { data: branches } = useBranchesDistribution('30d', projectId);

  const chartData =
    timeseries?.map((point) => ({
      date: new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Math.round((point.activeSeconds / 3600) * 10) / 10,
    })) ?? [];

  if (projectError) {
    return (
      <div className="rounded-xl bg-neutral-900 p-6 text-center">
        <p className="desc text-red-coral">Failed to load project: {projectError.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h4 text-neutral-100">{projectLoading ? 'Loading…' : project?.name}</h1>
        <p className="desc mt-1 text-neutral-400">{project?.remote ?? 'No remote set'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="body1 text-neutral-400">Active Time</p>
          <p className="h6 mt-1 text-neutral-100">{projectLoading ? '—' : project?.activeTime}</p>
        </div>
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="body1 text-neutral-400">Focus Score</p>
          <p className="h6 mt-1 text-green-spring">
            {projectLoading ? '—' : `${project?.focusScore}%`}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="body1 text-neutral-400">Sessions</p>
          <p className="h6 mt-1 text-neutral-100">{projectLoading ? '—' : project?.sessions}</p>
        </div>
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="body1 text-neutral-400">Branches</p>
          <p className="h6 mt-1 text-neutral-100">{branches?.length ?? '—'}</p>
        </div>
      </div>

      <div className="rounded-xl bg-neutral-900 p-6">
        <p className="mini mb-4 text-neutral-400">ACTIVITY (LAST 30 DAYS)</p>

        {timeseriesLoading ? (
          <div className="flex h-48 items-center justify-center">
            <span className="desc animate-pulse text-neutral-600">Loading…</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-neutral-800">
            <span className="desc text-neutral-600">No activity recorded for this project yet</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
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
                  const numValue = typeof value === 'number' ? value : 0;
                  return [`${numValue}h`, 'Active time'];
                }}
              />
              <Bar dataKey="hours" fill="#15ffab" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

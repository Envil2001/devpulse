'use client';

import { useMemo, useState } from 'react';
import { toDateInput } from '@/shared/lib/date';
import { useRequireAuth } from '@/features/auth/context';
import { AnalyticsPeriod, periodToDateRange, useLiveStatus } from '../hooks';

import {
  Page,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
  PageDescription,
  PageActions,
} from '@/shared/components/layout/page';
import { TimeSwitcher } from './time-switcher';
import { ProjectSelector } from './project-selector';
import { AiWorklogCard } from '@/features/worklog/components/ai-worklog-card';

import { DashboardSummaryCards } from './dashboard-summary-cards';
import { ActivityChartPanel } from './activity-chart-panel';
import { BranchesPanel } from './branches-panel';
import { LanguagesPanel } from './languages-panel';
import { RecentSessionsPanel } from '@/features/sessions/components/recent-sessions-panel';
import { TerminalActivityPanel } from './terminal-activity-panel';

function getInitialCustomDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { startDate: toDateInput(from), endDate: toDateInput(to) };
}

export function DashboardView() {
  const { user } = useRequireAuth();
  const { data: liveStatus } = useLiveStatus();

  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const [customDates, setCustomDates] = useState(getInitialCustomDates);
  const range = useMemo(() => periodToDateRange(period, customDates), [period, customDates]);

  const [projectId, setProjectId] = useState<string | undefined>();

  return (
    <Page>
      <PageHeader>
        <div>
          <PageHeaderHeading>
            <PageTitle>Hello, {user.displayName}</PageTitle>
            {liveStatus?.isCodingNow && (
              <div className="flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-sm text-brand">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                </span>
                <span className="font-medium">
                  Coding in {liveStatus.currentProject || 'Unknown'}
                  {liveStatus.currentLanguage && ` (${liveStatus.currentLanguage})`}
                </span>
              </div>
            )}
          </PageHeaderHeading>
          <PageDescription>Here&apos;s what&apos;s happening with your workflow.</PageDescription>
        </div>

        <PageActions>
          <div className="flex flex-wrap items-center gap-3">
            <ProjectSelector value={projectId} onChange={setProjectId} /> {/* <-- NEW */}
            <div data-tour="period-switcher">
              <TimeSwitcher
                value={period}
                onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}
                customRange={customDates}
                onCustomRangeChange={setCustomDates}
              />
            </div>
          </div>
        </PageActions>
      </PageHeader>

      <div data-tour="stats-overview">
        <DashboardSummaryCards range={range} projectId={projectId} />
      </div>

      <div data-tour="activity-chart">
        <ActivityChartPanel range={range} projectId={projectId} />
      </div>

      <div data-tour="recent-sessions">
        <RecentSessionsPanel projectId={projectId} />
      </div>

      <div data-tour="terminal-activity">
        <TerminalActivityPanel range={range} projectId={projectId} />
      </div>

      <div data-tour="ai-worklog">
        <AiWorklogCard />
      </div>

      <div data-tour="breakdown" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BranchesPanel range={range} projectId={projectId} />
        <LanguagesPanel projectId={projectId} />
      </div>
    </Page>
  );
}

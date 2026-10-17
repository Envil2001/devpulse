'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FolderGit2,
  GitBranch,
  Hourglass,
  Play,
  Terminal,
  XCircle,
  Zap,
} from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { formatDuration } from '@devpulse/lib';
import { formatDateTimeLabel } from '@/shared/lib/date';
import { useRequireAuth } from '@/features/auth/context';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';
import {
  Page,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
  PageDescription,
} from '@/shared/components/layout/page';

import { useSessionDetail } from '../hooks';

interface SessionDetailViewProps {
  id: string;
}

function formatTimeRange(startedAt: string, endedAt: string | null, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    hour12: false,
  });
  const start = fmt.format(new Date(startedAt));
  const end = endedAt ? fmt.format(new Date(endedAt)) : 'now';
  return `${start} → ${end}`;
}

function kindIcon(kind: string) {
  switch (kind) {
    case 'test':
      return '🧪';
    case 'build':
      return '🔨';
    case 'lint':
      return '🐛';
    case 'install':
      return '📦';
    case 'git':
      return '🌿';
    case 'task':
      return '⚙️';
    default:
      return '🖥';
  }
}

function focusColorClass(score: number): string {
  if (score >= 80) return 'text-brand';
  if (score >= 50) return 'text-yellow-amber';
  return 'text-red-coral';
}

export function SessionDetailView({ id }: SessionDetailViewProps) {
  const { user } = useRequireAuth();
  const router = useRouter();
  const { data, isLoading, error } = useSessionDetail(id);

  const backButton = (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-xs text-secondary transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
      Back
    </button>
  );

  if (isLoading) {
    return (
      <Page>
        <div className="py-16 text-center">
          <span className="animate-pulse text-sm text-secondary">Loading session…</span>
        </div>
      </Page>
    );
  }

  if (error || !data) {
    return (
      <Page>
        <div className="py-16 text-center">
          <p className="text-sm text-red-coral">
            {error instanceof Error ? error.message : 'Session not found'}
          </p>
          <Link
            href="/sessions"
            className="mt-3 inline-block text-xs text-secondary hover:text-foreground"
          >
            Back to sessions
          </Link>
        </div>
      </Page>
    );
  }

  const languages = Object.entries(data.languageSeconds)
    .sort(([, a], [, b]) => b - a)
    .map(([language, seconds]) => ({ language, seconds }));

  const totalLanguageSeconds = languages.reduce((sum, l) => sum + l.seconds, 0);

  const commands = [...data.terminalCommands].reverse();

  return (
    <Page>
      <PageHeader>
        <div>
          <div className="mb-2">{backButton}</div>
          <PageHeaderHeading>
            <PageTitle>{data.projectName ?? 'Unknown project'}</PageTitle>
          </PageHeaderHeading>
          <PageDescription>
            {formatDateTimeLabel(data.startedAt, user.timezone)} ·{' '}
            {formatTimeRange(data.startedAt, data.endedAt, user.timezone)}
          </PageDescription>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Active time',
            icon: Clock,
            value: formatDuration(data.activeSeconds),
            sub: 'this session',
            valueClass: 'text-foreground',
          },
          {
            label: 'Idle time',
            icon: Hourglass,
            value: formatDuration(data.idleSeconds),
            sub: 'this session',
            valueClass: 'text-foreground',
          },
          {
            label: 'Focus Score',
            icon: Zap,
            value: `${String(data.focusScore)}%`,
            sub: 'average',
            valueClass: focusColorClass(data.focusScore),
          },
          {
            label: 'Commands',
            icon: Terminal,
            value: String(data.commandsRun),
            sub: data.failedCommands > 0 ? `${String(data.failedCommands)} failed` : 'this session',
            valueClass: 'text-foreground',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Panel key={card.label} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-subtle">{card.label}</p>
                  <Icon className="h-4 w-4 text-subtle" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={cn(
                      'font-mono text-2xl font-semibold tracking-tight tabular-nums',
                      card.valueClass,
                    )}
                  >
                    {card.value}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-subtle">{card.sub}</p>
            </Panel>
          );
        })}
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Context</PanelTitle>
            <PanelDescription>Where and when this session happened</PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-subtle" strokeWidth={1.5} />
              <div>
                <dt className="text-xs text-subtle">Project</dt>
                <dd className="text-foreground">{data.projectName ?? '—'}</dd>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-subtle" strokeWidth={1.5} />
              <div>
                <dt className="text-xs text-subtle">Branch</dt>
                <dd className="font-mono text-foreground">{data.gitBranch ?? '—'}</dd>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-subtle" strokeWidth={1.5} />
              <div>
                <dt className="text-xs text-subtle">Started</dt>
                <dd className="text-foreground">
                  {formatDateTimeLabel(data.startedAt, user.timezone)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Play className="mt-0.5 h-4 w-4 shrink-0 text-subtle" strokeWidth={1.5} />
              <div>
                <dt className="text-xs text-subtle">Status</dt>
                <dd className="text-foreground capitalize">{data.status}</dd>
              </div>
            </div>
          </dl>
        </PanelContent>
      </Panel>

      {languages.length > 0 && (
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Languages</PanelTitle>
              <PanelDescription>Time spent per language in this session</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent>
            <div className="flex flex-col gap-3">
              {languages.map(({ language, seconds }) => {
                const percent =
                  totalLanguageSeconds > 0 ? (seconds / totalLanguageSeconds) * 100 : 0;
                return (
                  <div key={language} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-foreground">{language}</span>
                      <span className="font-mono text-xs text-secondary">
                        {formatDuration(seconds)} · {percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-alpha-100">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </PanelContent>
        </Panel>
      )}

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Terminal activity</PanelTitle>
            <PanelDescription>
              {commands.length === 0
                ? 'Commands you ran in this session'
                : `${commands.length} commands`}
            </PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent>
          {commands.length === 0 ? (
            <div className="py-6 text-center text-sm text-secondary">No commands recorded</div>
          ) : (
            <div className="flex flex-col">
              <div className="mb-2 grid grid-cols-12 gap-4 border-b border-border pb-2 text-xs font-medium uppercase tracking-wider text-subtle">
                <div className="col-span-7">Command</div>
                <div className="col-span-2 text-right">Duration</div>
                <div className="col-span-3 text-right">Exit</div>
              </div>

              {commands.map((cmd, i) => {
                const isFailed = cmd.exitCode !== null && cmd.exitCode !== 0;
                return (
                  <div
                    key={`${cmd.timestamp}-${i}`}
                    className={cn(
                      'grid grid-cols-12 items-center gap-4 py-2.5 text-sm',
                      i !== commands.length - 1 && 'border-b border-border',
                    )}
                  >
                    <div className="col-span-7 flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-sm">{kindIcon(cmd.kind)}</span>
                      <span
                        className="truncate font-mono text-xs text-foreground"
                        title={cmd.command}
                      >
                        {cmd.command}
                      </span>
                    </div>

                    <div className="col-span-2 text-right font-mono text-xs text-secondary tabular-nums">
                      {formatDuration(cmd.durationMs / 1000)}
                    </div>

                    <div className="col-span-3 flex items-center justify-end gap-1.5 font-mono text-xs">
                      {cmd.exitCode === null ? (
                        <span className="text-subtle">—</span>
                      ) : isFailed ? (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-red-coral" strokeWidth={1.5} />
                          <span className="text-red-coral">{cmd.exitCode}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} />
                          <span className="text-brand">0</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PanelContent>
      </Panel>
    </Page>
  );
}

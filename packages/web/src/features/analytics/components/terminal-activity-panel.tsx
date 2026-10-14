'use client';

import { useState } from 'react';
import { Terminal, XCircle, FlaskConical, Hammer, Bug, Package, GitBranch } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';

import { useCommandsBreakdown, type DateRange } from '../hooks';

type KindFilter = 'all' | 'test' | 'build' | 'lint' | 'install' | 'git';

const KIND_LABELS: Record<KindFilter, string> = {
  all: 'All',
  test: 'Tests',
  build: 'Builds',
  lint: 'Lint',
  install: 'Install',
  git: 'Git',
};

function kindIcon(kind: string) {
  switch (kind) {
    case 'test':
      return <FlaskConical className="h-3.5 w-3.5" strokeWidth={1.5} />;
    case 'build':
      return <Hammer className="h-3.5 w-3.5" strokeWidth={1.5} />;
    case 'lint':
      return <Bug className="h-3.5 w-3.5" strokeWidth={1.5} />;
    case 'install':
      return <Package className="h-3.5 w-3.5" strokeWidth={1.5} />;
    case 'git':
      return <GitBranch className="h-3.5 w-3.5" strokeWidth={1.5} />;
    default:
      return <Terminal className="h-3.5 w-3.5" strokeWidth={1.5} />;
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 1) return `${String(ms)}ms`;
  if (seconds < 60) return `${String(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes)}m ${String(seconds % 60)}s`;
}

function successColorClass(rate: number): string {
  if (rate >= 90) return 'text-brand';
  if (rate >= 60) return 'text-yellow-amber';
  return 'text-red-coral';
}

export function TerminalActivityPanel({ range }: { range: DateRange }) {
  const { data, isLoading } = useCommandsBreakdown(range);
  const [filter, setFilter] = useState<KindFilter>('all');

  const allCommands = data?.commands ?? [];
  const commands = filter === 'all' ? allCommands : allCommands.filter((c) => c.kind === filter);

  const availableKinds = new Set(allCommands.map((c) => c.kind));

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Terminal activity</PanelTitle>
          <PanelDescription>Commands and tasks you ran</PanelDescription>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {(Object.keys(KIND_LABELS) as Array<KindFilter>)
            .filter((k) => k === 'all' || availableKinds.has(k))
            .map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  filter === k
                    ? 'bg-gray-alpha-200 text-foreground'
                    : 'text-subtle hover:bg-gray-alpha-100 hover:text-secondary',
                )}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
        </div>
      </PanelHeader>

      <PanelContent className="flex flex-col">
        <div className="mb-2 grid grid-cols-12 gap-4 border-b border-border pb-2 text-xs font-medium uppercase tracking-wider text-subtle">
          <div className="col-span-6">Command</div>
          <div className="col-span-2 text-right">Runs</div>
          <div className="col-span-2 text-right">Avg</div>
          <div className="col-span-2 text-right">Success</div>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <span className="animate-pulse text-sm text-secondary">Loading…</span>
          </div>
        )}

        {!isLoading && commands.length === 0 && (
          <div className="py-8 text-center">
            <span className="text-sm text-secondary">
              {allCommands.length === 0
                ? 'No terminal commands tracked yet'
                : `No ${KIND_LABELS[filter]} commands`}
            </span>
          </div>
        )}

        {commands.map((cmd, i) => (
          <div
            key={`${cmd.kind}-${cmd.command}`}
            className={cn(
              'relative grid grid-cols-12 items-center gap-4 py-3 text-sm transition-colors',
              '-mx-2 rounded-lg px-2 hover:bg-gray-alpha-50',
              i !== commands.length - 1 &&
                'after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-border',
            )}
          >
            <div className="col-span-6 flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-subtle">{kindIcon(cmd.kind)}</span>
              <span className="truncate font-mono text-xs text-foreground" title={cmd.command}>
                {cmd.command}
              </span>
              {cmd.failedRuns > 0 && (
                <XCircle
                  className="h-3.5 w-3.5 shrink-0 text-red-coral"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              )}
            </div>

            <div className="col-span-2 text-right font-mono text-xs tabular-nums text-secondary">
              {cmd.runs}
            </div>

            <div className="col-span-2 text-right font-mono text-xs tabular-nums text-subtle">
              {formatDuration(cmd.avgDurationMs)}
            </div>

            <div
              className={cn(
                'col-span-2 text-right font-mono text-xs font-medium tabular-nums',
                successColorClass(cmd.successRate),
              )}
            >
              {cmd.successRate}%
            </div>
          </div>
        ))}
      </PanelContent>
    </Panel>
  );
}

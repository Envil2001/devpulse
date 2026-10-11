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
      return <FlaskConical className="h-3.5 w-3.5" />;
    case 'build':
      return <Hammer className="h-3.5 w-3.5" />;
    case 'lint':
      return <Bug className="h-3.5 w-3.5" />;
    case 'install':
      return <Package className="h-3.5 w-3.5" />;
    case 'git':
      return <GitBranch className="h-3.5 w-3.5" />;
    default:
      return <Terminal className="h-3.5 w-3.5" />;
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
  if (rate >= 90) return 'text-green-spring';
  if (rate >= 60) return 'text-yellow-400';
  return 'text-red-coral';
}

export function TerminalActivityPanel({ range }: { range: DateRange }) {
  const { data, isLoading } = useCommandsBreakdown(range);
  const [filter, setFilter] = useState<KindFilter>('all');

  const allCommands = data?.commands ?? [];
  const commands = filter === 'all'
    ? allCommands
    : allCommands.filter((c) => c.kind === filter);

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
                  'rounded-md px-2.5 py-1 text-xs transition-colors',
                  filter === k
                    ? 'bg-white/10 text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-300',
                )}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
        </div>
      </PanelHeader>

      <PanelContent className="flex flex-col">
        <div className="label-caps mb-2 grid grid-cols-12 gap-4 border-b border-white/5 pb-2">
          <div className="col-span-6">COMMAND</div>
          <div className="col-span-2 text-right">RUNS</div>
          <div className="col-span-2 text-right">AVG</div>
          <div className="col-span-2 text-right">SUCCESS</div>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <span className="body-muted animate-pulse">Loading…</span>
          </div>
        )}

        {!isLoading && commands.length === 0 && (
          <div className="py-8 text-center">
            <span className="body-muted">
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
              'grid grid-cols-12 items-center gap-4 py-3 text-sm transition-colors',
              i !== commands.length - 1 && 'border-b border-white/5',
              'hover:bg-white/2 -mx-2 rounded-lg px-2',
            )}
          >
            <div className="col-span-6 flex min-w-0 items-center gap-2">
              <span className="text-neutral-500 shrink-0">{kindIcon(cmd.kind)}</span>
              <span className="mono-sm truncate text-neutral-200" title={cmd.command}>
                {cmd.command}
              </span>
              {cmd.failedRuns > 0 && (
                <XCircle className="h-3.5 w-3.5 shrink-0 text-red-coral" aria-hidden="true" />
              )}
            </div>

            <div className="mono-sm col-span-2 text-right text-neutral-300">
              {cmd.runs}
            </div>

            <div className="mono-sm col-span-2 text-right text-neutral-400">
              {formatDuration(cmd.avgDurationMs)}
            </div>

            <div className={cn('mono-sm col-span-2 text-right', successColorClass(cmd.successRate))}>
              {cmd.successRate}%
            </div>
          </div>
        ))}
      </PanelContent>
    </Panel>
  );
}
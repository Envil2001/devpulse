'use client';

import { GitBranch } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';
import { useBranchesDistribution, type DateRange } from '../hooks';
import { formatDuration } from '@devpulse/lib';

export function BranchesPanel({ range, projectId }: { range: DateRange; projectId?: string }) {
  const { data: branches = [], isLoading } = useBranchesDistribution(range, projectId);

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Branches</PanelTitle>
          <PanelDescription>Where you spent time</PanelDescription>
        </div>
      </PanelHeader>

      <PanelContent className="flex flex-col">
        <div className="mb-2 grid grid-cols-12 gap-4 border-b border-border pb-2 text-xs font-medium uppercase tracking-wider text-subtle">
          <div className="col-span-8">Branch</div>
          <div className="col-span-4 text-right">Active Time</div>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <span className="animate-pulse text-sm text-secondary">Loading…</span>
          </div>
        )}

        {!isLoading && branches.length === 0 && (
          <div className="py-8 text-center">
            <span className="text-sm text-secondary">No branches</span>
          </div>
        )}

        {branches.map((branch, i) => (
          <div
            key={branch.branchName}
            className={cn(
              'relative grid grid-cols-12 items-center gap-4 py-3.5 text-sm transition-colors',
              '-mx-2 rounded-lg px-2 hover:bg-gray-alpha-50',
              i !== branches.length - 1 &&
                'after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-border',
            )}
          >
            <div className="col-span-8 flex min-w-0 items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-gray-alpha-50 px-2.5 py-1 font-mono text-xs text-foreground">
                <GitBranch className="h-3 w-3 text-subtle" strokeWidth={1.5} aria-hidden="true" />
                {branch.branchName}
              </span>
            </div>
            <div className="col-span-4 text-right font-mono text-xs font-medium tabular-nums text-foreground">
              {formatDuration(branch.activeSeconds / 1000)}
            </div>
          </div>
        ))}
      </PanelContent>
    </Panel>
  );
}

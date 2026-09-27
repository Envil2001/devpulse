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

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function BranchesPanel({ range }: { range: DateRange }) {
  const { data: branches = [], isLoading } = useBranchesDistribution(range);

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Branches</PanelTitle>
          <PanelDescription>Where you spent time</PanelDescription>
        </div>
      </PanelHeader>

      <PanelContent className="flex flex-col">
        <div className="label-caps mb-2 grid grid-cols-12 gap-4 border-b border-white/5 pb-2">
          <div className="col-span-8">BRANCH</div>
          <div className="col-span-4 text-right">ACTIVE TIME</div>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <span className="body-muted animate-pulse">Loading…</span>
          </div>
        )}
        {!isLoading && branches.length === 0 && (
          <div className="py-8 text-center">
            <span className="body-muted">No branches</span>
          </div>
        )}

        {branches.map((branch, i) => (
          <div
            key={branch.branchName}
            className={cn(
              'grid grid-cols-12 items-center gap-4 py-3.5 text-sm transition-colors',
              i !== branches.length - 1 && 'border-b border-white/5',
              'hover:bg-white/2 -mx-2 rounded-lg px-2',
            )}
          >
            <div className="col-span-8 flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/3 px-3 py-0.5 text-xs text-neutral-300 font-mono">
                <GitBranch className="h-3 w-3 text-neutral-500" />
                {branch.branchName}
              </span>
            </div>
            <div className="mono-sm col-span-4 text-right text-neutral-200">
              {formatDuration(branch.activeSeconds)}
            </div>
          </div>
        ))}
      </PanelContent>
    </Panel>
  );
}

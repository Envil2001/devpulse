'use client';

import { formatDuration } from '@devpulse/lib';
import { Braces, GitBranch } from 'lucide-react';
import { type JSX } from 'react/jsx-runtime';

import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from '@/shared/components/layout/panel';

import { type DateRange, useBranchesDistribution, useLanguagesBreakdown } from '../hooks';

interface WorkspaceBreakdownPanelProps {
  range: DateRange;
  projectId?: string;
}

export function WorkspaceBreakdownPanel({
  range,
  projectId,
}: WorkspaceBreakdownPanelProps): JSX.Element {
  const { data: branches = [], isLoading: branchesLoading } = useBranchesDistribution(
    range,
    projectId,
  );
  const { data: languages, isLoading: languagesLoading } = useLanguagesBreakdown(projectId);
  const isLoading = branchesLoading || languagesLoading;

  return (
    <Panel className="h-full">
      <PanelHeader>
        <div>
          <PanelTitle>Workspace mix</PanelTitle>
          <PanelDescription>Languages and branches at a glance</PanelDescription>
        </div>
      </PanelHeader>

      <PanelContent>
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-secondary">
            Loading breakdown…
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
                <Braces className="h-3.5 w-3.5" strokeWidth={1.5} /> Languages
              </div>
              <div className="space-y-3">
                {(languages?.languages ?? []).slice(0, 4).map((language) => (
                  <div key={language.language}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-medium text-foreground capitalize">
                        {language.language}
                      </span>
                      <span className="font-mono text-subtle tabular-nums">
                        {language.percentage}%
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${String(language.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(languages?.languages.length ?? 0) === 0 && (
                  <p className="text-xs text-subtle">No language activity yet</p>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
                <GitBranch className="h-3.5 w-3.5" strokeWidth={1.5} /> Branches
              </div>
              <div className="divide-y divide-border">
                {branches.slice(0, 5).map((branch) => (
                  <div
                    key={branch.branchName}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="truncate font-mono text-xs text-secondary">
                      {branch.branchName}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-foreground tabular-nums">
                      {formatDuration(branch.activeSeconds)}
                    </span>
                  </div>
                ))}
                {branches.length === 0 && (
                  <p className="py-2.5 text-xs text-subtle">No branch activity yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </PanelContent>
    </Panel>
  );
}

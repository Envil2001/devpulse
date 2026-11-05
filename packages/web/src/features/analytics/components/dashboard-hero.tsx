'use client';

import { formatDuration } from '@devpulse/lib';
import { Activity, Code2, Radio } from 'lucide-react';
import { type ReactNode } from 'react';
import { type JSX } from 'react/jsx-runtime';

import { type LiveStatus } from '@/shared/types';

interface DashboardHeroProps {
  displayName: string;
  liveStatus?: LiveStatus;
  controls: ReactNode;
}

export function DashboardHero({
  displayName,
  liveStatus,
  controls,
}: DashboardHeroProps): JSX.Element {
  const firstName = displayName.trim().split(/\s+/, 1)[0] || displayName;
  const isLive = liveStatus?.isCodingNow === true;

  return (
    <section className="dashboard-hero relative isolate overflow-hidden rounded-3xl border border-white/[0.08] px-5 py-6 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
      <div className="relative z-10 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="max-w-3xl">
          <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-medium tracking-[0.22em] text-brand uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_12px_var(--color-brand-glow)]" />
            Personal workspace
          </div>
          <h1 className="max-w-2xl text-3xl leading-[1.05] font-medium tracking-[-0.04em] text-foreground sm:text-4xl lg:text-[3.2rem]">
            Your work,
            <span className="text-secondary"> in motion.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-secondary sm:text-base">
            Welcome back, {firstName}. A quieter view of the signals that shaped your development
            rhythm.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
              Current signal
            </span>
            <span
              className={
                isLive
                  ? 'inline-flex items-center gap-1.5 text-xs font-medium text-brand'
                  : 'inline-flex items-center gap-1.5 text-xs font-medium text-subtle'
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isLive ? 'bg-brand shadow-[0_0_8px_var(--color-brand-glow)]' : 'bg-subtle'
                }`}
              />
              {isLive ? 'Coding now' : 'Awaiting activity'}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-3">
              <span className="flex items-center gap-2 text-xs text-subtle">
                <Activity className="h-3.5 w-3.5" strokeWidth={1.5} /> Project
              </span>
              <span className="truncate text-right text-sm font-medium text-foreground">
                {liveStatus?.currentProject ?? 'No live project'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-3">
              <span className="flex items-center gap-2 text-xs text-subtle">
                <Code2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Language
              </span>
              <span className="text-sm font-medium text-foreground capitalize">
                {liveStatus?.currentLanguage ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-xs text-subtle">
                <Radio className="h-3.5 w-3.5" strokeWidth={1.5} /> Session
              </span>
              <span className="font-mono text-sm font-medium text-foreground tabular-nums">
                {liveStatus?.currentSessionDurationSeconds
                  ? formatDuration(liveStatus.currentSessionDurationSeconds)
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-8 flex flex-col gap-3 border-t border-white/[0.07] pt-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Perspective
          </div>
          <p className="mt-1 text-xs text-secondary">Shape every insight with one shared filter.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">{controls}</div>
      </div>
    </section>
  );
}

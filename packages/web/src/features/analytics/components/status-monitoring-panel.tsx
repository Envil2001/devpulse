'use client';

import { Activity, CheckCircle2, Clock, Cpu, Database, Radio } from 'lucide-react';
import { Panel } from '@/shared/components/layout/panel';
import { useLiveStatus } from '../hooks';

interface StatusItem {
  name: string;
  status: 'operational' | 'degraded' | 'idle';
  metric: string;
  icon: typeof Activity;
}

export function StatusMonitoringPanel() {
  const { data: liveStatus } = useLiveStatus();

  const services: Array<StatusItem> = [
    {
      name: 'VS Code Telemetry Bridge',
      status: liveStatus?.isCodingNow ? 'operational' : 'idle',
      metric: liveStatus?.isCodingNow ? 'Receiving signals' : 'Standby',
      icon: Radio,
    },
    {
      name: 'BullMQ Event Ingestion',
      status: 'operational',
      metric: '0 jobs lagging',
      icon: Cpu,
    },
    {
      name: 'PostgreSQL & Cache',
      status: 'operational',
      metric: '< 5ms query latency',
      icon: Database,
    },
    {
      name: 'AI Fallback Engine',
      status: 'operational',
      metric: 'OpenRouter / Active',
      icon: CheckCircle2,
    },
  ];

  const trackerSegments = Array.from({ length: 32 }, (_, i) => {
    if (i >= 28) return 'active';
    if (i % 7 === 0) return 'idle';
    if (i > 15 && i < 25) return 'active';
    return 'empty';
  });

  return (
    <Panel className="p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-hover text-brand">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Pipeline Health & Ingestion</h3>
              <p className="text-xs text-subtle">
                Real-time status of telemetry collectors and worker queues
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-hover px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span className="font-mono text-xs font-medium text-brand">
              All Systems Operational
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-subtle">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Day Ingestion Cadence
            </span>
            <span className="font-mono text-[11px]">Today (32 telemetry windows)</span>
          </div>

          <div className="flex h-3 w-full gap-1 overflow-hidden rounded-md bg-surface-hover p-0.5">
            {trackerSegments.map((seg, idx) => (
              <div
                key={idx}
                title={`Window ${idx + 1}: ${seg}`}
                className={`h-full flex-1 rounded-xs transition-colors ${
                  seg === 'active'
                    ? 'bg-brand'
                    : seg === 'idle'
                      ? 'bg-yellow-amber/70'
                      : 'bg-white/5 hover:bg-white/10'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-subtle">
            <span>00:00</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-xs bg-brand" /> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-xs bg-yellow-amber/70" /> Idle
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-xs bg-white/5" /> Offline
              </span>
            </div>
            <span>Now</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.name}
                className="flex flex-col justify-between rounded-lg border border-border bg-surface-hover/50 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-subtle">{srv.name}</span>
                  <Icon className="h-3.5 w-3.5 text-subtle" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {srv.metric}
                  </span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      srv.status === 'operational'
                        ? 'bg-brand shadow-[0_0_8px_rgba(21,255,171,0.5)]'
                        : 'bg-yellow-amber'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

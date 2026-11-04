export interface PipelineHealth {
  telemetryBridge: {
    status: 'operational' | 'idle';
    lastEventAt: Date | null;
    minutesSinceLastEvent: number | null;
  };
  bullmq: {
    waiting: number;
    active: number;
    failed: number;
    status: 'operational' | 'degraded';
  };
  postgres: {
    latencyMs: number;
    status: 'operational' | 'degraded';
  };
  llm: {
    status: 'operational' | 'unconfigured';
    provider: 'openrouter' | 'openai' | 'custom' | null;
    model: string | null;
  };
}

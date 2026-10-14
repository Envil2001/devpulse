interface ActivityChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
  }>;
  label?: string;
}

export function ActivityChartTooltip({ active, payload, label }: ActivityChartTooltipProps) {
  if (!active || !payload?.length || payload[0].value === undefined) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-lg">
      <p className="text-xs font-medium text-subtle">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {payload[0].value}h
        </span>
        <span className="text-xs text-subtle">active time</span>
      </div>
    </div>
  );
}

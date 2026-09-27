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
    <div className="rounded-xl border border-white/10 bg-neutral-950/90 p-3 shadow-xl backdrop-blur-md">
      <p className="caption font-medium">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-spring" aria-hidden="true" />
        <span className="font-mono text-sm font-semibold text-neutral-100">
          {payload[0].value}h
        </span>
        <span className="caption">active time</span>
      </div>
    </div>
  );
}

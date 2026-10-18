'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { formatDuration } from '@devpulse/lib';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';

import { useAnalyticsTimeseries, type DateRange } from '../hooks';

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;

const HOUR_1 = 3600;
const HOUR_2 = 7200;
const HOUR_4 = 14400;

function intensity(seconds: number): 0 | 1 | 2 | 3 | 4 {
  if (seconds <= 0) return 0;
  if (seconds < HOUR_1) return 1;
  if (seconds < HOUR_2) return 2;
  if (seconds < HOUR_4) return 3;
  return 4;
}

function fillFor(level: 0 | 1 | 2 | 3 | 4): string {
  switch (level) {
    case 0:
      return 'rgba(255,255,255,0.03)';
    case 1:
      return 'rgba(21,255,171,0.18)';
    case 2:
      return 'rgba(21,255,171,0.4)';
    case 3:
      return 'rgba(21,255,171,0.68)';
    case 4:
      return 'rgba(21,255,171,1)';
  }
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface Cell {
  date: string;
  dow: number;
  week: number;
  seconds: number;
  inYear: boolean;
}

interface MonthMarker {
  week: number;
  label: string;
}

interface YearGrid {
  cells: Array<Cell>;
  weeks: number;
  months: Array<MonthMarker>;
}

function buildYearGrid(year: number, seriesByDate: Map<string, number>): YearGrid {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const startDow = (yearStart.getDay() + 6) % 7; // Monday=0
  const gridStart = new Date(yearStart);
  gridStart.setDate(gridStart.getDate() - startDow);

  const endDow = (yearEnd.getDay() + 6) % 7;
  const gridEnd = new Date(yearEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - endDow));

  const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86_400_000) + 1;
  const weeks = totalDays / 7;

  const cells: Array<Cell> = [];
  const months: Array<MonthMarker> = [];

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);

    const dow = (d.getDay() + 6) % 7;
    const week = Math.floor(i / 7);
    const iso = toIsoDate(d);
    const inYear = d.getFullYear() === year;

    if (inYear && d.getDate() === 1) {
      months.push({
        week,
        label: d.toLocaleString('en-US', { month: 'short' }),
      });
    }

    cells.push({
      date: iso,
      dow,
      week,
      seconds: inYear ? (seriesByDate.get(iso) ?? 0) : 0,
      inYear,
    });
  }

  return { cells, weeks, months };
}

interface StreakStats {
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
}

function computeStreaks(cells: Array<Cell>): StreakStats {
  const inYear = cells.filter((c) => c.inYear).sort((a, b) => a.date.localeCompare(b.date));

  let activeDays = 0;
  let longest = 0;
  let run = 0;

  for (const c of inYear) {
    if (c.seconds > 0) {
      activeDays++;
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  const today = toIsoDate(new Date());
  const yesterday = toIsoDate(new Date(Date.now() - 86_400_000));

  let anchor = -1;
  for (let i = inYear.length - 1; i >= 0; i--) {
    const c = inYear[i];
    if (c.date !== today && c.date !== yesterday) continue;
    if (c.seconds > 0) {
      anchor = i;
      break;
    }
    break;
  }

  let current = 0;
  if (anchor >= 0) {
    for (let i = anchor; i >= 0 && inYear[i].seconds > 0; i--) current++;
  }

  return { activeDays, currentStreak: current, longestStreak: longest };
}

interface HeatmapPanelProps {
  projectId?: string;
}

export function HeatmapPanel({ projectId }: HeatmapPanelProps) {
  const wideRange: DateRange = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setFullYear(start.getFullYear() - 5);
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, []);

  const { data: series = [], isLoading } = useAnalyticsTimeseries(wideRange, projectId);

  const seriesByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of series) m.set(p.date, p.activeSeconds);
    return m;
  }, [series]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    const currentYear = new Date().getFullYear();
    set.add(currentYear);
    for (const p of series) {
      if (p.activeSeconds > 0) set.add(new Date(p.date).getFullYear());
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [series]);

  const [userSelectedYear, setUserSelectedYear] = useState<number | null>(null);

  const effectiveYear = useMemo(() => {
    if (userSelectedYear !== null) return userSelectedYear;
    const currentYear = new Date().getFullYear();
    const hasCurrent = series.some(
      (p) => p.activeSeconds > 0 && new Date(p.date).getFullYear() === currentYear,
    );
    if (hasCurrent) return currentYear;
    const yearsWithData = series
      .filter((p) => p.activeSeconds > 0)
      .map((p) => new Date(p.date).getFullYear());
    if (yearsWithData.length === 0) return currentYear;
    return Math.max(...yearsWithData);
  }, [series, userSelectedYear]);

  const grid = useMemo(
    () => buildYearGrid(effectiveYear, seriesByDate),
    [effectiveYear, seriesByDate],
  );

  const streaks = useMemo(() => computeStreaks(grid.cells), [grid.cells]);

  if (isLoading) {
    return (
      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Activity heatmap</PanelTitle>
            <PanelDescription>Daily coding intensity</PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent>
          <div className="py-12 text-center">
            <span className="animate-pulse text-sm text-secondary">Loading…</span>
          </div>
        </PanelContent>
      </Panel>
    );
  }

  if (series.length === 0) {
    return null;
  }

  const svgWidth = grid.weeks * STEP;
  const svgHeight = 7 * STEP;
  const leftPad = 24;
  const topPad = 18;

  const isEmptyYear = streaks.activeDays === 0;

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Activity heatmap</PanelTitle>
          <PanelDescription>
            {isEmptyYear
              ? `No activity in ${String(effectiveYear)}`
              : `${String(streaks.activeDays)} active days in ${String(effectiveYear)}`}
          </PanelDescription>
        </div>

        <div className="flex items-center gap-1">
          {availableYears.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setUserSelectedYear(y)}
              className={cn(
                'rounded-md px-2.5 py-1 font-mono text-xs tabular-nums transition-colors',
                effectiveYear === y
                  ? 'bg-white/10 text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-300',
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </PanelHeader>

      <PanelContent>
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth + leftPad} ${svgHeight + topPad}`}
              className="h-auto w-full min-w-125"
              role="img"
              aria-label={`Activity heatmap for ${String(effectiveYear)}`}
            >
              {grid.months.map((m) => (
                <text
                  key={`${m.week}-${m.label}`}
                  x={leftPad + m.week * STEP}
                  y={10}
                  className="fill-neutral-500"
                  style={{ fontSize: 9 }}
                >
                  {m.label}
                </text>
              ))}

              {(['Mon', 'Wed', 'Fri'] as const).map((label, i) => (
                <text
                  key={label}
                  x={0}
                  y={topPad + i * 2 * STEP + CELL - 1}
                  className="fill-neutral-500"
                  style={{ fontSize: 9 }}
                >
                  {label}
                </text>
              ))}

              {grid.cells
                .filter((c) => c.inYear)
                .map((c) => {
                  const level = intensity(c.seconds);
                  return (
                    <rect
                      key={c.date}
                      x={leftPad + c.week * STEP}
                      y={topPad + c.dow * STEP}
                      width={CELL}
                      height={CELL}
                      rx={2}
                      fill={fillFor(level)}
                    >
                      <title>
                        {c.date}: {formatDuration(c.seconds)}
                      </title>
                    </rect>
                  );
                })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-subtle">
              <span>
                <span className="text-secondary">Current streak:</span>{' '}
                <span className="font-mono text-foreground tabular-nums">
                  {streaks.currentStreak}
                </span>{' '}
                {streaks.currentStreak === 1 ? 'day' : 'days'}
              </span>
              <span>
                <span className="text-secondary">Longest:</span>{' '}
                <span className="font-mono text-foreground tabular-nums">
                  {streaks.longestStreak}
                </span>{' '}
                {streaks.longestStreak === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-subtle">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((l) => (
                <span
                  key={l}
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: fillFor(l as 0 | 1 | 2 | 3 | 4) }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </PanelContent>
    </Panel>
  );
}

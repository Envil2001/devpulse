'use client';

import { AlertTriangle, Clock3, Focus, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getDashboardSummary } from '@/lib/analytics-client';
import { ApiClientError } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-storage';

interface DashboardSummaryState {
  totalHours: number;
  focusScore: number;
  sessionCount: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryState>({
    totalHours: 0,
    focusScore: 0,
    sessionCount: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();

    if (token === null) {
      return;
    }

    void (async () => {
      try {
        const data = await getDashboardSummary(token);

        setSummary({
          totalHours: data.totalHours,
          focusScore: data.focusScore,
          sessionCount: data.sessionCount,
        });
      } catch (fetchError) {
        if (fetchError instanceof ApiClientError) {
          setError(fetchError.message);
        } else {
          setError('Failed to load analytics');
        }
      }
    })();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="card-shell rounded-xl p-4 lg:col-span-2">
        <div className="border-(--color-border) rounded-lg border p-3">
          <p className="text-(--color-text-muted) text-xs font-medium uppercase tracking-wide">
            Weekly Summary
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="bg-(--color-surface-muted) rounded-lg p-3">
              <p className="text-(--color-text-muted) inline-flex items-center gap-1 text-sm">
                <Clock3 size={14} />
                Total Hours
              </p>
              <p className="text-(--color-text) mt-2 text-2xl font-semibold">
                {summary.totalHours.toFixed(2)}h
              </p>
            </article>
            <article className="bg-(--color-surface-muted) rounded-lg p-3">
              <p className="text-(--color-text-muted) inline-flex items-center gap-1 text-sm">
                <Focus size={14} />
                Focus Score
              </p>
              <p className="text-(--color-success) mt-2 text-2xl font-semibold">
                {summary.focusScore.toFixed(1)}%
              </p>
            </article>
            <article className="bg-(--color-surface-muted) rounded-lg p-3">
              <p className="text-(--color-text-muted) inline-flex items-center gap-1 text-sm">
                <AlertTriangle size={14} />
                Sessions
              </p>
              <p className="text-(--color-warning) mt-2 text-2xl font-semibold">
                {summary.sessionCount}
              </p>
            </article>
          </div>
          {error !== null && (
            <p className="bg-(--color-primary-soft) text-(--color-danger) mt-3 rounded-lg px-3 py-2 text-sm">
              {error}
            </p>
          )}
        </div>
      </section>

      <section className="card-shell rounded-xl p-4">
        <h2 className="text-(--color-text-muted) inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide">
          <Sparkles size={14} />
          State Palette Preview
        </h2>
        <div className="mt-3 space-y-2">
          <button
            className="ui-button-primary w-full px-3 py-2 text-sm font-semibold"
            type="button"
          >
            Primary Default
          </button>
          <button
            className="border-(--color-border) bg-(--color-surface-muted) text-(--color-text) hover:bg-(--color-primary-soft) w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            type="button"
          >
            Secondary Hoverable
          </button>
          <button
            disabled
            className="ui-button-primary w-full px-3 py-2 text-sm font-semibold"
            type="button"
          >
            Disabled
          </button>
        </div>
      </section>
    </div>
  );
}

'use client';

import { AlertTriangle, Clock3, Focus, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ApiClientError } from '@/lib/api-client';
import { getDashboardSummary } from '@/lib/analytics-client';
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
        <div className="rounded-lg border border-(--color-border) p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
            Weekly Summary
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-lg bg-(--color-surface-muted) p-3">
              <p className="inline-flex items-center gap-1 text-sm text-(--color-text-muted)">
                <Clock3 size={14} />
                Total Hours
              </p>
              <p className="mt-2 text-2xl font-semibold text-(--color-text)">
                {summary.totalHours.toFixed(2)}h
              </p>
            </article>
            <article className="rounded-lg bg-(--color-surface-muted) p-3">
              <p className="inline-flex items-center gap-1 text-sm text-(--color-text-muted)">
                <Focus size={14} />
                Focus Score
              </p>
              <p className="mt-2 text-2xl font-semibold text-(--color-success)">
                {summary.focusScore.toFixed(1)}%
              </p>
            </article>
            <article className="rounded-lg bg-(--color-surface-muted) p-3">
              <p className="inline-flex items-center gap-1 text-sm text-(--color-text-muted)">
                <AlertTriangle size={14} />
                Sessions
              </p>
              <p className="mt-2 text-2xl font-semibold text-(--color-warning)">
                {summary.sessionCount}
              </p>
            </article>
          </div>
          {error !== null && (
            <p className="mt-3 rounded-lg bg-(--color-primary-soft) px-3 py-2 text-sm text-(--color-danger)">
              {error}
            </p>
          )}
        </div>
      </section>

      <section className="card-shell rounded-xl p-4">
        <h2 className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">
          <Sparkles size={14} />
          State Palette Preview
        </h2>
        <div className="mt-3 space-y-2">
          <button type="button" className="ui-button-primary w-full px-3 py-2 text-sm font-semibold">
            Primary Default
          </button>
          <button
            type="button"
            className="w-full rounded-lg border border-(--color-border) bg-(--color-surface-muted) px-3 py-2 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-primary-soft)"
          >
            Secondary Hoverable
          </button>
          <button
            type="button"
            disabled
            className="ui-button-primary w-full px-3 py-2 text-sm font-semibold"
          >
            Disabled
          </button>
        </div>
      </section>
    </div>
  );
}

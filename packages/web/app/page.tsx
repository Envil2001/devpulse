import { AlertTriangle, Clock3, Focus, Sparkles } from 'lucide-react';

export default function Home() {
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
              <p className="mt-2 text-2xl font-semibold text-(--color-text)">32.4h</p>
            </article>
            <article className="rounded-lg bg-(--color-surface-muted) p-3">
              <p className="inline-flex items-center gap-1 text-sm text-(--color-text-muted)">
                <Focus size={14} />
                Focus Score
              </p>
              <p className="mt-2 text-2xl font-semibold text-(--color-success)">84.2%</p>
            </article>
            <article className="rounded-lg bg-(--color-surface-muted) p-3">
              <p className="inline-flex items-center gap-1 text-sm text-(--color-text-muted)">
                <AlertTriangle size={14} />
                Context Switches
              </p>
              <p className="mt-2 text-2xl font-semibold text-(--color-warning)">17</p>
            </article>
          </div>
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

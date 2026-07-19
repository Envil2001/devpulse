'use client';

import { useState } from 'react';
import { TimeSwitcher } from '@/components/analytics/analytics/time-switcher';

export default function DashboardPage() {
  const [period, setPeriod] = useState('7d');

  return (
    <div className="flex flex-col gap-4 pb-10">
      <header className="mb-2 flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="h4 text-neutral-100">Hello, Andrey</h1>
          <div className="body1 flex items-center gap-2">
            <span className="text-neutral-400">13 – 19 July</span>
            <span className="h-1.5 w-1.5 rounded-full bg-green-spring shadow-[0_0_8px_rgba(21,255,171,0.6)]" />
            <span className="text-green-spring">Tracking now</span>
          </div>
        </div>
        <TimeSwitcher value={period} onValueChange={setPeriod} />
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex justify-between gap-4 rounded-xl bg-neutral-900 p-4">
          <div className="flex flex-col justify-between">
            <span className="body1 text-neutral-200">Active Time</span>
            <div className="flex items-baseline gap-2">
              <span className="h6 text-neutral-100">24h 38m</span>
              <span className="indicator inline-flex items-center gap-0.5 text-green-spring">
                ↑ 12%
              </span>
            </div>
            <span className="desc text-neutral-600">vs last week</span>
          </div>
          <div className="flex h-20 items-end gap-0.75"></div>
        </div>

        <div className="flex justify-between gap-4 rounded-xl bg-neutral-900 p-4">
          <div className="flex flex-col justify-between">
            <span className="body1 text-neutral-200">Average Focus Score</span>
            <div className="flex items-baseline gap-2">
              <span className="h6 text-neutral-100">79%</span>
              <span className="indicator inline-flex items-center gap-0.5 text-green-spring">
                ↑ 12%
              </span>
            </div>
            <span className="desc text-neutral-600">vs last week</span>
          </div>
        </div>

        <div className="flex justify-between gap-4 rounded-xl bg-neutral-900 p-4">
          <div className="flex flex-col justify-between">
            <span className="body1 text-neutral-200">Best Focus Block</span>
            <div className="flex items-baseline gap-2">
              <span className="h6 text-neutral-100">6h 51m</span>
              <span className="indicator text-neutral-400">≈ normal</span>
            </div>
            <span className="desc text-neutral-600">longest deep work</span>
          </div>
        </div>

        <div className="flex justify-between gap-4 rounded-xl bg-neutral-900 p-4">
          <div className="flex flex-col justify-between">
            <span className="body1 text-neutral-200">Idle Time</span>
            <div className="flex items-baseline gap-2">
              <span className="h6 text-neutral-100">6h 51m</span>
              <span className="indicator text-neutral-400">Thu, 14:20–16:07</span>
            </div>
            <span className="desc text-neutral-600">longest idle</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-60 flex-col rounded-xl bg-neutral-900 p-6">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="h4 text-neutral-100">This Week</h2>
          <span className="desc text-neutral-400">Active time and idle by day</span>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30">
          <span className="desc text-neutral-600">Recharts Bar Chart</span>
        </div>
      </div>

      <div className="flex min-h-45 flex-col rounded-xl bg-neutral-900 p-6">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="h4 text-neutral-100">Today</h2>
          <span className="desc text-neutral-400">09:00 – 19:00 · hatched = idle</span>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30">
          <span className="desc text-neutral-600">Horizontal Timeline</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl bg-neutral-900 p-6">
          <div className="mb-6 flex items-center gap-2">
            <span className="mini text-neutral-400">FOCUS & SWITCHES</span>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <span className="body1 text-neutral-300">Context switches today</span>
              <span className="body2 text-neutral-100">23 times</span>
            </div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <span className="body1 text-neutral-300">Editor / Terminal time</span>
              <span className="body2 text-neutral-100">78% / 22%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="body1 text-neutral-300">Activity spikes &lt; 2 min</span>
              <span className="body2 text-neutral-100">3</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-xl bg-neutral-900 p-6">
          <div className="mb-6">
            <span className="mini text-neutral-400">WHERE YOU LOST TIME</span>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full border border-orange-signal" />
                <div className="flex flex-col">
                  <span className="body1 text-neutral-100">14:12 – 14:54</span>
                  <span className="desc text-neutral-500">between sessions · devpulse-backend</span>
                </div>
              </div>
              <span className="body2 text-neutral-300">42 min</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full border border-orange-signal" />
                <div className="flex flex-col">
                  <span className="body1 text-neutral-100">11:30 – 11:45</span>
                  <span className="desc text-neutral-500">window focus lost</span>
                </div>
              </div>
              <span className="body2 text-neutral-300">15 min</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full border border-orange-signal" />
                <div className="flex flex-col">
                  <span className="body1 text-neutral-100">Wed, 16:20 – 17:38</span>
                  <span className="desc text-neutral-500">possible system sleep</span>
                </div>
              </div>
              <span className="body2 text-neutral-300">1h 18m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-xl bg-neutral-900 p-6">
        <div className="mb-6">
          <span className="mini text-neutral-400">BRANCHES THIS WEEK</span>
        </div>

        <div className="flex flex-col">
          <div className="mb-3 grid grid-cols-12 gap-4 border-b border-neutral-800 pb-2 text-xs text-neutral-500">
            <div className="col-span-3">BRANCH</div>
            <div className="col-span-3">PROJECT</div>
            <div className="col-span-2">TIME</div>
            <div className="col-span-2">FOCUS</div>
            <div className="col-span-2">LAST ACTIVE</div>
          </div>

          {[
            {
              branch: 'feature/telemetry-worker',
              color: 'bg-blue-electric',
              project: 'devpulse-backend',
              time: '2h 10m',
              focus: '88%',
              focusColor: 'text-green-spring',
              last: 'Today, 18:12',
            },
            {
              branch: 'fix/game-card-pricing',
              color: 'bg-purple-aspid',
              project: 'playmanity-storefront',
              time: '1h 05m',
              focus: '79%',
              focusColor: 'text-neutral-300',
              last: 'Today, 13:40',
            },
            {
              branch: 'feature/dashboard-mockup',
              color: 'bg-green-spring',
              project: 'devpulse-dashboard',
              time: '0h 57m',
              focus: '91%',
              focusColor: 'text-green-spring',
              last: 'Today, 17:30',
            },
            {
              branch: 'main',
              color: 'bg-neutral-500',
              project: 'devpulse-backend',
              time: '0h 34m',
              focus: '61%',
              focusColor: 'text-neutral-400',
              last: 'Today, 11:02',
            },
            {
              branch: 'develop',
              color: 'bg-purple-magenta',
              project: 'playmanity-storefront',
              time: '0h 22m',
              focus: '54%',
              focusColor: 'text-red-coral',
              last: 'Yesterday, 16:45',
            },
          ].map((row) => (
            <div
              key={row.branch}
              className="grid grid-cols-12 items-center gap-4 border-b border-neutral-800/60 py-3 last:border-0"
            >
              <div className="col-span-3 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${row.color}`} />
                <span className="body1 text-neutral-200">{row.branch}</span>
              </div>
              <div className="col-span-3 body1 text-neutral-400">{row.project}</div>
              <div className="col-span-2 body1 text-neutral-100">{row.time}</div>
              <div className={`col-span-2 body1 ${row.focusColor}`}>{row.focus}</div>
              <div className="col-span-2 body1 text-neutral-500">{row.last}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl bg-neutral-900 p-6">
          <div className="mb-6">
            <span className="mini text-neutral-400">PROJECTS THIS WEEK</span>
          </div>

          <div className="flex flex-col gap-5">
            {[
              {
                name: 'devpulse-backend',
                abbr: 'DB',
                color: 'bg-blue-electric',
                time: '9h 40m',
                width: '90%',
              },
              {
                name: 'playmanity-storefront',
                abbr: 'PS',
                color: 'bg-purple-aspid',
                time: '6h 15m',
                width: '65%',
              },
              {
                name: 'devpulse-dashboard',
                abbr: 'DD',
                color: 'bg-green-spring',
                time: '4h 20m',
                width: '45%',
              },
              {
                name: 'playmanity-admin',
                abbr: 'PA',
                color: 'bg-pink-french',
                time: '2h 05m',
                width: '22%',
              },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-neutral-950 ${p.color}`}
                >
                  {p.abbr}
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="body1 text-neutral-200">{p.name}</span>
                    <span className="body1 text-neutral-400">{p.time}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div className={`h-full rounded-full ${p.color}`} style={{ width: p.width }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-xl bg-neutral-900 p-6">
          <div className="mb-6">
            <span className="mini text-neutral-400">LANGUAGES THIS WEEK</span>
          </div>

          <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-neutral-800">
            <div className="flex h-full">
              <div className="h-full bg-blue-electric" style={{ width: '58%' }} />
              <div className="h-full bg-purple-aspid" style={{ width: '12%' }} />
              <div className="h-full bg-green-spring" style={{ width: '10%' }} />
              <div className="h-full bg-pink-french" style={{ width: '8%' }} />
              <div className="h-full bg-neutral-600" style={{ width: '12%' }} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { name: 'TypeScript', pct: '58%', color: 'bg-blue-electric' },
              { name: 'SQL', pct: '12%', color: 'bg-purple-aspid' },
              { name: 'CSS', pct: '10%', color: 'bg-green-spring' },
              { name: 'JSON/Config', pct: '8%', color: 'bg-pink-french' },
              { name: 'Other', pct: '12%', color: 'bg-neutral-600' },
            ].map((l) => (
              <div key={l.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                  <span className="body1 text-neutral-300">{l.name}</span>
                </div>
                <span className="body1 text-neutral-100">{l.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="flex flex-col rounded-xl bg-neutral-900 p-6">
        <div className="mb-6">
          <span className="mini text-neutral-400">RECENT SESSIONS</span>
        </div>

        <div className="flex flex-col">
          <div className="mb-3 grid grid-cols-12 gap-4 border-b border-neutral-800 pb-2 text-xs text-neutral-500">
            <div className="col-span-3">TIME</div>
            <div className="col-span-3">PROJECT</div>
            <div className="col-span-3">BRANCH</div>
            <div className="col-span-2">DURATION</div>
            <div className="col-span-1">FOCUS</div>
          </div>

          {[
            {
              time: 'Today, 17:30–18:27',
              project: 'devpulse-dashboard',
              branch: 'feature/dashboard-mockup',
              duration: '57m',
              focus: '91%',
              focusColor: 'text-green-spring',
            },
            {
              time: 'Today, 14:54–17:30',
              project: 'playmanity-storefront',
              branch: 'fix/game-card-pricing',
              duration: '2h 36m',
              focus: '74%',
              focusColor: 'text-neutral-300',
            },
            {
              time: 'Today, 11:45–14:12',
              project: 'devpulse-backend',
              branch: 'feature/telemetry-worker',
              duration: '2h 27m',
              focus: '88%',
              focusColor: 'text-green-spring',
            },
            {
              time: 'Today, 09:00–11:30',
              project: 'devpulse-backend',
              branch: 'feature/telemetry-worker',
              duration: '2h 30m',
              focus: '92%',
              focusColor: 'text-green-spring',
            },
            {
              time: 'Yesterday, 19:10–21:02',
              project: 'devpulse-backend',
              branch: 'main',
              duration: '1h 52m',
              focus: '65%',
              focusColor: 'text-neutral-400',
            },
            {
              time: 'Yesterday, 10:15–13:40',
              project: 'playmanity-storefront',
              branch: 'develop',
              duration: '3h 25m',
              focus: '81%',
              focusColor: 'text-green-spring',
            },
          ].map((s) => (
            <div
              key={s.time + s.branch}
              className="grid grid-cols-12 items-center gap-4 border-b border-neutral-800/60 py-3 last:border-0"
            >
              <div className="col-span-3 body1 text-neutral-400">{s.time}</div>
              <div className="col-span-3 body1 text-neutral-200">{s.project}</div>
              <div className="col-span-3 body1 text-neutral-400">{s.branch}</div>
              <div className="col-span-2 body1 text-neutral-100">{s.duration}</div>
              <div className={`col-span-1 body1 ${s.focusColor}`}>{s.focus}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

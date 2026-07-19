'use client';

import { useState } from 'react';

export default function EarningsPage() {
  const [rateType, setRateType] = useState<'hourly' | 'monthly'>('hourly');
  const [rate, setRate] = useState(45);
  const [currency, setCurrency] = useState('$');

  const activeHoursThisMonth = 142.3;
  const activeHoursThisWeek = 24.6;

  const earnedThisMonth =
    rateType === 'hourly' ? activeHoursThisMonth * rate : (activeHoursThisMonth / 160) * rate;

  const earnedThisWeek =
    rateType === 'hourly' ? activeHoursThisWeek * rate : (activeHoursThisWeek / 160) * rate;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h4 text-neutral-100">Earnings</h1>
        <p className="desc mt-1 text-neutral-400">
          Set your rate and see how much your focus is worth
        </p>
      </div>

      <div className="rounded-xl bg-neutral-900 p-6">
        <p className="mini mb-4 text-neutral-400">YOUR RATE</p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <label className="desc text-neutral-400">Type</label>
            <div className="flex rounded-lg bg-neutral-800 p-1">
              <button
                onClick={() => setRateType('hourly')}
                className={`rounded-md px-4 py-1.5 text-sm ${
                  rateType === 'hourly' ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-400'
                }`}
              >
                Hourly
              </button>
              <button
                onClick={() => setRateType('monthly')}
                className={`rounded-md px-4 py-1.5 text-sm ${
                  rateType === 'monthly' ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-400'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="desc text-neutral-400">
              {rateType === 'hourly' ? 'Hourly rate' : 'Monthly rate'}
            </label>
            <div className="flex items-center gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-lg bg-neutral-800 px-3 py-2 text-neutral-100"
              >
                <option value="$">$</option>
                <option value="€">€</option>
                <option value="₽">₽</option>
              </select>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-32 rounded-lg bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-green-spring"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-neutral-900 p-5">
          <p className="body1 text-neutral-400">This week</p>
          <p className="h5 mt-2 text-neutral-100">
            {currency}
            {earnedThisWeek.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className="desc mt-1 text-neutral-500">{activeHoursThisWeek}h active</p>
        </div>

        <div className="rounded-xl bg-neutral-900 p-5">
          <p className="body1 text-neutral-400">This month</p>
          <p className="h5 mt-2 text-green-spring">
            {currency}
            {earnedThisMonth.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className="desc mt-1 text-neutral-500">{activeHoursThisMonth}h active</p>
        </div>

        <div className="rounded-xl bg-neutral-900 p-5">
          <p className="body1 text-neutral-400">Effective hourly</p>
          <p className="h5 mt-2 text-neutral-100">
            {currency}
            {rateType === 'hourly' ? rate : (rate / 160).toFixed(1)}
          </p>
          <p className="desc mt-1 text-neutral-500">based on your rate</p>
        </div>
      </div>
    </div>
  );
}

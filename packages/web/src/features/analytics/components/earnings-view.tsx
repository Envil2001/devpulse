'use client';

import { useState } from 'react';

import { useAuth, type User } from '@/features/auth/context';
import { useDashboardStats } from '@/features/analytics/hooks';
import { Button } from '@/shared/components/ui/button';

export function EarningsView() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-neutral-500">
        <p className="animate-pulse">Loading earnings profile...</p>
      </div>
    );
  }

  return <EarningsContent user={user} />;
}

function EarningsContent({ user }: { user: User }) {
  const { updateProfile } = useAuth();

  const safeRate = user.hourlyRate ?? 0;
  const safeCurrency = user.currency ?? 'USD';

  const [rateType, setRateType] = useState<'hourly' | 'monthly'>('hourly');
  const [rateInput, setRateInput] = useState<string>(safeRate.toString());
  const [currencyInput, setCurrencyInput] = useState<string>(safeCurrency);
  const [isSaving, setIsSaving] = useState(false);

  const { data: stats30d, isLoading: isLoading30d } = useDashboardStats('30d');
  const { data: stats7d, isLoading: isLoading7d } = useDashboardStats('7d');

  const handleRateTypeChange = (newType: 'hourly' | 'monthly') => {
    if (newType === rateType) return;

    setRateType(newType);
    const numericRate = parseFloat(rateInput) || 0;

    if (newType === 'monthly') {
      setRateInput((numericRate * 160).toString());
    } else {
      setRateInput((numericRate / 160).toString());
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const numericRate = parseFloat(rateInput) || 0;
      const hourlyRate = rateType === 'hourly' ? numericRate : numericRate / 160;
      await updateProfile({ hourlyRate, currency: currencyInput });
    } finally {
      setIsSaving(false);
    }
  };

  const activeHoursThisMonth = Number(((stats30d?.totalActiveSeconds ?? 0) / 3600).toFixed(1));
  const activeHoursThisWeek = Number(((stats7d?.totalActiveSeconds ?? 0) / 3600).toFixed(1));

  const earnedThisMonth = activeHoursThisMonth * safeRate;
  const earnedThisWeek = activeHoursThisWeek * safeRate;

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
                onClick={() => handleRateTypeChange('hourly')}
                className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
                  rateType === 'hourly'
                    ? 'bg-neutral-100 text-neutral-950'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Hourly
              </button>
              <button
                onClick={() => handleRateTypeChange('monthly')}
                className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
                  rateType === 'monthly'
                    ? 'bg-neutral-100 text-neutral-950'
                    : 'text-neutral-400 hover:text-neutral-200'
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
                value={currencyInput}
                onChange={(e) => setCurrencyInput(e.target.value)}
                className="rounded-lg bg-neutral-800 px-3 py-2.5 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-electric"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="RUB">RUB (₽)</option>
              </select>
              <input
                type="number"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                min="0"
                step="0.1"
                className="w-32 rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-electric"
              />
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-neutral-900 p-5">
          <p className="body1 text-neutral-400">This week</p>
          <p className="h5 mt-2 text-neutral-100">
            {isLoading7d
              ? '...'
              : `${earnedThisWeek.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })} ${safeCurrency}`}
          </p>
          <p className="desc mt-1 text-neutral-500">
            {isLoading7d ? '...' : `${activeHoursThisWeek}h active`}
          </p>
        </div>

        <div className="rounded-xl bg-neutral-900 p-5">
          <p className="body1 text-neutral-400">This month (30d)</p>
          <p className="h5 mt-2 text-green-spring">
            {isLoading30d
              ? '...'
              : `${earnedThisMonth.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })} ${safeCurrency}`}
          </p>
          <p className="desc mt-1 text-neutral-500">
            {isLoading30d ? '...' : `${activeHoursThisMonth}h active`}
          </p>
        </div>

        <div className="rounded-xl bg-neutral-900 p-5">
          <p className="body1 text-neutral-400">Effective hourly</p>
          <p className="h5 mt-2 text-neutral-100">
            {safeRate.toLocaleString('en-US', { maximumFractionDigits: 2 })} {safeCurrency}
          </p>
          <p className="desc mt-1 text-neutral-500">Based on your saved rate</p>
        </div>
      </div>
    </div>
  );
}

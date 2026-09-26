'use client';

import { useMemo, useState } from 'react';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/cn';
import { periodToDateRange, useDashboardStats } from '@/features/analytics/hooks';
import {
  Page,
  PageDescription,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
} from '@/shared/components/layout/page';
import { Panel } from '@/shared/components/layout/panel';
import { useRequireAuth } from '@/features/auth/context';

export function EarningsView() {
  const { user, updateProfile } = useRequireAuth();

  const range30d = useMemo(() => periodToDateRange('30d'), []);
  const range7d = useMemo(() => periodToDateRange('7d'), []);

  const { data: stats30d } = useDashboardStats(range30d);
  const { data: stats7d } = useDashboardStats(range7d);

  const safeRate = user.hourlyRate;
  const safeCurrency = user.currency;

  const [rateType, setRateType] = useState<'hourly' | 'monthly'>('hourly');
  const [rateInput, setRateInput] = useState<string>(safeRate.toString());
  const [currencyInput, setCurrencyInput] = useState<string>(safeCurrency);
  const [isSaving, setIsSaving] = useState(false);

  const handleRateTypeChange = (newType: string) => {
    if (newType === rateType) return;
    const type = newType as 'hourly' | 'monthly';
    setRateType(type);

    const numericRate = parseFloat(rateInput) || 0;
    if (type === 'monthly') {
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

  const earningsCards = [
    {
      label: 'This week',
      icon: Clock,
      value: `${earnedThisWeek.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${safeCurrency}`,
      sub: `${activeHoursThisWeek}h active coding`,
      accent: false,
    },
    {
      label: 'This month (30d)',
      icon: TrendingUp,
      value: `${earnedThisMonth.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${safeCurrency}`,
      sub: `${activeHoursThisMonth}h active coding`,
      accent: true,
    },
    {
      label: 'Effective hourly',
      icon: DollarSign,
      value: `${safeRate.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${safeCurrency}`,
      sub: 'Based on your saved rate',
      accent: false,
    },
  ];

  return (
    <Page>
      <PageHeader>
        <div>
          <PageHeaderHeading>
            <PageTitle>Earnings</PageTitle>
          </PageHeaderHeading>
          <PageDescription>Set your rate and see how much your focus is worth</PageDescription>
        </div>
      </PageHeader>

      <Panel>
        <p className="label-caps mb-5">Rate Configuration</p>

        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Tabs value={rateType} onValueChange={handleRateTypeChange}>
              <TabsList variant="secondary">
                <TabsTrigger variant="secondary" value="hourly">
                  Hourly
                </TabsTrigger>
                <TabsTrigger variant="secondary" value="monthly">
                  Monthly
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rate-amount">
              {rateType === 'hourly' ? 'Hourly rate' : 'Monthly rate'}
            </Label>

            <div className="flex items-center gap-2">
              <div className="w-28">
                <Select value={currencyInput} onValueChange={setCurrencyInput}>
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="RUB">RUB (₽)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                id="rate-amount"
                type="number"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                min="0"
                step="0.1"
                className="w-32 font-mono"
              />

              <Button size="default" onClick={handleSave} loading={isSaving}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {earningsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Panel key={card.label} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between">
                  <p className="caption font-medium">{card.label}</p>
                  <Icon className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                </div>
                <p
                  className={cn(
                    'metric mt-3',
                    card.accent ? 'text-green-spring' : 'text-neutral-100',
                  )}
                >
                  {card.value}
                </p>
              </div>
              <p className="caption mt-2">{card.sub}</p>
            </Panel>
          );
        })}
      </div>
    </Page>
  );
}

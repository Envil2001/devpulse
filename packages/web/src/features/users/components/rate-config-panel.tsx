'use client';

import { useState } from 'react';

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
import { Panel } from '@/shared/components/layout/panel';
import { useRequireAuth } from '@/features/auth/context';

export function RateConfigPanel() {
  const { user, updateProfile } = useRequireAuth();

  const [rateType, setRateType] = useState<'hourly' | 'monthly'>('hourly');
  const [rateInput, setRateInput] = useState<string>(user.hourlyRate.toString());
  const [currencyInput, setCurrencyInput] = useState<string>(user.currency);
  const [isSaving, setIsSaving] = useState(false);

  const handleRateTypeChange = (newType: string) => {
    if (newType === rateType) return;
    const type = newType as 'hourly' | 'monthly';
    setRateType(type);

    const numericRate = parseFloat(rateInput) || 0;
    if (type === 'monthly') {
      setRateInput(Math.round(numericRate * 160).toString());
    } else {
      setRateInput(Number((numericRate / 160).toFixed(2)).toString());
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

  return (
    <Panel>
      <p className="label-caps mb-5">Rate Configuration</p>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <Label>Type</Label>
          <Tabs value={rateType} onValueChange={handleRateTypeChange}>
            <TabsList variant="secondary" aria-label="Select rate type">
              <TabsTrigger variant="secondary" value="hourly" disabled={isSaving}>
                Hourly
              </TabsTrigger>
              <TabsTrigger variant="secondary" value="monthly" disabled={isSaving}>
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
              <Select value={currencyInput} onValueChange={setCurrencyInput} disabled={isSaving}>
                <SelectTrigger aria-label="Select currency">
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
              disabled={isSaving}
              className="w-32 font-mono"
            />

            <Button size="default" onClick={handleSave} loading={isSaving} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

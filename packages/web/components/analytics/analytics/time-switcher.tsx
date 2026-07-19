'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const periods = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'custom', label: 'Custom' },
];

interface TimeSwitcherProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function TimeSwitcher({ value = '7d', onValueChange }: TimeSwitcherProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList>
        {periods.map((p) => (
          <TabsTrigger key={p.id} value={p.id} variant="secondary">
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

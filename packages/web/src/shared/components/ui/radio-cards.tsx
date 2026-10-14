'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface RadioCardsContextValue {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const RadioCardsContext = React.createContext<RadioCardsContextValue | null>(null);

function useRadioCards() {
  const ctx = React.useContext(RadioCardsContext);
  if (!ctx) {
    throw new Error('RadioCardsItem must be used inside <RadioCards>');
  }
  return ctx;
}

interface RadioCardsProps {
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function RadioCards({
  value,
  onValueChange,
  name,
  disabled,
  className,
  children,
}: RadioCardsProps) {
  const generatedName = React.useId();
  const groupName = name ?? generatedName;

  const ctx = React.useMemo(
    () => ({ name: groupName, value, onValueChange, disabled }),
    [groupName, value, onValueChange, disabled],
  );

  return (
    <RadioCardsContext.Provider value={ctx}>
      <div role="radiogroup" className={cn('flex gap-3', className)}>
        {children}
      </div>
    </RadioCardsContext.Provider>
  );
}

interface RadioCardsItemProps {
  value: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function RadioCardsItem({
  value,
  icon: Icon,
  title,
  description,
  className,
}: RadioCardsItemProps) {
  const { name, value: selected, onValueChange, disabled } = useRadioCards();
  const isSelected = selected === value;

  return (
    <label
      className={cn(
        'flex flex-1 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
        'has-focus-visible:ring-2 has-focus-visible:ring-white/15',
        isSelected
          ? 'border-foreground/30 bg-gray-alpha-100'
          : 'border-border hover:border-gray-alpha-200 hover:bg-gray-alpha-50',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={isSelected}
        onChange={() => onValueChange(value)}
        disabled={disabled}
        className="sr-only"
      />

      {Icon && (
        <Icon
          className={cn('mt-0.5 h-5 w-5 shrink-0', isSelected ? 'text-foreground' : 'text-subtle')}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}

      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {description && <div className="mt-0.5 text-xs text-subtle">{description}</div>}
      </div>
    </label>
  );
}

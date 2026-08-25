'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('inline-flex items-center justify-center rounded-xl p-1', {
  variants: {
    variant: {
      default: 'bg-neutral-900',
      secondary: 'bg-neutral-900 border border-white/10',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  [
    // Внутренний радиус ровно 10px, как у кнопок и инпутов
    'inline-flex items-center justify-center whitespace-nowrap rounded-[10px] px-4 py-1.5',
    'text-sm font-medium transition-all duration-200',
    'border border-transparent',
    // Единый фокус:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'text-neutral-400 hover:text-neutral-100',
          'data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-950 data-[state=active]:shadow-sm',
        ].join(' '),

        secondary: [
          'text-neutral-400 hover:text-neutral-100',
          'data-[state=active]:bg-neutral-800 data-[state=active]:border-white/10 data-[state=active]:text-neutral-100 data-[state=active]:shadow-sm',
        ].join(' '),

        green: [
          'text-neutral-400 hover:text-neutral-100',
          'data-[state=active]:bg-green-spring data-[state=active]:text-neutral-950 data-[state=active]:shadow-sm',
        ].join(' '),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
    VariantProps<typeof tabsTriggerVariants>
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };

'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('inline-flex items-center justify-center rounded-lg p-1', {
  variants: {
    variant: {
      default: 'bg-neutral-900',
      secondary: 'bg-neutral-800/60',
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
  'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 body1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-electric focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'text-neutral-400 hover:text-neutral-200 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-950 data-[state=active]:shadow-sm',
        secondary:
          'text-neutral-400 hover:text-neutral-200 data-[state=active]:bg-neutral-700/50 data-[state=active]:text-neutral-100',
        green:
          'text-neutral-400 hover:text-neutral-200 data-[state=active]:bg-green-spring data-[state=active]:text-neutral-950 data-[state=active]:shadow-sm',
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
      'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-electric focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };

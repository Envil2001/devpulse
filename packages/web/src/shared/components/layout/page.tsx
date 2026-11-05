import * as React from 'react';

import { cn } from '@/shared/lib/cn';

const Page = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('page-enter space-y-6 lg:space-y-8', className)} {...props} />
  ),
);
Page.displayName = 'Page';

const PageHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between lg:pb-6',
        className,
      )}
      {...props}
    />
  ),
);
PageHeader.displayName = 'PageHeader';

const PageHeaderHeading = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-2 sm:flex-row sm:items-center', className)}
      {...props}
    />
  ),
);
PageHeaderHeading.displayName = 'PageHeaderHeading';

const PageTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        'text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[28px]',
        className,
      )}
      {...props}
    />
  ),
);
PageTitle.displayName = 'PageTitle';

const PageDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('mt-1.5 max-w-2xl text-sm leading-6 text-secondary', className)}
    {...props}
  />
));
PageDescription.displayName = 'PageDescription';

const PageEyebrow = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'mb-2 font-mono text-[10px] font-medium tracking-[0.18em] text-brand uppercase',
      className,
    )}
    {...props}
  />
));
PageEyebrow.displayName = 'PageEyebrow';

const PageActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3', className)} {...props} />
  ),
);
PageActions.displayName = 'PageActions';

export {
  Page,
  PageActions,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
};

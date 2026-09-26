import * as React from 'react';
import { cn } from '@/shared/lib/cn';

const Page = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-8', className)} {...props} />
  ),
);
Page.displayName = 'Page';

const PageHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
      {...props}
    />
  ),
);
PageHeader.displayName = 'PageHeader';

const PageHeaderHeading = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)}
      {...props}
    />
  ),
);
PageHeaderHeading.displayName = 'PageHeaderHeading';

const PageTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('title-1', className)} {...props} />
  ),
);
PageTitle.displayName = 'PageTitle';

const PageDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('body-muted mt-1', className)} {...props} />
));
PageDescription.displayName = 'PageDescription';

const PageActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3', className)} {...props} />
  ),
);
PageActions.displayName = 'PageActions';

export { Page, PageHeader, PageHeaderHeading, PageTitle, PageDescription, PageActions };

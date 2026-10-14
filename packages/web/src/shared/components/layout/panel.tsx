import * as React from 'react';
import { cn } from '@/shared/lib/cn';

const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-2xl border border-border bg-surface p-5', className)}
      {...props}
    />
  ),
);
Panel.displayName = 'Panel';

const PanelHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mb-4 flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      {...props}
    />
  ),
);
PanelHeader.displayName = 'PanelHeader';

const PanelTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-medium text-foreground', className)} {...props} />
  ),
);
PanelTitle.displayName = 'PanelTitle';

const PanelDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('mt-0.5 text-sm text-secondary', className)} {...props} />
));
PanelDescription.displayName = 'PanelDescription';

const PanelContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />,
);
PanelContent.displayName = 'PanelContent';

export { Panel, PanelHeader, PanelTitle, PanelDescription, PanelContent };

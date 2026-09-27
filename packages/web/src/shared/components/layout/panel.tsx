import * as React from 'react';
import { cn } from '@/shared/lib/cn';

const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-white/[0.07] bg-linear-to-b from-neutral-900/70 to-neutral-900/40 p-6 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all hover:border-white/15',
        className,
      )}
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
        'mb-6 flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      {...props}
    />
  ),
);
PanelHeader.displayName = 'PanelHeader';

const PanelTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('title-4', className)} {...props} />
  ),
);
PanelTitle.displayName = 'PanelTitle';

const PanelDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('caption mt-0.5', className)} {...props} />
));
PanelDescription.displayName = 'PanelDescription';

const PanelContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />,
);
PanelContent.displayName = 'PanelContent';

export { Panel, PanelHeader, PanelTitle, PanelDescription, PanelContent };

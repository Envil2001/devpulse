import * as React from 'react';
import { cn } from '@/shared/lib/cn';
import { CodeTabs } from './code-tabs';
import { generateIdFromTitle } from '@/shared/lib/docs';
import { METHOD_STYLES } from '@/shared/lib/docs-constants';

export interface IntroductionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  baseUrl?: string;
}

export function Introduction({ title, baseUrl, children, className, ...props }: IntroductionProps) {
  return (
    <div
      id="introduction"
      className={cn(
        'flex w-full flex-col border-b border-border scroll-m-20 lg:flex-row',
        className,
      )}
      {...props}
    >
      <div className="flex-1 p-8 lg:p-14 lg:pr-12">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <div className="space-y-4">{children}</div>
      </div>

      <div className="w-full border-t border-border bg-surface p-8 lg:w-[48%] lg:border-l lg:border-t-0 lg:p-14">
        {baseUrl && (
          <div>
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">
              Base API URL
            </div>
            <div className="rounded-lg border border-border bg-gray-alpha-50 p-3 font-mono text-xs text-brand">
              {baseUrl}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export interface ParamProps {
  name: string;
  type: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Param({ name, type, required = false, children }: ParamProps) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="mb-1 flex items-center gap-2">
        <code className="font-mono text-xs font-medium text-foreground">{name}</code>
        <span className="font-mono text-[11px] text-subtle">{type}</span>
        {required && (
          <span className="rounded bg-red-coral/10 px-1.5 py-0.5 font-mono text-[10px] text-red-coral">
            required
          </span>
        )}
      </div>
      <div className="text-xs leading-relaxed text-secondary">{children}</div>
    </div>
  );
}

export interface EndpointProps extends React.HTMLAttributes<HTMLDivElement> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string;
  path: string;
  title: string;
  response?: string;
}

export function Endpoint({
  method,
  path,
  title,
  response,
  children,
  className,
  ...props
}: EndpointProps) {
  const id = generateIdFromTitle(title);

  return (
    <div
      id={id}
      className={cn(
        'flex w-full flex-col border-b border-border scroll-m-20 lg:flex-row',
        className,
      )}
      {...props}
    >
      <div className="flex-1 p-8 lg:p-14 lg:pr-12">
        <div className="mb-4 flex items-center gap-3">
          <span
            className={cn(
              'rounded px-2 py-0.5 font-mono text-xs font-medium',
              METHOD_STYLES[method as keyof typeof METHOD_STYLES] || METHOD_STYLES.GET,
            )}
          >
            {method}
          </span>
          <span className="font-mono text-xs text-subtle">{path}</span>
        </div>

        <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        <div className="space-y-4">{children}</div>
      </div>

      <div className="w-full border-t border-border bg-surface p-8 lg:w-[48%] lg:border-l lg:border-t-0 lg:p-14">
        <CodeTabs method={method} path={path} response={response} />
      </div>
    </div>
  );
}

export const mdxComponents = {
  Introduction,
  Endpoint,
  Param,
  h1: ({ className, ...props }: React.ComponentPropsWithoutRef<'h1'>) => (
    <h1
      className={cn('mb-6 text-2xl font-semibold tracking-tight text-foreground', className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2
      className={cn(
        'mb-4 scroll-m-20 text-xl font-semibold tracking-tight text-foreground',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => {
    const id = typeof children === 'string' ? generateIdFromTitle(children) : undefined;
    return (
      <h3
        id={id}
        className={cn('mb-3 mt-6 scroll-m-20 text-lg font-medium text-foreground', className)}
        {...props}
      >
        {children}
      </h3>
    );
  },
  p: ({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p className={cn('mb-4 text-sm leading-relaxed text-secondary', className)} {...props} />
  ),
  code: ({ className, ...props }: React.ComponentPropsWithoutRef<'code'>) => (
    <code
      className={cn(
        'rounded bg-gray-alpha-100 px-1.5 py-0.5 font-mono text-xs text-foreground',
        className,
      )}
      {...props}
    />
  ),
};

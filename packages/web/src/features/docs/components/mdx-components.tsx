import * as React from 'react';
import { cn } from '@/shared/lib/cn';
import { CodeTabs } from './code-tabs';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

export interface IntroductionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  baseUrl?: string;
}

export function Introduction({ title, baseUrl, children, className, ...props }: IntroductionProps) {
  return (
    <div
      id="introduction"
      className={cn(
        'flex w-full flex-col border-b border-white/5 lg:flex-row scroll-m-20',
        className,
      )}
      {...props}
    >
      <div className="flex-1 p-8 lg:p-14 lg:pr-12">
        <h1 className="title-1 mb-6">{title}</h1>
        <div className="space-y-4">{children}</div>
      </div>

      <div className="w-full border-t border-white/5 bg-neutral-900/60 p-8 lg:w-[48%] lg:border-t-0 lg:border-l lg:p-14">
        {baseUrl && (
          <div>
            <div className="label-caps mb-3 text-neutral-400">Base API URL</div>
            <div className="rounded-lg border border-white/5 bg-neutral-950 p-3 font-mono text-xs text-green-spring">
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
    <div className="border-b border-white/5 py-3 last:border-b-0">
      <div className="mb-1 flex items-center gap-2">
        <code className="mono-sm font-semibold text-neutral-100">{name}</code>
        <span className="mono-sm text-[11px] text-neutral-500">{type}</span>
        {required && (
          <span className="mono-sm rounded bg-red-coral/10 px-1.5 py-0.5 text-[10px] text-red-coral">
            required
          </span>
        )}
      </div>
      <div className="body-muted text-xs leading-relaxed">{children}</div>
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
  const id = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <div
      id={id}
      className={cn(
        'flex w-full flex-col border-b border-white/5 lg:flex-row scroll-m-20',
        className,
      )}
      {...props}
    >
      <div className="flex-1 p-8 lg:p-14 lg:pr-12">
        <div className="mb-4 flex items-center gap-3">
          <span
            className={cn(
              'mono-sm rounded px-2 py-0.5 text-xs font-semibold',
              method === 'GET' && 'bg-green-spring/10 text-green-spring',
              method === 'POST' && 'bg-blue-azure/10 text-blue-azure',
            )}
          >
            {method}
          </span>
          <span className="font-mono text-xs text-neutral-400">{path}</span>
        </div>

        <h2 className="title-2 mb-4">{title}</h2>
        <div className="space-y-4">{children}</div>
      </div>

      <div className="w-full border-t border-white/5 bg-neutral-900/60 p-8 lg:w-[48%] lg:border-t-0 lg:border-l lg:p-14">
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
    <h1 className={cn('title-1 mb-6', className)} {...props} />
  ),
  h2: ({ className, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2 className={cn('title-2 mb-4 scroll-m-20', className)} {...props} />
  ),
  h3: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => {
    const id =
      typeof children === 'string' ? children.toLowerCase().replace(/\s+/g, '-') : undefined;
    return (
      <h3
        id={id}
        className={cn('title-3 mb-3 mt-6 text-neutral-200 scroll-m-20', className)}
        {...props}
      >
        {children}
      </h3>
    );
  },
  p: ({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p className={cn('body-muted mb-4 leading-relaxed', className)} {...props} />
  ),
  code: ({ className, ...props }: React.ComponentPropsWithoutRef<'code'>) => (
    <code
      className={cn(
        'rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-neutral-200',
        className,
      )}
      {...props}
    />
  ),
};

'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/cn';
import { CodeTabs } from './code-tabs';

interface Parameter {
  name: string;
  in: 'header' | 'query' | 'path';
  required?: boolean;
  description?: string;
  schema?: {
    type?: string;
    enum?: Array<string>;
  };
}

interface EndpointCardProps {
  method: string;
  path: string;
  summary: string;
  description?: string;
  scopes?: Array<string>;
  parameters?: Array<Parameter>;
  responseExample?: string;
  id: string;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-spring/10 text-green-spring border-green-spring/20',
  POST: 'bg-blue-frosty/10 text-blue-frosty border-blue-frosty/20',
  PUT: 'bg-purple-aspid/10 text-purple-aspid border-purple-aspid/20',
  PATCH: 'bg-purple-aspid/10 text-purple-aspid border-purple-aspid/20',
  DELETE: 'bg-red-fluor/10 text-red-fluor border-red-fluor/20',
};

export function EndpointCard({
  method,
  path,
  summary,
  description,
  scopes,
  parameters,
  responseExample,
  id,
}: EndpointCardProps) {
  const hasParameters = parameters && parameters.length > 0;

  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'px-2.5 py-1 rounded-md border font-mono text-xs font-bold uppercase',
                methodColors[method] || methodColors.GET,
              )}
            >
              {method}
            </span>
            <code className="font-mono text-sm text-neutral-300">{path}</code>
          </div>

          <div>
            <h3 className="title-3 mb-1">{summary}</h3>
            {description && <p className="body-muted">{description}</p>}
          </div>

          {scopes && scopes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {scopes.map((scope) => (
                <span
                  key={scope}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-aspid/10 border border-purple-aspid/20 text-xs font-medium text-purple-aspid"
                >
                  <span>🔒</span>
                  {scope}
                </span>
              ))}
            </div>
          )}
        </div>

        {hasParameters && (
          <div className="overflow-hidden rounded-xl border border-white/5 bg-neutral-950">
            <div className="border-b border-white/5 px-4 py-2.5 bg-neutral-900/50">
              <span className="label-caps text-neutral-400">Parameters</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-neutral-900/30">
                  <th className="px-4 py-2 text-left font-medium text-neutral-400 w-32">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-neutral-400 w-24">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-neutral-400">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((param) => (
                  <tr
                    key={param.name}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-neutral-200">
                        {param.name}
                      </code>
                      {param.required && (
                        <span className="ml-1.5 text-red-fluor text-xs">*</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="mono-sm text-neutral-400 capitalize">
                        {param.in}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-400">
                      {param.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CodeTabs
          method={method}
          path={path}
          response={responseExample}
        />
      </div>

      <div className="my-8 border-t border-white/5" />
    </div>
  );
}

import { env } from '@devpulse/env/client';
import { type JSX } from 'react/jsx-runtime';

import { DocsLayoutWrapper } from '@/features/docs/components/docs-layout-wrapper';
import { EndpointCard } from '@/features/docs/components/endpoint-card';
import { generateEndpointId } from '@/shared/lib/docs';

export const dynamic = 'force-dynamic';

interface OpenAPIParameter {
  name: string;
  in: 'header' | 'query' | 'path';
  required?: boolean;
  description?: string;
  schema?: {
    type?: string;
    enum?: Array<string>;
    example?: unknown;
    default?: unknown;
    minimum?: number;
    maximum?: number;
  };
  example?: unknown;
}

interface OpenAPIResponseContent {
  example?: unknown;
  examples?: Record<string, { value?: unknown }>;
}

interface OpenAPIResponse {
  content?: Record<string, OpenAPIResponseContent>;
}

type OpenAPIMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface OpenAPIOperation {
  summary?: string;
  description?: string;
  tags?: Array<string>;
  parameters?: Array<OpenAPIParameter>;
  security?: Array<Record<string, Array<string>>>;
  responses?: Record<string, OpenAPIResponse>;
}

interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
}

interface OpenAPISpec {
  info?: {
    title?: string;
    description?: string;
    version?: string;
  };
  paths?: Record<string, OpenAPIPathItem>;
}

async function getOpenAPISpec(): Promise<OpenAPISpec> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/docs-json`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
  }

  return response.json() as Promise<OpenAPISpec>;
}

function extractScopes(security?: Array<Record<string, Array<string>>>): Array<string> {
  if (!security?.length) return [];

  const scopes = security.flatMap((securityItem) => securityItem['ApiKeyAuth'] ?? []);
  return Array.from(new Set(scopes));
}

function extractResponseExample(responses?: Record<string, OpenAPIResponse>): string | undefined {
  const content = responses?.['200']?.content?.['application/json'];
  const example = content?.example ?? Object.values(content?.examples ?? {})[0]?.value;

  return example === undefined ? undefined : JSON.stringify(example, null, 2);
}

function getEndpointUrl(apiBaseUrl: string, path: string): string {
  const base = new URL(apiBaseUrl);
  const basePath = base.pathname.replace(/\/$/, '');
  const endpointPath = path.startsWith('/') ? path : `/${path}`;

  if (endpointPath === basePath || endpointPath.startsWith(`${basePath}/`)) {
    return `${base.origin}${endpointPath}`;
  }

  return `${apiBaseUrl.replace(/\/$/, '')}${endpointPath}`;
}

const methods: Array<OpenAPIMethod> = ['get', 'post', 'put', 'patch', 'delete'];

export default async function DocsPage(): Promise<JSX.Element> {
  const spec = await getOpenAPISpec();
  const { info, paths } = spec;

  const endpoints: Array<{
    id: string;
    method: string;
    path: string;
    url: string;
    summary: string;
    description?: string;
    group?: string;
    scopes: Array<string>;
    parameters?: Array<OpenAPIParameter>;
    responseExample?: string;
  }> = [];

  for (const [path, pathItem] of Object.entries(paths ?? {})) {
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      endpoints.push({
        id: generateEndpointId(method, path),
        method: method.toUpperCase(),
        path,
        url: getEndpointUrl(env.NEXT_PUBLIC_API_URL, path),
        summary: operation.summary || path,
        description: operation.description,
        group: operation.tags?.[0]?.replace(/^Integrations\s+/i, '') || 'Analytics',
        scopes: extractScopes(operation.security),
        parameters: operation.parameters,
        responseExample: extractResponseExample(operation.responses),
      });
    }
  }

  return (
    <DocsLayoutWrapper endpoints={endpoints}>
      <div className="min-h-full">
        <div className="page-enter mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div id="introduction" className="mb-16 scroll-mt-24">
            <div className="mb-4 inline-flex rounded-full border border-brand/25 bg-brand/10 px-3 py-1 font-mono text-[11px] tracking-wide text-brand uppercase">
              Stable read-only contract
            </div>
            <h1 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
              {info?.title || 'DevPulse API'}
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-secondary">
              {info?.description || 'DevPulse API documentation for integration endpoints.'}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="font-mono text-xs text-subtle">Version</span>
              <span className="font-mono text-xs text-brand">{info?.version || '1.0'}</span>
            </div>
            <p className="mt-4 font-mono text-xs text-secondary">
              Base URL: {env.NEXT_PUBLIC_API_URL}
            </p>
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-secondary">
              Use this API to bring DevPulse statistics into internal dashboards, billing systems,
              reports, bots, or any other server-side integration. It never exposes source-code
              contents and does not require a specific task tracker.
            </p>
          </div>

          <div id="quick-start" className="mb-16 scroll-mt-24">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
              Quick start
            </h2>
            <ol className="grid gap-3 text-sm text-secondary sm:grid-cols-2">
              {[
                ['1', 'Create an account', 'Sign in to the DevPulse dashboard.'],
                [
                  '2',
                  'Create an Integration key',
                  'Open Settings → API Keys and select Integration.',
                ],
                ['3', 'Verify the key', 'Call the ping endpoint with the X-API-Key header.'],
                ['4', 'Read analytics', 'Use the same key with any endpoint in this reference.'],
              ].map(([step, title, description]) => (
                <li key={step} className="rounded-xl border border-border bg-surface p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-brand/10 font-mono text-xs text-brand">
                      {step}
                    </span>
                    <span className="font-medium text-foreground">{title}</span>
                  </div>
                  <p className="leading-relaxed">{description}</p>
                </li>
              ))}
            </ol>
          </div>

          <div id="api-surfaces" className="mb-16 scroll-mt-24">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
              API surfaces
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-gray-alpha-50 text-xs text-subtle">
                  <tr>
                    <th className="px-4 py-3 font-medium">Surface</th>
                    <th className="px-4 py-3 font-medium">Credential</th>
                    <th className="px-4 py-3 font-medium">Purpose</th>
                    <th className="px-4 py-3 font-medium">Public contract</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-secondary">
                  <tr>
                    <td className="px-4 py-3 text-foreground">Integration API</td>
                    <td className="px-4 py-3 font-mono text-xs">analytics:read</td>
                    <td className="px-4 py-3">Read aggregated analytics</td>
                    <td className="px-4 py-3 text-brand">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-foreground">VS Code telemetry</td>
                    <td className="px-4 py-3 font-mono text-xs">telemetry:write</td>
                    <td className="px-4 py-3">Upload extension events</td>
                    <td className="px-4 py-3">No, extension only</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-foreground">Dashboard API</td>
                    <td className="px-4 py-3 font-mono text-xs">JWT session</td>
                    <td className="px-4 py-3">Power the DevPulse web app</td>
                    <td className="px-4 py-3">No, internal</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-secondary">
              This page documents only the stable Integration API. Extension and dashboard endpoints
              may change with the corresponding DevPulse client and are intentionally excluded.
            </p>
          </div>

          <div id="authentication" className="mb-16 scroll-mt-24">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
              Authentication
            </h2>
            <div className="rounded-xl border border-border bg-surface p-6">
              <p className="mb-4 text-sm font-medium text-foreground">
                All integration requests require an Integration API key in the{' '}
                <code className="font-mono text-xs text-brand">X-API-Key</code> header.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-gray-alpha-50 p-4 font-mono text-xs">
                <code className="text-secondary">X-API-Key: dp_live_1234567890abcdef</code>
              </pre>
              <p className="mt-4 text-sm leading-relaxed text-secondary">
                Store the key only on your server. Browser-based calls require the browser origin to
                be explicitly allowed by CORS.
              </p>
              <div className="mt-4 rounded-lg border border-yellow-amber/20 bg-yellow-amber/5 p-3 text-sm leading-relaxed text-secondary">
                An Extension key has only <code className="font-mono text-xs">telemetry:write</code>{' '}
                and will receive <code className="font-mono text-xs">403</code> here. Create an{' '}
                <strong className="font-medium text-foreground">Integration</strong> key in Settings
                to obtain <code className="font-mono text-xs">analytics:read</code>.
              </div>
            </div>
          </div>

          <div id="data-semantics" className="mb-16 scroll-mt-24">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
              Data semantics
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [
                  'Active time',
                  'Observed session time after confirmed idle intervals are removed. It is not the time VS Code remained open.',
                ],
                [
                  'Focus score',
                  'A derived 0–100 indicator based on active versus idle time with a limited penalty for failed relevant commands. It is not an employee performance score.',
                ],
                [
                  'File attribution',
                  'Estimated time between active editor events, capped at five minutes per interval. Only workspace-relative paths are stored.',
                ],
                [
                  'Date ranges',
                  'startDate and endDate are inclusive ISO 8601 timestamps. Daily timeseries values use the DevPulse user timezone.',
                ],
              ].map(([title, description]) => (
                <div key={title} className="rounded-xl border border-border bg-surface p-4">
                  <h3 className="mb-1.5 text-sm font-medium text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-secondary">{description}</p>
                </div>
              ))}
            </div>
            <a
              href={`${env.NEXT_PUBLIC_API_URL}/docs-json`}
              className="mt-4 inline-flex text-sm font-medium text-brand transition-colors hover:text-brand/80"
            >
              Download the OpenAPI JSON →
            </a>
          </div>

          <div id="responses" className="mb-16 scroll-mt-24">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">Responses</h2>
            <div className="rounded-xl border border-border bg-surface p-6">
              <p className="mb-4 text-sm leading-relaxed text-secondary">
                Every JSON response uses the same envelope. Endpoint payloads are always inside{' '}
                <code className="font-mono text-xs text-brand">data</code>.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-gray-alpha-50 p-4 font-mono text-xs text-secondary">
                <code>{`{
  "success": true,
  "data": { "…": "endpoint payload" },
  "timestamp": "2026-11-04T09:00:00.000Z",
  "path": "/api/v1/integrations/analytics/status"
}`}</code>
              </pre>
              <p className="mt-4 text-sm leading-relaxed text-secondary">
                Errors use <code className="font-mono text-xs text-brand">success: false</code> and
                include <code className="font-mono text-xs text-brand">error.code</code> and{' '}
                <code className="font-mono text-xs text-brand">error.message</code>. Common
                statuses: 400, 401, 403, and 429.
              </p>
            </div>
          </div>

          <div className="space-y-12">
            {endpoints.map((endpoint) => (
              <EndpointCard
                key={`${endpoint.method}-${endpoint.path}`}
                id={endpoint.id}
                method={endpoint.method}
                path={endpoint.path}
                url={endpoint.url}
                summary={endpoint.summary}
                description={endpoint.description}
                scopes={endpoint.scopes}
                parameters={endpoint.parameters}
                responseExample={endpoint.responseExample}
              />
            ))}
          </div>
        </div>
      </div>
    </DocsLayoutWrapper>
  );
}

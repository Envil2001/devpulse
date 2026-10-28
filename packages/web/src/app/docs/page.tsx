import { EndpointCard } from '@/features/docs/components/endpoint-card';
import { DocsLayoutWrapper } from '@/features/docs/components/docs-layout-wrapper';
import { generateIdFromTitle } from '@/shared/lib/docs';
import { env } from '@devpulse/env/client';

export const dynamic = 'force-dynamic';

interface OpenAPIParameter {
  name: string;
  in: 'header' | 'query' | 'path';
  required?: boolean;
  description?: string;
  schema?: {
    type?: string;
    enum?: Array<string>;
  };
}

interface OpenAPIResponseContent {
  example?: unknown;
}

interface OpenAPIResponse {
  content?: Record<string, OpenAPIResponseContent>;
}

type OpenAPIMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface OpenAPIOperation {
  summary?: string;
  description?: string;
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

  const scopes = security.flatMap((securityItem) => securityItem['ApiKeyAuth'] || []);
  return Array.from(new Set(scopes));
}

function extractResponseExample(responses?: Record<string, OpenAPIResponse>): string | undefined {
  const example = responses?.['200']?.content?.['application/json']?.example;

  return example === undefined ? undefined : JSON.stringify(example, null, 2);
}

const methods: Array<OpenAPIMethod> = ['get', 'post', 'put', 'patch', 'delete'];

export default async function DocsPage() {
  const spec = await getOpenAPISpec();
  const { info, paths } = spec;

  const endpoints: Array<{
    id: string;
    method: string;
    path: string;
    summary: string;
    description?: string;
    scopes: Array<string>;
    parameters?: Array<OpenAPIParameter>;
    responseExample?: string;
  }> = [];

  for (const [path, pathItem] of Object.entries(paths || {})) {
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      endpoints.push({
        id: generateIdFromTitle(operation.summary || path),
        method: method.toUpperCase(),
        path,
        summary: operation.summary || path,
        description: operation.description,
        scopes: extractScopes(operation.security),
        parameters: operation.parameters,
        responseExample: extractResponseExample(operation.responses),
      });
    }
  }

  return (
    <DocsLayoutWrapper endpoints={endpoints}>
      <div className="min-h-full">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div id="introduction" className="mb-16 scroll-mt-24">
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
          </div>

          <div id="authentication" className="mb-16 scroll-mt-24">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
              Authentication
            </h2>
            <div className="rounded-xl border border-border bg-surface p-6">
              <p className="mb-4 text-sm font-medium text-foreground">
                All API requests require authentication using an API key in the{' '}
                <code className="font-mono text-xs text-brand">X-API-Key</code> header.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-gray-alpha-50 p-4 font-mono text-xs">
                <code className="text-secondary">X-API-Key: dp_live_1234567890abcdef</code>
              </pre>
            </div>
          </div>

          <div className="space-y-12">
            {endpoints.map((endpoint) => (
              <EndpointCard
                key={`${endpoint.method}-${endpoint.path}`}
                id={endpoint.id}
                method={endpoint.method}
                path={endpoint.path}
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

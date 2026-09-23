import { EndpointCard } from '@/features/docs/components/endpoint-card';
import { DocsLayoutWrapper } from '@/features/docs/components/docs-layout-wrapper';

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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  const response = await fetch(`${apiUrl}/docs-json`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
  }

  return response.json() as Promise<OpenAPISpec>;
}

function extractScopes(security?: Array<Record<string, Array<string>>>): Array<string> {
  if (!security || security.length === 0) return [];
  
  const scopes = new Set<string>();
  for (const securityItem of security) {
    const apiKeyScopes = securityItem['ApiKeyAuth'];
    if (apiKeyScopes) {
      apiKeyScopes.forEach((scope) => scopes.add(scope));
    }
  }
  
  return Array.from(scopes);
}

function extractResponseExample(responses?: Record<string, unknown>): string | undefined {
  if (!responses) return undefined;
  
  const successResponse = responses['200'] as { content?: Record<string, { example?: unknown }> } | undefined;
  if (!successResponse?.content) return undefined;
  
  const jsonContent = successResponse.content['application/json'];
  if (!jsonContent?.example) return undefined;
  
  return JSON.stringify(jsonContent.example, null, 2);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

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

  if (paths) {
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (operation && typeof operation === 'object' && 'summary' in operation) {
          const op = operation as OpenAPIOperation;
          endpoints.push({
            id: slugify(op.summary || path),
            method: method.toUpperCase(),
            path,
            summary: op.summary || path,
            description: op.description,
            scopes: extractScopes(op.security),
            parameters: op.parameters,
            responseExample: extractResponseExample(op.responses as Record<string, unknown>),
          });
        }
      }
    }
  }

  return (
    <DocsLayoutWrapper endpoints={endpoints}>
      <div className="min-h-full">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div id="introduction" className="mb-16 scroll-mt-24">
            <h1 className="title-1 mb-4">{info?.title || 'DevPulse API'}</h1>
            <p className="body-muted text-base leading-relaxed max-w-3xl">
              {info?.description || 'DevPulse API documentation for integration endpoints.'}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="mono-sm text-neutral-400">Version</span>
              <span className="mono-sm text-green-spring">{info?.version || '1.0'}</span>
            </div>
          </div>

          <div id="authentication" className="mb-16 scroll-mt-24">
            <h2 className="title-2 mb-4">Authentication</h2>
            <div className="rounded-xl border border-white/5 bg-neutral-950 p-6">
              <p className="body-base mb-4">
                All API requests require authentication using an API key in the <code className="mono-sm text-green-spring">X-API-Key</code> header.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-neutral-900/50 p-4 font-mono text-xs">
                <code className="text-neutral-300">
                  X-API-Key: dp_live_1234567890abcdef
                </code>
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

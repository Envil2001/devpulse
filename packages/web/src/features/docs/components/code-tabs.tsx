'use client';

import { Check, Copy } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { highlightCode, type CodeType } from '@/shared/lib/code-highlight';
import { useState, useMemo } from 'react';

interface CodeTabsProps {
  method: string;
  path: string;
  response?: string;
}

export function CodeTabs({ method, path, response }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState<Exclude<CodeType, 'json'>>('curl');
  const [hasCopied, setHasCopied] = useState(false);

  const fullUrl = `https://api.devpulse.com${path}`;

  const snippets = useMemo(
    () => ({
      curl: `curl -X ${method} "${fullUrl}" \\\n  -H "x-api-key: dp_live_1234567890abcdef"`,
      ts: `const response = await fetch("${fullUrl}", {\n  headers: {\n    "x-api-key": "dp_live_1234567890abcdef"\n  }\n});\nconst data = await response.json();`,
      python: `import requests\n\nresponse = requests.get(\n    "${fullUrl}",\n    headers={"x-api-key": "dp_live_1234567890abcdef"}\n)\ndata = response.json()`,
    }),
    [method, fullUrl],
  );

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const highlightedCode = useMemo(
    () => highlightCode(snippets[activeTab], activeTab),
    [activeTab, snippets],
  );

  const highlightedResponse = useMemo(
    () => (response ? highlightCode(response, 'json') : null),
    [response],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border bg-gray-alpha-50 px-4 py-2">
          <div className="flex items-center gap-1">
            {(['curl', 'ts', 'python'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'cursor-pointer rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-gray-alpha-100 text-foreground'
                    : 'text-subtle hover:text-secondary',
                )}
              >
                {tab === 'curl' ? 'cURL' : tab === 'ts' ? 'TypeScript' : 'Python'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={copyCode}
            aria-label="Copy code"
            className="flex cursor-pointer items-center gap-1.5 text-xs text-subtle transition-colors hover:text-secondary"
          >
            {hasCopied ? (
              <>
                <Check className="size-3.5 text-brand" strokeWidth={1.5} />
                <span className="text-brand">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" strokeWidth={1.5} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>

      {highlightedResponse && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border bg-gray-alpha-50 px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wider text-subtle">
              Response
            </span>
            <span className="rounded bg-brand/10 px-2 py-0.5 font-mono text-xs text-brand">
              200 OK
            </span>
          </div>

          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
            <code dangerouslySetInnerHTML={{ __html: highlightedResponse }} />
          </pre>
        </div>
      )}
    </div>
  );
}

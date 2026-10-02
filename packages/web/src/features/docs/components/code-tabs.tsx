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
      <div className="overflow-hidden rounded-xl border border-white/5 bg-neutral-950">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 bg-neutral-900/50">
          <div className="flex items-center gap-1">
            {(['curl', 'ts', 'python'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors cursor-pointer',
                  activeTab === tab
                    ? 'bg-white/10 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200',
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
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            {hasCopied ? (
              <>
                <Check className="size-3.5 text-green-spring" />
                <span className="text-green-spring">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
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
        <div className="overflow-hidden rounded-xl border border-white/5 bg-neutral-950">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 bg-neutral-900/50">
            <span className="label-caps text-neutral-400">Response</span>
            <span className="mono-sm text-green-spring bg-green-spring/10 px-2 py-0.5 rounded">
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

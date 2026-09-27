'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Key, Plus, Blocks, Terminal } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';

import { useApiKeys, useRevokeApiKey } from '../hooks';
import type { ApiKeySummary } from '../api';

import { CreateApiKeyDialog } from './create-api-key-dialog';
import { RevealedKeyDialog } from './revealed-key-dialog';
import { RevokeKeyDialog } from './revoke-key-dialog';

export function ApiKeysPanel() {
  const { data: keys = [], isLoading, isError } = useApiKeys();
  const revokeKey = useRevokeApiKey();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);

  const extensionKeys = keys.filter((k) => k.type === 'extension');
  const integrationKeys = keys.filter((k) => k.type === 'integration');

  const renderKeysList = (list: Array<ApiKeySummary>, emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="rounded-xl border border-white/5 bg-neutral-900/30 p-6 text-center">
          <p className="body-muted">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <div className="mb-2 grid grid-cols-12 gap-4 border-b border-white/5 pb-3 label-caps">
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Device</div>
          <div className="col-span-3">Created</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {list.map((key, i) => (
          <div
            key={key.id}
            className={cn(
              'grid grid-cols-12 items-center gap-4 py-3.5 text-sm transition-colors',
              i !== list.length - 1 && 'border-b border-white/5',
              'hover:bg-white/2 rounded-lg px-2 -mx-2',
            )}
          >
            <div className="col-span-4 flex flex-col gap-0.5">
              <span className="body-base font-medium">{key.name}</span>
              <span className="mono-sm text-neutral-500">{key.keyPrefix}••••••••</span>
            </div>
            <div className="col-span-3 flex flex-col gap-0.5">
              {key.type === 'extension' && key.deviceLabel ? (
                <span className="text-neutral-300 font-mono text-xs">{key.deviceLabel}</span>
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </div>
            <div className="col-span-3 flex flex-col gap-0.5" suppressHydrationWarning>
              <span className="text-sm text-neutral-300">
                {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
              </span>
              <span className="caption">
                {key.lastUsedAt !== null
                  ? `Used ${formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}`
                  : 'Never used'}
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPendingRevokeId(key.id)}
                disabled={revokeKey.isPending}
              >
                Revoke
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>API Keys</PanelTitle>
          <PanelDescription>Manage API keys for VS Code and external integrations</PanelDescription>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Key
        </Button>
      </PanelHeader>

      <PanelContent>
        {isLoading && (
          <div className="flex h-32 items-center justify-center">
            <span className="body-muted animate-pulse">Loading keys…</span>
          </div>
        )}

        {isError && (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-red-coral">Failed to load API keys.</p>
          </div>
        )}

        {!isLoading && !isError && keys.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border border-white/5 bg-neutral-900/30 p-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-neutral-900">
              <Key className="h-5 w-5 text-neutral-300" />
            </div>
            <p className="body-muted max-w-md">
              Create an API key to track your metrics from VS Code or connect external integrations.
            </p>
            <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Key
            </Button>
          </div>
        )}

        {!isLoading && !isError && keys.length > 0 && (
          <div className="flex flex-col gap-8">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-neutral-400" />
                <h3 className="title-4">Extension Keys</h3>
              </div>
              {renderKeysList(extensionKeys, 'No extension keys found.')}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Blocks className="h-4 w-4 text-neutral-400" />
                <h3 className="title-4">Integration Keys</h3>
              </div>
              {renderKeysList(integrationKeys, 'No integration keys found.')}
            </section>
          </div>
        )}
      </PanelContent>

      <CreateApiKeyDialog
        open={isCreateOpen}
        onOpenChange={setCreateOpen}
        onKeyCreated={setRevealedKey}
      />

      <RevealedKeyDialog apiKey={revealedKey} onClose={() => setRevealedKey(null)} />

      <RevokeKeyDialog
        keyId={pendingRevokeId}
        onClose={() => setPendingRevokeId(null)}
        onConfirm={(id) => {
          setPendingRevokeId(null);
          revokeKey.mutate(id);
        }}
        isPending={revokeKey.isPending}
      />
    </Panel>
  );
}

'use client';

import { useState } from 'react';
import { Key, Plus, Blocks, Terminal } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';
import { useApiKeys, useRevokeApiKey } from '../hooks';

import { CreateApiKeyDialog } from './create-api-key-dialog';
import { RevealedKeyDialog } from './revealed-key-dialog';
import { RevokeKeyDialog } from './revoke-key-dialog';
import { ApiKeysTable } from './api-keys-table';

export function ApiKeysPanel() {
  const { data: keys = [], isLoading, isError } = useApiKeys();
  const revokeKey = useRevokeApiKey();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);

  const extensionKeys = keys.filter((k) => k.type === 'extension');
  const integrationKeys = keys.filter((k) => k.type === 'integration');

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>API Keys</PanelTitle>
          <PanelDescription>Manage API keys for VS Code and external integrations</PanelDescription>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
          Create Key
        </Button>
      </PanelHeader>

      <PanelContent>
        {isLoading && (
          <div className="flex h-32 items-center justify-center">
            <span className="animate-pulse text-sm text-secondary">Loading keys…</span>
          </div>
        )}

        {isError && (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-red-coral">Failed to load API keys.</p>
          </div>
        )}

        {!isLoading && !isError && keys.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border border-border bg-surface p-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-gray-alpha-50">
              <Key className="h-5 w-5 text-subtle" strokeWidth={1.5} />
            </div>
            <p className="max-w-md text-sm text-secondary">
              Create an API key to track your metrics from VS Code or connect external integrations.
            </p>
            <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
              Create Key
            </Button>
          </div>
        )}

        {!isLoading && !isError && keys.length > 0 && (
          <div className="flex flex-col gap-8">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-subtle" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="text-base font-medium text-foreground">Extension Keys</h3>
              </div>
              <ApiKeysTable
                list={extensionKeys}
                emptyMessage="No extension keys found."
                onRevoke={setPendingRevokeId}
                isRevoking={revokeKey.isPending}
              />
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Blocks className="h-4 w-4 text-subtle" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="text-base font-medium text-foreground">Integration Keys</h3>
              </div>
              <ApiKeysTable
                list={integrationKeys}
                emptyMessage="No integration keys found."
                onRevoke={setPendingRevokeId}
                isRevoking={revokeKey.isPending}
              />
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

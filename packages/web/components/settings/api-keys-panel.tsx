'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/use-api-keys';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ApiKeysPanel() {
  const { data: keys, isLoading, isError } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);

  async function handleCreate() {
    const name = newKeyName.trim();
    if (name.length === 0) return;

    const result = await createKey.mutateAsync(name);
    setRevealedKey(result.rawKey);
    setNewKeyName('');
    setCreateOpen(false);
  }

  function handleRevoke(id: string) {
    setPendingRevokeId(null);
    revokeKey.mutate(id);
  }

  return (
    <div className="rounded-xl bg-neutral-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="mini text-neutral-400">API KEYS</p>
        <Button onClick={() => setCreateOpen(true)}>Create new key</Button>
      </div>

      <p className="body1 mb-4 text-neutral-300">
        Create and manage API keys for the VS Code extension.
      </p>

      {isLoading && <p className="desc text-neutral-500">Loading keys…</p>}
      {isError && <p className="desc text-red-400">Failed to load API keys.</p>}

      {!isLoading && !isError && keys !== undefined && keys.length === 0 && (
        <p className="desc text-neutral-500">No API keys yet.</p>
      )}

      {keys !== undefined && keys.length > 0 && (
        <div className="flex flex-col divide-y divide-neutral-800">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="body1 text-neutral-200">{key.name}</p>
                <p className="desc font-mono text-neutral-500">{key.keyPrefix}••••••••</p>
                <p className="desc text-neutral-600">
                  Created {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                  {key.lastUsedAt !== null &&
                    ` · Last used ${formatDistanceToNow(new Date(key.lastUsedAt), {
                      addSuffix: true,
                    })}`}
                  {key.lastUsedAt === null && ' · Never used'}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setPendingRevokeId(key.id)}
                disabled={revokeKey.isPending}
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Name your key</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g. MacBook Pro"
            maxLength={60}
            className="mt-4 w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-blue-electric"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setCreateOpen(false);
                setNewKeyName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createKey.isPending || newKeyName.trim().length === 0}
            >
              {createKey.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revealedKey !== null} onOpenChange={() => setRevealedKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
            <DialogDescription>Copy it now — it won&apos;t be shown again.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2">
            <code className="flex-1 truncate font-mono text-sm text-neutral-100">
              {revealedKey}
            </code>
            <Button
              size="sm"
              onClick={() => revealedKey && void navigator.clipboard.writeText(revealedKey)}
            >
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setRevealedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingRevokeId !== null} onOpenChange={() => setPendingRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke the API key. Any integrations using it will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRevokeId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-coral text-neutral-100 hover:opacity-90"
              onClick={() => pendingRevokeId && handleRevoke(pendingRevokeId)}
              disabled={revokeKey.isPending}
            >
              {revokeKey.isPending ? 'Revoking…' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

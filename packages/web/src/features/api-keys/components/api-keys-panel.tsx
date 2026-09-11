'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Key, Plus, Copy, Check, ArrowRightLeft } from 'lucide-react';

import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../hooks';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { cn } from '@/shared/lib/cn';

export function ApiKeysPanel() {
  const { data: keys, isLoading, isError } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

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

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/5 bg-neutral-900/50 p-6 backdrop-blur-sm',
        'transition-colors hover:border-white/10',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="title-1">API Keys</h2>
          <p className="body-muted mt-1">Create and manage API keys for the VS Code extension</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus />
          Create Key
        </Button>
      </div>

      <div className="mt-6">
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

        {!isLoading && !isError && keys !== undefined && keys.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border border-white/5 bg-neutral-900/30 p-8 text-center">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-neutral-900">
                <Key className="h-5 w-5 text-neutral-300" />
              </div>
              <ArrowRightLeft className="h-4 w-4 text-neutral-600" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-neutral-900 font-semibold mono-sm">
                VS
              </div>
            </div>
            <p className="body-muted max-w-md">
              An API key lets you connect to our API and track your metrics from the VS Code
              extension.
            </p>
            <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus />
              Create Key
            </Button>
          </div>
        )}

        {!isLoading && !isError && keys !== undefined && keys.length > 0 && (
          <div className="flex flex-col">
            <div className="mb-2 grid grid-cols-12 gap-4 border-b border-white/5 pb-3 label-caps">
              <div className="col-span-5">Name</div>
              <div className="col-span-4">Created</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {keys.map((key, i) => (
              <div
                key={key.id}
                className={cn(
                  'grid grid-cols-12 items-center gap-4 py-3.5 text-sm transition-colors',
                  i !== keys.length - 1 && 'border-b border-white/5',
                  'hover:bg-white/2 rounded-lg px-2 -mx-2',
                )}
              >
                <div className="col-span-5 flex flex-col gap-0.5">
                  <span className="body-base">{key.name}</span>
                  <span className="mono-sm text-neutral-500">{key.keyPrefix}••••••••</span>
                </div>
                <div className="col-span-4 flex flex-col gap-0.5">
                  <span className="text-sm text-neutral-300">
                    {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                  </span>
                  <span className="caption">
                    {key.lastUsedAt !== null
                      ? `Last used ${formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}`
                      : 'Never used'}
                  </span>
                </div>
                <div className="col-span-3 flex items-center justify-end">
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
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 title-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/10 bg-neutral-900">
                <Key className="h-5 w-5 text-neutral-300" />
              </div>
              Create API Key
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                autoFocus
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. MacBook Pro VS Code"
                type="text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setCreateOpen(false);
                setNewKeyName('');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={newKeyName.trim().length === 0}
              loading={createKey.isPending}
            >
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revealedKey !== null} onOpenChange={() => setRevealedKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="title-3">Your new API key</DialogTitle>
            <DialogDescription className="body-muted">
              Copy it now — it won&apos;t be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900 px-3 py-2.5">
            <code className="flex-1 break-all font-mono text-sm text-neutral-100">
              {revealedKey}
            </code>
            <Button size="sm" onClick={() => revealedKey && handleCopy(revealedKey)}>
              {hasCopied ? (
                <>
                  <Check className="text-green-spring" />
                  Copied
                </>
              ) : (
                <>
                  <Copy />
                  Copy
                </>
              )}
            </Button>
          </div>

          <DialogFooter className="mt-4">
            <Button size="sm" onClick={() => setRevealedKey(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingRevokeId !== null} onOpenChange={() => setPendingRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="title-3">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="body-muted">
              This will permanently revoke the API key. Any integrations using it will stop working
              immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              className="bg-neutral-900 border border-white/10 text-neutral-100 hover:bg-neutral-800 h-9 px-3 rounded-[10px] text-sm font-medium"
              onClick={() => setPendingRevokeId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-coral text-white hover:bg-red-coral/90 h-9 px-3 rounded-[10px] text-sm font-medium"
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

'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Key, Plus, Copy, Check, Blocks, Terminal } from 'lucide-react';

import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../hooks';
import { type ApiKeySummary } from '../api';
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
  const [newKeyType, setNewKeyType] = useState<'extension' | 'integration'>('extension');
  const [newDeviceLabel, setNewDeviceLabel] = useState('');

  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  async function handleCreate() {
    const name = newKeyName.trim();
    if (name.length === 0) return;

    const result = await createKey.mutateAsync({
      name,
      type: newKeyType,
      deviceLabel: newDeviceLabel.trim().length > 0 ? newDeviceLabel.trim() : undefined,
    });
    setRevealedKey(result.rawKey);
    setNewKeyName('');
    setNewDeviceLabel('');
    setNewKeyType('extension');
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

  const extensionKeys = keys?.filter((k) => k.type === 'extension') ?? [];
  const integrationKeys = keys?.filter((k) => k.type === 'integration') ?? [];

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
              <span className="body-base">{key.name}</span>
              <span className="mono-sm text-neutral-500">{key.keyPrefix}••••••••</span>
            </div>
            <div className="col-span-3 flex flex-col gap-0.5">
              {key.type === 'extension' && key.deviceLabel ? (
                <span className="text-neutral-300">{key.deviceLabel}</span>
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </div>
            <div className="col-span-3 flex flex-col gap-0.5">
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
    <div
      className={cn(
        'rounded-2xl border border-white/5 bg-neutral-900/50 p-6 backdrop-blur-sm',
        'transition-colors hover:border-white/10',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="title-1">API Keys</h2>
          <p className="body-muted mt-1">Manage API keys for VS Code and external integrations</p>
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
            </div>
            <p className="body-muted max-w-md">
              Create an API key to track your metrics from VS Code or connect external integrations.
            </p>
            <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus />
              Create Key
            </Button>
          </div>
        )}

        {!isLoading && !isError && keys !== undefined && keys.length > 0 && (
          <div className="mt-4 flex flex-col gap-10">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-neutral-400" />
                <h3 className="title-3">Extension Keys</h3>
              </div>
              {renderKeysList(extensionKeys, 'No extension keys found.')}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Blocks className="h-4 w-4 text-neutral-400" />
                <h3 className="title-3">Integration Keys</h3>
              </div>
              {renderKeysList(integrationKeys, 'No integration keys found.')}
            </section>
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

          <div className="mt-4 space-y-5">
            <div className="space-y-2">
              <Label>Key Type</Label>
              <div className="flex gap-4">
                <label
                  className={cn(
                    'flex-1 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                    newKeyType === 'extension'
                      ? 'border-white/20 bg-white/5'
                      : 'border-white/5 hover:bg-white/2',
                  )}
                >
                  <input
                    type="radio"
                    name="keyType"
                    value="extension"
                    checked={newKeyType === 'extension'}
                    onChange={() => setNewKeyType('extension')}
                    className="hidden"
                  />
                  <Terminal
                    className={cn(
                      'h-5 w-5',
                      newKeyType === 'extension' ? 'text-neutral-100' : 'text-neutral-500',
                    )}
                  />
                  <div>
                    <div className="text-sm font-medium text-neutral-200">Extension</div>
                    <div className="caption mt-0.5">For tracking VS Code</div>
                  </div>
                </label>
                <label
                  className={cn(
                    'flex-1 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                    newKeyType === 'integration'
                      ? 'border-white/20 bg-white/5'
                      : 'border-white/5 hover:bg-white/2',
                  )}
                >
                  <input
                    type="radio"
                    name="keyType"
                    value="integration"
                    checked={newKeyType === 'integration'}
                    onChange={() => setNewKeyType('integration')}
                    className="hidden"
                  />
                  <Blocks
                    className={cn(
                      'h-5 w-5',
                      newKeyType === 'integration' ? 'text-neutral-100' : 'text-neutral-500',
                    )}
                  />
                  <div>
                    <div className="text-sm font-medium text-neutral-200">Integration</div>
                    <div className="caption mt-0.5">For reading analytics</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                autoFocus
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder={
                  newKeyType === 'extension' ? 'e.g. MacBook Pro VS Code' : 'e.g. Zapier'
                }
                type="text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
            </div>

            {newKeyType === 'extension' && (
              <div className="space-y-2">
                <Label htmlFor="device-label">Device Label (Optional)</Label>
                <Input
                  id="device-label"
                  value={newDeviceLabel}
                  onChange={(e) => setNewDeviceLabel(e.target.value)}
                  placeholder="e.g. Work Laptop"
                  type="text"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                  }}
                />
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setCreateOpen(false);
                setNewKeyName('');
                setNewDeviceLabel('');
                setNewKeyType('extension');
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

'use client';

import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';
import { ApiKeySummary } from '@/shared/types';

interface ApiKeysTableProps {
  list: ApiKeySummary[];
  emptyMessage: string;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}

export function ApiKeysTable({ list, emptyMessage, onRevoke, isRevoking }: ApiKeysTableProps) {
  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-2 grid grid-cols-12 gap-4 border-b border-border pb-3 text-xs font-medium uppercase tracking-wider text-subtle">
        <div className="col-span-4">Name</div>
        <div className="col-span-3">Device</div>
        <div className="col-span-3">Created</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {list.map((key, i) => (
        <div
          key={key.id}
          className={cn(
            'relative grid grid-cols-12 items-center gap-4 py-3.5 text-sm transition-colors',
            'hover:bg-gray-alpha-50 -mx-2 rounded-lg px-2',
            i !== list.length - 1 &&
              'after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-border',
          )}
        >
          <div className="col-span-4 flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{key.name}</span>
            <span className="font-mono text-xs text-subtle">{key.keyPrefix}••••••••</span>
          </div>

          <div className="col-span-3 flex flex-col gap-0.5">
            {key.type === 'extension' && key.deviceLabel ? (
              <span className="font-mono text-xs text-secondary">{key.deviceLabel}</span>
            ) : (
              <span className="text-sm text-subtle">—</span>
            )}
          </div>

          <div className="col-span-3 flex flex-col gap-0.5" suppressHydrationWarning>
            <span className="text-sm text-secondary">
              {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
            </span>
            <span className="text-xs text-subtle">
              {key.lastUsedAt !== null
                ? `Used ${formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}`
                : 'Never used'}
            </span>
          </div>

          <div className="col-span-2 flex items-center justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRevoke(key.id)}
              disabled={isRevoking}
            >
              Revoke
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Key, Terminal, Blocks } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/cn';
import { useCreateApiKey } from '../hooks';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeyCreated: (rawKey: string) => void;
}

export function CreateApiKeyDialog({ open, onOpenChange, onKeyCreated }: CreateApiKeyDialogProps) {
  const createKey = useCreateApiKey();
  const [name, setName] = useState('');
  const [type, setType] = useState<'extension' | 'integration'>('extension');
  const [deviceLabel, setDeviceLabel] = useState('');

  const resetForm = () => {
    setName('');
    setDeviceLabel('');
    setType('extension');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const result = await createKey.mutateAsync({
      name: trimmedName,
      type,
      deviceLabel: deviceLabel.trim() || undefined,
    });

    onKeyCreated(result.rawKey);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 title-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-neutral-900">
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
                  type === 'extension'
                    ? 'border-white/20 bg-white/5'
                    : 'border-white/5 hover:bg-white/2',
                )}
              >
                <input
                  type="radio"
                  name="keyType"
                  value="extension"
                  checked={type === 'extension'}
                  onChange={() => setType('extension')}
                  className="hidden"
                />
                <Terminal
                  className={cn(
                    'h-5 w-5 mt-0.5',
                    type === 'extension' ? 'text-neutral-100' : 'text-neutral-500',
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
                  type === 'integration'
                    ? 'border-white/20 bg-white/5'
                    : 'border-white/5 hover:bg-white/2',
                )}
              >
                <input
                  type="radio"
                  name="keyType"
                  value="integration"
                  checked={type === 'integration'}
                  onChange={() => setType('integration')}
                  className="hidden"
                />
                <Blocks
                  className={cn(
                    'h-5 w-5 mt-0.5',
                    type === 'integration' ? 'text-neutral-100' : 'text-neutral-500',
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'extension' ? 'e.g. MacBook Pro VS Code' : 'e.g. Zapier'}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>

          {type === 'extension' && (
            <div className="space-y-2">
              <Label htmlFor="device-label">Device Label (Optional)</Label>
              <Input
                id="device-label"
                value={deviceLabel}
                onChange={(e) => setDeviceLabel(e.target.value)}
                placeholder="e.g. Work Laptop"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={name.trim().length === 0}
            loading={createKey.isPending}
          >
            Create Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

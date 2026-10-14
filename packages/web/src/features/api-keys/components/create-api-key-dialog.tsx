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
import { RadioCards, RadioCardsItem } from '@/shared/components/ui/radio-cards';
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
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-gray-alpha-50">
              <Key className="h-5 w-5 text-subtle" strokeWidth={1.5} />
            </div>
            Create API key
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          <div className="space-y-2">
            <Label>Key type</Label>
            <RadioCards
              value={type}
              onValueChange={(v) => setType(v as 'extension' | 'integration')}
            >
              <RadioCardsItem
                value="extension"
                icon={Terminal}
                title="Extension"
                description="For tracking VS Code"
              />
              <RadioCardsItem
                value="integration"
                icon={Blocks}
                title="Integration"
                description="For reading analytics"
              />
            </RadioCards>
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
              <Label htmlFor="device-label">Device label (optional)</Label>
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
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={name.trim().length === 0}
            loading={createKey.isPending}
          >
            Create key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

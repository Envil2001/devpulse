'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface RevealedKeyDialogProps {
  apiKey: string | null;
  onClose: () => void;
}

export function RevealedKeyDialog({ apiKey, onClose }: RevealedKeyDialogProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <Dialog open={apiKey !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="title-3">Your new API key</DialogTitle>
          <DialogDescription className="body-muted">
            Copy it now — it won&apos;t be shown again.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900 px-3 py-2.5">
          <code className="flex-1 break-all font-mono text-sm text-neutral-100">{apiKey}</code>
          <Button size="sm" onClick={handleCopy}>
            {hasCopied ? (
              <>
                <Check className="mr-1.5 h-4 w-4 text-green-spring" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>

        <DialogFooter className="mt-4">
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

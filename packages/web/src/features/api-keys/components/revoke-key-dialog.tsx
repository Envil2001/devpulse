'use client';

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

interface RevokeKeyDialogProps {
  keyId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isPending: boolean;
}

export function RevokeKeyDialog({ keyId, onClose, onConfirm, isPending }: RevokeKeyDialogProps) {
  return (
    <AlertDialog open={keyId !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently revoke the API key. Any integrations using it will stop working
            immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-coral text-white hover:bg-red-coral/90 active:bg-red-coral/80"
            onClick={() => keyId && onConfirm(keyId)}
            disabled={isPending}
          >
            {isPending ? 'Revoking…' : 'Revoke'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

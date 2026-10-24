'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Key, Terminal, Blocks } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { RadioCards, RadioCardsItem } from '@/shared/components/ui/radio-cards';
import { useCreateApiKey } from '../hooks';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeyCreated: (rawKey: string) => void;
}

interface CreateKeyFormValues {
  name: string;
  type: 'extension' | 'integration';
  deviceLabel: string;
}

export function CreateApiKeyDialog({ open, onOpenChange, onKeyCreated }: CreateApiKeyDialogProps) {
  const createKey = useCreateApiKey();

  const form = useForm<CreateKeyFormValues>({
    defaultValues: {
      name: '',
      type: 'extension',
      deviceLabel: '',
    },
    mode: 'onChange',
  });

  const watchType = form.watch('type');

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const onSubmit = async (values: CreateKeyFormValues) => {
    try {
      const result = await createKey.mutateAsync({
        name: values.name.trim(),
        type: values.type,
        deviceLabel: values.deviceLabel.trim() || undefined,
      });
      onKeyCreated(result.rawKey);
      handleClose();
    } catch {}
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-5">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key type</FormLabel>
                  <FormControl>
                    <RadioCards value={field.value} onValueChange={field.onChange}>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder={
                        watchType === 'extension' ? 'e.g. MacBook Pro VS Code' : 'e.g. Zapier'
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === 'extension' && (
              <FormField
                control={form.control}
                name="deviceLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device label (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Work Laptop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="mt-6 gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" loading={createKey.isPending}>
                Create key
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

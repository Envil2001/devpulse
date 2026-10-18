'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

import { buildLoginCryptoPayload, generateKeyPair } from '../crypto';
import { ApiClientError } from '@/shared/api/api-client';
import { useAuth } from '../context';
import { authService } from '@/shared/api/services';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  if (err instanceof Error) return err.message;
  return 'An unknown error occurred';
}

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const ephemeralKeys = generateKeyPair();

      const beginRes = await authService.loginBegin(values.email, ephemeralKeys.publicKey);

      const { clientProof } = await buildLoginCryptoPayload(
        values.password,
        beginRes.salt,
        beginRes.serverPublicKey,
        ephemeralKeys.publicKey,
      );

      await authService.loginVerify(values.email, clientProof);
      const user = await authService.getMe();

      login(user);
      router.push('/');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
      <div className="text-center lg:text-left">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Welcome back</h2>
        <p className="mt-1 text-sm text-secondary">
          Enter your credentials to access your account.
        </p>
      </div>

      {error && (
        <div className="rounded-[10px] border border-red-coral/30 bg-red-coral/10 p-3 text-sm text-red-coral">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="john@example.com"
                    autoFocus
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-coral" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Button
                    variant="link"
                    asChild
                    className="h-auto p-0 text-xs font-medium no-underline"
                  >
                    <Link href="/forgot-password">Forgot?</Link>
                  </Button>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-coral" />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-4 w-full" loading={isLoading}>
            Sign in
          </Button>
        </form>
      </Form>

      <p className="flex items-center justify-center gap-1 text-center text-sm text-secondary">
        Don&apos;t have an account?
        <Button
          variant="link"
          asChild
          className="h-auto p-0 font-medium no-underline hover:text-brand"
        >
          <Link href="/register">Create one</Link>
        </Button>
      </p>
    </div>
  );
}

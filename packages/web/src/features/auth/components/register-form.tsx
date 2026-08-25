'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

import { AuthService } from '@/features/auth/api';
import { useAuth } from '@/features/auth/context';
import { buildSignupCryptoPayload } from '@/features/auth/crypto';
import { ApiClientError } from '@/shared/api/api-client';

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

const registerSchema = z.object({
  displayName: z
    .string()
    .min(3, 'Minimum 3 characters')
    .max(20, 'Maximum 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const verifySchema = z.object({
  code: z.string().length(6, 'Verification code must be exactly 6 characters'),
});

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unknown error occurred';
}

export function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authService = new AuthService();

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const verifyForm = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (step === 'verify') {
      verifyForm.reset({ code: '' });
    }
  }, [step, verifyForm]);

  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signupBegin(values.email, values.displayName);
      setStep('verify');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifySubmit = async (values: z.infer<typeof verifySchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      const { email, password } = registerForm.getValues();

      const verifyRes = await authService.signupVerify(email, values.code);
      const signupToken = verifyRes.signupToken;

      const cryptoPayload = await buildSignupCryptoPayload(password);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const completeRes = await authService.signupComplete(
        { ...cryptoPayload, timezone },
        signupToken,
      );

      login(completeRes.user);
      router.push('/');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { email, displayName } = registerForm.getValues();
      await authService.signupBegin(email, displayName);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const renderRegisterForm = () => (
    <>
      <div className="text-center lg:text-left">
        <h2 className="title-2">Create Account</h2>
        <p className="body-muted mt-1">Enter your details to create an account</p>
      </div>

      <Form {...registerForm}>
        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
          <FormField
            control={registerForm.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="johndoe"
                    autoComplete="username"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-coral" />
              </FormItem>
            )}
          />

          <FormField
            control={registerForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="john@example.com"
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
            control={registerForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-coral" />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-2 w-full" loading={isLoading}>
            Continue
          </Button>
        </form>
      </Form>

      <p className="body-muted flex items-center justify-center gap-1 text-center">
        Already have an account?
        <Button
          variant="link"
          asChild
          className="h-auto p-0 font-bold text-neutral-100 no-underline hover:text-blue-frosty"
        >
          <Link href="/login">Log in</Link>
        </Button>
      </p>
    </>
  );

  const renderVerifyForm = () => (
    <>
      <div className="text-center lg:text-left">
        <h2 className="title-2">Email Verification</h2>
        <p className="body-muted mt-1">Enter the 6-digit code sent to your email</p>
      </div>

      <Form {...verifyForm}>
        <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
          <FormField
            control={verifyForm.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123456"
                    autoFocus
                    autoComplete="one-time-code"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-coral" />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-2 w-full" loading={isLoading}>
            Verify & Create
          </Button>
        </form>
      </Form>

      <p className="body-muted flex items-center justify-center gap-1 text-center">
        Didn&apos;t receive the email?
        <Button
          variant="link"
          type="button"
          onClick={handleResendCode}
          disabled={isLoading}
          className="h-auto p-0 font-bold text-neutral-100 no-underline hover:text-blue-frosty"
        >
          Resend code
        </Button>
      </p>
    </>
  );

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
      {error && (
        <div className="body-base rounded-xl border border-red-coral bg-red-coral/10 p-3 text-red-coral">
          {error}
        </div>
      )}
      {step === 'register' ? renderRegisterForm() : renderVerifyForm()}
    </div>
  );
}

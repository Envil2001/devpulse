'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

import { AuthService } from '@/lib/auth.service';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { buildSignupCryptoPayload } from '@/lib/crypto';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

export default function RegisterPage() {
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
        <h2 className="h4 text-neutral-100">Create Account</h2>
        <p className="desc text-neutral-400 mt-1">Enter your details to create an account</p>
      </div>

      <Form {...registerForm}>
        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
          <FormField
            control={registerForm.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-100">Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" disabled={isLoading} {...field} />
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
                <FormLabel className="text-neutral-100">Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" disabled={isLoading} {...field} />
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
                <FormLabel className="text-neutral-100">Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage className="text-red-coral" />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            Continue
          </Button>
        </form>
      </Form>

      <p className="text-center body1 text-neutral-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-bold text-neutral-100 hover:text-blue-frosty transition-colors"
        >
          Log in
        </Link>
      </p>
    </>
  );

  const renderVerifyForm = () => (
    <>
      <div className="text-center lg:text-left">
        <h2 className="h4 text-neutral-100">Email Verification</h2>
        <p className="desc text-neutral-400 mt-1">Enter the 6-digit code sent to your email</p>
      </div>

      <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
        <div>
          <label className="text-neutral-100 text-sm font-medium">Verification Code</label>
          <input
            type="text"
            placeholder="123456"
            autoFocus
            disabled={isLoading}
            {...verifyForm.register('code')}
            className="flex w-full rounded-md body1 transition-colors bg-neutral-700/50 text-neutral-100 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-electric focus-visible:ring-offset-2 h-9 px-4 py-2 mt-2 disabled:opacity-50"
          />
          {verifyForm.formState.errors.code && (
            <p className="text-sm font-medium text-red-coral mt-2">
              {verifyForm.formState.errors.code.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isLoading}>
          Verify & Create
        </Button>
      </form>

      <p className="text-center body1 text-neutral-400">
        Didn&apos;t receive the email?{' '}
        <button
          type="button"
          className="font-bold text-neutral-100 hover:text-blue-frosty transition-colors disabled:opacity-50"
          onClick={handleResendCode}
          disabled={isLoading}
        >
          Resend code
        </button>
      </p>
    </>
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-sm mx-auto">
      {error && (
        <div className="bg-red-coral/10 border border-red-coral text-red-coral p-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {step === 'register' ? renderRegisterForm() : renderVerifyForm()}
    </div>
  );
}

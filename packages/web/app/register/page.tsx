'use client';

import { CircleUserRound, LockKeyhole, Mail, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ApiClientError } from '@/lib/api-client';
import { register } from '@/lib/auth-client';
import { setAccessToken } from '@/lib/auth-storage';

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const auth = await register({
        email,
        password,
        displayName: displayName.trim().length > 0 ? displayName.trim() : undefined,
      });

      setAccessToken(auth.accessToken);
      router.push('/');
    } catch (submitError) {
      if (submitError instanceof ApiClientError) {
        setError(submitError.message);
      } else {
        setError('Unexpected error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
      <div className="card-shell w-full rounded-xl p-5">
        <h1 className="text-(--color-text) text-xl font-semibold">Create your account</h1>
        <p className="text-(--color-text-muted) mt-1 text-sm">
          Start tracking your engineering focus.
        </p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-(--color-text-muted) mb-1 inline-flex items-center gap-1 text-sm">
              <CircleUserRound size={14} />
              Display Name (optional)
            </span>
            <input
              className="border-(--color-border) bg-(--color-surface) text-(--color-text) focus:border-(--color-primary) w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              placeholder="Your name"
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
              }}
            />
          </label>

          <label className="block">
            <span className="text-(--color-text-muted) mb-1 inline-flex items-center gap-1 text-sm">
              <Mail size={14} />
              Email
            </span>
            <input
              required
              className="border-(--color-border) bg-(--color-surface) text-(--color-text) focus:border-(--color-primary) w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          </label>

          <label className="block">
            <span className="text-(--color-text-muted) mb-1 inline-flex items-center gap-1 text-sm">
              <LockKeyhole size={14} />
              Password
            </span>
            <input
              required
              className="border-(--color-border) bg-(--color-surface) text-(--color-text) focus:border-(--color-primary) w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              minLength={8}
              placeholder="At least 8 characters"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
            />
          </label>

          {error !== null && (
            <p className="bg-(--color-primary-soft) text-(--color-danger) rounded-lg px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <button
            className="ui-button-primary inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-semibold"
            disabled={isSubmitting}
            type="submit"
          >
            <UserPlus size={16} />
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-(--color-text-muted) mt-4 text-sm">
          Already registered?{' '}
          <Link className="text-(--color-primary) font-semibold" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

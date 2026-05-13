'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CircleUserRound, LockKeyhole, Mail, UserPlus } from 'lucide-react';

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
        <h1 className="text-xl font-semibold text-(--color-text)">Create your account</h1>
        <p className="mt-1 text-sm text-(--color-text-muted)">
          Start tracking your engineering focus.
        </p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 inline-flex items-center gap-1 text-sm text-(--color-text-muted)">
              <CircleUserRound size={14} />
              Display Name (optional)
            </span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-primary)"
              placeholder="Your name"
            />
          </label>

          <label className="block">
            <span className="mb-1 inline-flex items-center gap-1 text-sm text-(--color-text-muted)">
              <Mail size={14} />
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-primary)"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 inline-flex items-center gap-1 text-sm text-(--color-text-muted)">
              <LockKeyhole size={14} />
              Password
            </span>
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text) outline-none transition-colors focus:border-(--color-primary)"
              placeholder="At least 8 characters"
            />
          </label>

          {error !== null && (
            <p className="rounded-lg bg-(--color-primary-soft) px-3 py-2 text-sm text-(--color-danger)">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="ui-button-primary inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-semibold"
          >
            <UserPlus size={16} />
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-(--color-text-muted)">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-(--color-primary)">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

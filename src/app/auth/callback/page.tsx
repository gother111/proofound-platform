'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_ERROR_MESSAGE = 'We could not validate your authentication link. Please try again.';
const DEFAULT_REDIRECT = '/app/i/home';

type Status = 'loading' | 'error';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackPageShell status="loading" errorMessage={null} />}>
      <AuthCallbackPageContent />
    </Suspense>
  );
}

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const supabase = createClient();

    const redirectWithError = (message: string) => {
      setStatus('error');
      setErrorMessage(message);
      const loginUrl = new URL('/login', window.location.origin);
      loginUrl.searchParams.set('error', message);
      router.replace(`${loginUrl.pathname}${loginUrl.search}${loginUrl.hash}`);
    };

    const redirectTo = (path: string) => {
      router.replace(path);
    };

    const handleAuthCallback = async () => {
      const code = params.get('code');
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      const nextParam = params.get('next');

      if (type === 'email' && tokenHash) {
        const verifyUrl = new URL('/verify-email', window.location.origin);
        verifyUrl.searchParams.set('token', tokenHash);
        redirectTo(`${verifyUrl.pathname}${verifyUrl.search}${verifyUrl.hash}`);
        return;
      }

      if (type === 'recovery') {
        const resetUrl = new URL('/reset-password/confirm', window.location.origin);
        if (code) {
          resetUrl.searchParams.set('code', code);
        }
        if (tokenHash) {
          resetUrl.searchParams.set('token', tokenHash);
        }
        redirectTo(`${resetUrl.pathname}${resetUrl.search}${resetUrl.hash}`);
        return;
      }

      if (!code) {
        redirectWithError(DEFAULT_ERROR_MESSAGE);
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Failed to exchange OAuth code for session:', error);
        redirectWithError(DEFAULT_ERROR_MESSAGE);
        return;
      }

      let destination = DEFAULT_REDIRECT;
      if (nextParam) {
        try {
          const nextUrl = new URL(nextParam, window.location.origin);
          destination = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
        } catch (parseError) {
          console.warn('Ignoring invalid next parameter:', parseError);
        }
      }

      setStatus('loading');
      redirectTo(destination);
    };

    handleAuthCallback().catch((error) => {
      console.error('Unexpected error handling auth callback:', error);
      redirectWithError(DEFAULT_ERROR_MESSAGE);
    });
  }, [router, searchParamsString]);

  return <AuthCallbackPageShell status={status} errorMessage={errorMessage} />;
}

function AuthCallbackPageShell({
  status,
  errorMessage,
}: {
  status: Status;
  errorMessage: string | null;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-display font-semibold text-primary-500 mb-4">
          {status === 'loading' ? 'Signing you in…' : 'Unable to sign you in'}
        </h1>
        {status === 'loading' ? (
          <p className="text-neutral-dark-600">Please hold on while we finalize your sign-in.</p>
        ) : (
          <p className="text-error">{errorMessage ?? DEFAULT_ERROR_MESSAGE}</p>
        )}
      </div>
    </div>
  );
}

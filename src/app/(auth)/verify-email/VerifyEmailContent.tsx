'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyEmail } from '@/actions/auth';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import {
  clientVerificationLinkVisualFixturesEnabled,
  isVisualEmailVerificationToken,
} from '@/lib/verification/visual-link-fixtures';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VERIFY_EMAIL_RETRY_MESSAGE =
  'We could not verify this email link. The link may be expired; try signing up again or go to login.';
const VERIFY_EMAIL_SAFE_ACTION_ERRORS = new Set([
  'No verification token provided',
  'Invalid or expired verification link',
]);

function verifyEmailErrorMessage(message: string) {
  if (VERIFY_EMAIL_SAFE_ACTION_ERRORS.has(message)) {
    return message;
  }

  dispatchClientDiagnostic('auth.verify_email.returned_error', {
    hasReturnedError: true,
  });
  return VERIFY_EMAIL_RETRY_MESSAGE;
}

export function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(true);

  useEffect(() => {
    const token = searchParams?.get('token');
    const verificationType = searchParams?.get('type') === 'signup' ? 'signup' : 'email';

    if (!token) {
      setStatus('error');
      setError('No verification token provided');
      return;
    }

    if (clientVerificationLinkVisualFixturesEnabled() && isVisualEmailVerificationToken(token)) {
      setAutoRedirectEnabled(false);
      setStatus('success');
      return;
    }

    async function verify() {
      const formData = new FormData();
      formData.append('token', token!);
      formData.append('type', verificationType);

      try {
        const result = await verifyEmail(formData);
        if (result.error) {
          setStatus('error');
          setError(verifyEmailErrorMessage(result.error));
        } else {
          setStatus('success');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (caught) {
        dispatchClientErrorDiagnostic('auth.verify_email.failed', caught);
        setStatus('error');
        setError(VERIFY_EMAIL_RETRY_MESSAGE);
      }
    }

    verify();
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10 dark:bg-background"
        data-testid="verify-email-loading"
      >
        <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)] dark:border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
              <Loader2 className="h-6 w-6 animate-spin text-proofound-forest dark:text-primary" />
            </div>
            <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal dark:text-foreground">
              Verifying your email
            </h1>
            <CardDescription className="leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
              Please wait while we verify your email address.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10 dark:bg-background"
        data-testid="verify-email-error"
      >
        <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)] dark:border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal dark:text-foreground">
              Verification failed
            </h1>
            <CardDescription
              className="leading-6 text-proofound-charcoal/70 dark:text-muted-foreground"
              role="alert"
              aria-live="assertive"
            >
              {error || 'We couldn&apos;t verify your email address'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
              The verification link may have expired or is invalid. Please try signing up again or
              contact support.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant="outline"
                className="flex-1 border-proofound-stone dark:border-border"
              >
                <Link href="/signup">Sign up again</Link>
              </Button>
              <Button
                asChild
                className="flex-1 bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Link href="/login">Go to login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10 dark:bg-background"
      data-testid="verify-email-success"
    >
      <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)] dark:border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
            <CheckCircle className="h-6 w-6 text-proofound-forest dark:text-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal dark:text-foreground">
            Email verified!
          </h1>
          <CardDescription className="leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
            Your email has been successfully verified.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-sm leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
            {autoRedirectEnabled
              ? 'Redirecting to login in a few seconds.'
              : 'You can continue to login when ready.'}
          </p>
          <Button
            asChild
            className="w-full bg-proofound-forest hover:bg-proofound-forest/90 text-white"
          >
            <Link href="/login">Go to login now</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import {
  buildVisualWorkEmailVerificationResponse,
  clientVerificationLinkVisualFixturesEnabled,
} from '@/lib/verification/visual-link-fixtures';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

const WORK_EMAIL_VERIFY_RETRY_MESSAGE =
  'Work-email verification could not be completed. Request a fresh link from settings and try again.';
const WORK_EMAIL_VERIFY_SAFE_ERRORS = new Map([
  [
    'Verification token is required',
    'Verification token is missing. Please check your email for the correct link.',
  ],
  [
    'Invalid or expired verification token',
    'This work-email link is invalid or expired. Request a fresh link from settings.',
  ],
  [
    'Verification token has expired. Please request a new one.',
    'This work-email link has expired. Request a fresh link from settings.',
  ],
  [
    'This work email is already verified by another account',
    'This work email is already verified by another account.',
  ],
  ['Failed to verify work email', WORK_EMAIL_VERIFY_RETRY_MESSAGE],
  ['Internal server error', WORK_EMAIL_VERIFY_RETRY_MESSAGE],
]);

function workEmailVerifyErrorMessage(error?: string | null) {
  const normalized = error?.trim();
  if (!normalized) {
    return WORK_EMAIL_VERIFY_RETRY_MESSAGE;
  }

  const safeMessage = WORK_EMAIL_VERIFY_SAFE_ERRORS.get(normalized);
  if (safeMessage) {
    return safeMessage;
  }

  dispatchClientErrorDiagnostic(
    'verification.work_email_verify.returned_error',
    new Error(normalized)
  );
  return WORK_EMAIL_VERIFY_RETRY_MESSAGE;
}

export function VerifyWorkEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(false);

  const verifyToken = useCallback(
    async (token: string) => {
      try {
        if (clientVerificationLinkVisualFixturesEnabled()) {
          const visualResponse = buildVisualWorkEmailVerificationResponse(token);
          if (visualResponse) {
            setStatus('success');
            setMessage(visualResponse.message);
            setWorkEmail(visualResponse.workEmail);
            setAutoRedirectEnabled(false);
            return;
          }
        }

        const response = await fetch(`/api/verification/work-email/verify?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Work email verified successfully!');
          setWorkEmail(data.workEmail || '');
          setAutoRedirectEnabled(true);

          // Redirect to profile after 3 seconds
          setTimeout(() => {
            router.push('/app/i/profile');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(workEmailVerifyErrorMessage(data?.error));
        }
      } catch (error) {
        dispatchClientErrorDiagnostic('verification.work_email_verify.client_failed', error);
        setStatus('error');
        setMessage(WORK_EMAIL_VERIFY_RETRY_MESSAGE);
      }
    },
    [router]
  );

  useEffect(() => {
    const token = searchParams?.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please check your email for the correct link.');
      return;
    }

    // Call the verification API
    verifyToken(token);
  }, [searchParams, verifyToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4 py-10 dark:bg-background">
      <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)] dark:border-border">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            {status === 'loading' && (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
                <Loader2 className="h-6 w-6 animate-spin text-proofound-forest" />
              </span>
            )}
            {status === 'success' && (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
                <CheckCircle2 className="h-6 w-6 text-proofound-forest" />
              </span>
            )}
            {status === 'error' && (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal">
            {status === 'loading' && 'Verifying work email'}
            {status === 'success' && 'Work email verified'}
            {status === 'error' && 'Verification failed'}
          </h1>
          <CardDescription className="leading-6 text-proofound-charcoal/70">
            {status === 'loading' && 'Please wait while we verify the workplace check.'}
            {status === 'success' && 'Your workplace check is now active while it stays fresh.'}
            {status === 'error' &&
              'The link could not be verified. Request a fresh work-email link from settings.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <p className="text-center text-sm leading-6 text-muted-foreground">
              This usually takes only a moment.
            </p>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <Alert className="border-[#D7E8DE] bg-[#F3FAF6]">
                <Mail className="h-4 w-4 text-proofound-forest" />
                <AlertDescription className="text-proofound-charcoal">
                  {message}
                  {workEmail && (
                    <>
                      <br />
                      <strong className="mt-2 block">{workEmail}</strong>
                    </>
                  )}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-proofound-forest" />
                  <span>Your account now has an active workplace check</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-proofound-forest" />
                  <span>Organizations can see the workplace check while it stays fresh</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-proofound-forest" />
                  <span>Intro readiness can use this account-side check where relevant</span>
                </div>
              </div>

              <p className="pt-4 text-center text-sm text-muted-foreground">
                {autoRedirectEnabled
                  ? 'Redirecting to your verification center in a few seconds.'
                  : 'You can return to your verification center when ready.'}
              </p>

              <Button
                onClick={() => router.push('/app/i/verifications')}
                className="w-full bg-proofound-forest hover:bg-proofound-forest/90"
              >
                Go to verification center
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/45 p-3">
                <p className="text-sm text-muted-foreground">Common issues:</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-muted-foreground">
                  <li>The verification link has expired (links expire after 24 hours)</li>
                  <li>The link has already been used</li>
                  <li>The link is invalid or incomplete</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push('/app/i/settings')}
                  className="w-full bg-proofound-forest hover:bg-proofound-forest/90"
                >
                  Open work-email settings
                </Button>
                <Button
                  onClick={() => router.push('/app/i/profile')}
                  variant="outline"
                  className="w-full"
                >
                  Return to Public Page
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

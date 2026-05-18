'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyEmail } from '@/actions/auth';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams?.get('token');
    const verificationType = searchParams?.get('type') === 'signup' ? 'signup' : 'email';

    if (!token) {
      setStatus('error');
      setError('No verification token provided');
      return;
    }

    async function verify() {
      const formData = new FormData();
      formData.append('token', token!);
      formData.append('type', verificationType);

      const result = await verifyEmail(formData);

      if (result.error) {
        setStatus('error');
        setError(result.error);
      } else {
        setStatus('success');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
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
            <CardTitle className="font-display text-2xl text-proofound-charcoal dark:text-foreground">
              Verifying your email
            </CardTitle>
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
            <CardTitle className="font-display text-2xl text-proofound-charcoal dark:text-foreground">
              Verification failed
            </CardTitle>
            <CardDescription className="leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
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
          <CardTitle className="font-display text-2xl text-proofound-charcoal dark:text-foreground">
            Email verified!
          </CardTitle>
          <CardDescription className="leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
            Your email has been successfully verified
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-sm leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
            Redirecting to login in 3 seconds.
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

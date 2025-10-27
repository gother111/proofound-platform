'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyEmail } from '@/actions/auth';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setError('No verification token provided');
      return;
    }

    async function verify() {
      const formData = new FormData();
      formData.append('token', token!);

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
      <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background px-4">
        <Card className="max-w-md w-full border-proofound-stone dark:border-border rounded-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-proofound-forest/10 flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-proofound-forest dark:text-primary animate-spin" />
            </div>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Verifying your email
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background px-4">
        <Card className="max-w-md w-full border-proofound-stone dark:border-border rounded-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Verification failed
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              {error || 'We couldn&apos;t verify your email address'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground text-center">
              The verification link may have expired or is invalid. Please try signing up again or
              contact support.
            </p>
            <div className="flex gap-4">
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
    <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background px-4">
      <Card className="max-w-md w-full border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-proofound-forest/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-proofound-forest dark:text-primary" />
          </div>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Email verified!
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Your email has been successfully verified
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-4">
            Redirecting to login in 3 seconds...
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background px-4">
          <Card className="max-w-md w-full border-proofound-stone dark:border-border rounded-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-proofound-forest/10 flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-proofound-forest dark:text-primary animate-spin" />
              </div>
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                Loading...
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

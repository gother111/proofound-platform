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
      <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
            <CardTitle>Verifying your email</CardTitle>
            <CardDescription>Please wait while we verify your email address...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <CardTitle>Verification failed</CardTitle>
            <CardDescription>
              {error || 'We couldn&apos;t verify your email address'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-dark-600 text-center">
              The verification link may have expired or is invalid. Please try signing up again or
              contact support.
            </p>
            <div className="flex gap-4">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/signup">Sign up again</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/login">Go to login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <CardTitle>Email verified!</CardTitle>
          <CardDescription>Your email has been successfully verified</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-neutral-dark-600 mb-4">Redirecting to login in 3 seconds...</p>
          <Button asChild className="w-full">
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
        <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

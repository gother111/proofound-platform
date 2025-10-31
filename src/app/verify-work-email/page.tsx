'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

function VerifyWorkEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [workEmail, setWorkEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please check your email for the correct link.');
      return;
    }

    // Call the verification API
    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`/api/verification/work-email/verify?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Work email verified successfully!');
        setWorkEmail(data.workEmail || '');
        
        // Redirect to profile after 3 seconds
        setTimeout(() => {
          router.push('/app/i/profile');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to verify work email');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-proofound-forest animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-center font-['Crimson_Pro'] text-2xl">
            {status === 'loading' && 'Verifying Your Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <p className="text-center text-muted-foreground">
              Please wait while we verify your work email...
            </p>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <Mail className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
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
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Your profile now has a verified badge</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Organizations can see you're verified</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Your match quality is improved</span>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground pt-4">
                Redirecting to your profile in a few seconds...
              </p>

              <Button
                onClick={() => router.push('/app/i/profile')}
                className="w-full bg-proofound-forest hover:bg-proofound-forest/90"
              >
                Go to Profile Now
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Common issues:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
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
                  Go to Settings to Try Again
                </Button>
                <Button
                  onClick={() => router.push('/app/i/profile')}
                  variant="outline"
                  className="w-full"
                >
                  Go to Profile
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyWorkEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background">
          <Loader2 className="w-16 h-16 text-proofound-forest animate-spin" />
        </div>
      }
    >
      <VerifyWorkEmailContent />
    </Suspense>
  );
}


'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Lazy-load Sentry to avoid loading it in initial homepage payload.
    void import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-display">Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-proofound-charcoal/70">
                We apologize for the inconvenience. An unexpected error has occurred and our team
                has been notified.
              </p>

              {process.env.NODE_ENV === 'development' && error.message && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm font-mono text-red-800">{error.message}</p>
                  {error.digest && (
                    <p className="mt-2 text-xs text-red-600">Error ID: {error.digest}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={reset}
                  className="flex-1 bg-proofound-forest hover:bg-proofound-forest/90"
                >
                  Try again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = '/')}
                  className="flex-1"
                >
                  Go home
                </Button>
              </div>

              <p className="text-xs text-center text-proofound-charcoal/50">
                If this problem persists, please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}

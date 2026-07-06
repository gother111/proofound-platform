'use client';

import * as Sentry from '@sentry/nextjs';
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
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-proofound-parchment p-4 py-10">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-proofound-terracotta/10 p-3">
                  <AlertCircle className="h-6 w-6 text-proofound-terracotta" />
                </div>
                <CardTitle className="text-2xl font-display">
                  Proofound could not finish loading
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-proofound-charcoal/70">
                Your proof, privacy settings, and review work are still protected. Retry Proofound
                before continuing.
              </p>

              {process.env.NODE_ENV === 'development' && error.message && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm font-mono text-red-800">{error.message}</p>
                  {error.digest && (
                    <p className="mt-2 text-xs text-red-600">Support reference: {error.digest}</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={reset}
                  className="flex-1 bg-proofound-forest hover:bg-proofound-forest/90"
                >
                  Retry Proofound
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = '/')}
                  className="flex-1"
                >
                  Go to home
                </Button>
              </div>

              <p className="text-xs text-center text-proofound-charcoal/50">
                If this keeps happening, contact support before making changes from this screen.
              </p>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}

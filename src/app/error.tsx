'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    dispatchClientErrorDiagnostic('app.error_boundary.caught', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-terracotta/10">
            <AlertCircle className="h-6 w-6 text-proofound-terracotta" />
          </div>
          <CardTitle>This page could not finish loading</CardTitle>
          <CardDescription>
            Your proof, privacy settings, and review work are still protected. Retry this page
            before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <details className="p-4 bg-neutral-light-100 rounded-lg text-sm">
              <summary className="cursor-pointer font-medium mb-2">
                Technical details for development
              </summary>
              <pre className="text-xs overflow-auto">{error.message}</pre>
              {error.digest && (
                <p className="mt-2 text-xs text-neutral-dark-500">
                  Support reference: {error.digest}
                </p>
              )}
            </details>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={reset} className="flex-1">
              Retry page
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
              className="flex-1"
            >
              Go to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>We encountered an unexpected error. Please try again.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <details className="p-4 bg-neutral-light-100 rounded-lg text-sm">
              <summary className="cursor-pointer font-medium mb-2">Error details</summary>
              <pre className="text-xs overflow-auto">{error.message}</pre>
              {error.digest && (
                <p className="mt-2 text-xs text-neutral-dark-500">Error ID: {error.digest}</p>
              )}
            </details>
          )}
          <div className="flex gap-4">
            <Button onClick={reset} className="flex-1">
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
        </CardContent>
      </Card>
    </div>
  );
}
